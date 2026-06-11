import { createHash, webcrypto } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { format } from "prettier";
import YAML from "yaml";

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const generatedCatalog = path.join(rootDir, "src/generated/catalog-data.json");
const generatedCatalogModule = path.join(
  rootDir,
  "src/generated/catalog-data.ts",
);
const rawCatalogFile = path.join(rootDir, "fonts.catalog.yaml");
const catalogShardsFile = path.join(
  rootDir,
  "scripts/data/catalog-shards.json",
);
const cjkSlicesFile = path.join(rootDir, "scripts/data/cjk-slices.json");
const namedSubsetsFile = path.join(rootDir, "scripts/data/named-subsets.json");
const outDir = path.join(rootDir, ".cache/custom-assets");
const sourcesDir = path.join(outDir, "sources");
const filesDir = path.join(outDir, "files");
const outFile = path.join(outDir, "manifest.json");
const args = new Set(process.argv.slice(2));
const materialize = args.has("--materialize");
const uploadR2 = args.has("--upload-r2");
const uploadMethod = process.env.R2_UPLOAD_METHOD?.trim() || "auto";
const filter = new Set(
  (process.env.CUSTOM_FONT_FILTER ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
);
const r2Bucket = process.env.FONT_ASSETS_BUCKET?.trim() || "fonts-assets";
const r2AccountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
const r2AccessKeyId =
  process.env.R2_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim();
const r2SecretAccessKey =
  process.env.R2_SECRET_ACCESS_KEY?.trim() ||
  process.env.AWS_SECRET_ACCESS_KEY?.trim();
const r2UploadConcurrency = optionalPositiveIntegerEnv("R2_UPLOAD_CONCURRENCY");
const r2UploadRetries = positiveIntegerEnv("R2_UPLOAD_RETRIES", 5);
const pyftsubsetBin = existsSync(
  path.join(rootDir, ".venv", "bin", "pyftsubset"),
)
  ? path.join(rootDir, ".venv", "bin", "pyftsubset")
  : "pyftsubset";
const pythonBin = existsSync(path.join(rootDir, ".venv", "bin", "python"))
  ? path.join(rootDir, ".venv", "bin", "python")
  : "python3";
// Google's real CJK slice tables (parsed from live css2 responses) plus the
// named subset ranges Google uses for non-CJK fonts.
const cjkSlices = JSON.parse(readFileSync(cjkSlicesFile, "utf8"));
const namedSubsets = JSON.parse(readFileSync(namedSubsetsFile, "utf8"));
const sliceTableCache = new Map();
const codepointCache = new Map();
const ttcExtractionCache = new Map();
const overflowChunkSize = 512;
const insecureDownloadHosts = new Set(
  (process.env.FONT_DOWNLOAD_INSECURE_HOSTS ?? "tsanger.cn,www.tsanger.cn")
    .split(",")
    .map((host) => host.trim().toLocaleLowerCase())
    .filter(Boolean),
);

let generatedFonts = JSON.parse(readFileSync(generatedCatalog, "utf8"));
const rawFonts = YAML.parse(readFileSync(rawCatalogFile, "utf8"));
const rawById = new Map(rawFonts.map((font) => [font.id, font]));
const customFonts = generatedFonts.filter(
  (font) =>
    font.source.kind === "custom" && (filter.size === 0 || filter.has(font.id)),
);
const preparedSourceFiles = new Map();

if (uploadR2 && selectedUploadMethod() === "wrangler") {
  assertCommand(
    "wrangler",
    ["--version"],
    "wrangler is required for R2 upload",
  );
}

if (materialize) {
  assertCommand(
    pyftsubsetBin,
    ["--help"],
    "pyftsubset is required to build custom font assets",
  );
  assertCommand(
    pythonBin,
    ["--version"],
    "python is required to inspect custom font coverage",
  );

  for (const font of customFonts) {
    const rawFont = rawById.get(font.id);
    if (!rawFont) throw new Error(`Missing raw catalog entry for ${font.id}`);
    const sourceFiles = await prepareSourceFiles(rawFont);
    preparedSourceFiles.set(font.id, sourceFiles);
    applyFontShards(font, rawFont, sourceFiles);
  }
  await writeGeneratedCatalog(generatedFonts);
  await writeCatalogShards(generatedFonts);
}

// Plan-only mode never invents shards: fonts the materialize step has not run
// for yet (empty `shards` in the catalog) simply plan zero assets.
const assets = customFonts.flatMap((font) =>
  planFontAssets(font, rawById.get(font.id)),
);
const fontsWithoutShards = customFonts
  .filter((font) => !font.shards?.length)
  .map((font) => font.id);

mkdirSync(outDir, { recursive: true });
writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      mode: materialize ? "materialized" : "manifest",
      count: assets.length,
      fontsWithoutShards,
      assets,
    },
    null,
    2,
  )}\n`,
);

if (!materialize) {
  if (fontsWithoutShards.length) {
    console.log(
      `${fontsWithoutShards.length} fonts have no materialized shards yet (run --materialize): ${fontsWithoutShards.join(", ")}`,
    );
  }
  console.log(`Planned ${assets.length} custom font assets in ${outFile}`);
  process.exit(0);
}

for (const font of customFonts) {
  const rawFont = rawById.get(font.id);
  if (!rawFont) throw new Error(`Missing raw catalog entry for ${font.id}`);
  const sourceFiles =
    preparedSourceFiles.get(font.id) ?? (await prepareSourceFiles(rawFont));
  const fontAssets = assets.filter((asset) => asset.fontId === font.id);
  rmSync(path.join(filesDir, "s", font.id, `v${font.version}`), {
    recursive: true,
    force: true,
  });
  for (const asset of fontAssets) {
    const sourceFile = subsettableSourceFile(
      rawFont,
      sourceFiles,
      asset.weight,
      asset.style,
    );
    subsetAsset({ asset, sourceFile });
  }
  console.log(`Built ${fontAssets.length} assets for ${font.id}`);
}

if (uploadR2) {
  await uploadAssets(assets);
}

console.log(
  `${uploadR2 ? "Built and uploaded" : "Built"} ${assets.length} custom font assets using ${pyftsubsetBin}.`,
);

// ---------------------------------------------------------------------------
// Asset planning (must match assetKey() in src/catalog.ts)

function planFontAssets(font, rawFont) {
  return (font.shards ?? []).map((shard) => {
    const sourceSpec = sourceSpecFor(rawFont, shard.weight, shard.style);
    const key = assetKey(font, shard);
    return {
      key,
      filePath: path.posix.join(".cache/custom-assets/files", key),
      fontId: font.id,
      family: font.family,
      shardId: shard.id,
      unicodeRange: shard.unicodeRange,
      weight: shard.weight,
      style: shard.style,
      sourcePath: sourceSpec?.path ?? null,
    };
  });
}

function assetKey(font, shard) {
  const style = shard.style === "italic" ? "italic" : "normal";
  return `s/${font.id}/v${font.version}/${font.id}-${style}-${shard.weight}.${shard.id}.woff2`;
}

// ---------------------------------------------------------------------------
// Google-style slicing

function applyFontShards(font, rawFont, sourceFiles) {
  const sliceTable = sliceTableFor(font.script);
  const shards = [];
  for (const weight of font.weights) {
    for (const style of font.styles) {
      const sourceFile = subsettableSourceFile(
        rawFont,
        sourceFiles,
        weight,
        style,
      );
      const codepoints = fontCodepoints(sourceFile);
      if (codepoints.length === 0) {
        throw new Error(
          `No Unicode cmap entries found for ${font.family} in ${sourceFile}`,
        );
      }
      const plannedShards = sliceShardsForCodepoints(sliceTable, codepoints);
      for (const shard of plannedShards) {
        shards.push({
          id: shard.id,
          unicodeRange: shard.unicodeRange,
          weight: String(weight),
          style: String(style),
        });
      }
      console.log(
        `Sliced ${font.id} ${weight} ${style}: ${plannedShards.length} shards covering ${codepoints.length} codepoints`,
      );
    }
  }

  font.shards = shards;
}

// The slice table for CJK scripts comes straight from Google's css2 output
// (numbered slices plus named tail subsets); everything else uses Google's
// named subset ranges. Tables are normalized to numeric-ascending order with
// named slices after, which is also the order Google emits.
function sliceTableFor(script) {
  const cached = sliceTableCache.get(script);
  if (cached) return cached;

  const rawTable = cjkSlices[script]
    ? cjkSlices[script].map((slice) => ({
        id: slice.id,
        ranges: parseUnicodeRanges(slice.unicodeRange),
      }))
    : Object.entries(namedSubsets).map(([id, unicodeRange]) => ({
        id,
        ranges: parseUnicodeRanges(unicodeRange),
      }));

  const numeric = rawTable
    .filter((slice) => /^\d+$/.test(slice.id))
    .sort((left, right) => Number(left.id) - Number(right.id));
  const named = rawTable.filter((slice) => !/^\d+$/.test(slice.id));
  const table = [...numeric, ...named];
  sliceTableCache.set(script, table);
  return table;
}

function sliceShardsForCodepoints(sliceTable, codepoints) {
  const shards = [];
  const covered = new Set();
  for (const slice of sliceTable) {
    const matched = intersectCodepoints(codepoints, slice.ranges);
    if (matched.length === 0) continue;
    for (const codepoint of matched) covered.add(codepoint);
    shards.push({
      id: slice.id,
      unicodeRange: codepointsToUnicodeRange(matched),
    });
  }

  // Codepoints outside every slice (PUA, rare ideographs, ...) still need a
  // home so the family keeps full coverage: append fixed-size ext chunks.
  const overflow = codepoints.filter((codepoint) => !covered.has(codepoint));
  chunkCodepoints(overflow, overflowChunkSize).forEach((chunk, index) => {
    shards.push({
      id: `ext-${String(index).padStart(3, "0")}`,
      unicodeRange: codepointsToUnicodeRange(chunk),
    });
  });
  return shards;
}

function chunkCodepoints(codepoints, targetSize) {
  const chunks = [];
  for (let index = 0; index < codepoints.length; index += targetSize) {
    chunks.push(codepoints.slice(index, index + targetSize));
  }
  return chunks;
}

function intersectCodepoints(codepoints, ranges) {
  const matched = [];
  for (const [start, end] of ranges) {
    let index = lowerBound(codepoints, start);
    while (index < codepoints.length && codepoints[index] <= end) {
      matched.push(codepoints[index]);
      index += 1;
    }
  }
  return [...new Set(matched)].sort((left, right) => left - right);
}

function lowerBound(sorted, value) {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (sorted[mid] < value) low = mid + 1;
    else high = mid;
  }
  return low;
}

function parseUnicodeRanges(value) {
  return String(value)
    .split(",")
    .map((token) => {
      const match = token
        .trim()
        .match(/^U\+([0-9A-Fa-f]{1,6})(?:-([0-9A-Fa-f]{1,6}))?$/);
      if (!match) {
        throw new Error(`Invalid unicode-range token: ${token.trim()}`);
      }
      const start = Number.parseInt(match[1], 16);
      const end = match[2] ? Number.parseInt(match[2], 16) : start;
      return [start, end];
    });
}

function codepointsToUnicodeRange(codepoints) {
  const ranges = [];
  let start = null;
  let previous = null;

  for (const codepoint of codepoints) {
    if (start === null) {
      start = codepoint;
      previous = codepoint;
      continue;
    }
    if (codepoint === previous + 1) {
      previous = codepoint;
      continue;
    }
    ranges.push([start, previous]);
    start = codepoint;
    previous = codepoint;
  }
  if (start !== null) ranges.push([start, previous]);

  return ranges
    .map(([rangeStart, rangeEnd]) =>
      rangeStart === rangeEnd
        ? `U+${formatCodepoint(rangeStart)}`
        : `U+${formatCodepoint(rangeStart)}-${formatCodepoint(rangeEnd)}`,
    )
    .join(", ");
}

function formatCodepoint(codepoint) {
  return codepoint.toString(16).toUpperCase().padStart(4, "0");
}

// ---------------------------------------------------------------------------
// Catalog output

async function writeGeneratedCatalog(fonts) {
  writeFileSync(
    generatedCatalog,
    await format(`${JSON.stringify(fonts, null, 2)}\n`, {
      filepath: generatedCatalog,
    }),
    "utf8",
  );
  writeFileSync(
    generatedCatalogModule,
    await format(
      [
        'import type { FontCatalogEntry } from "../types";',
        "",
        "export const fontCatalog = (",
        JSON.stringify(fonts, null, 2),
        ") satisfies FontCatalogEntry[];",
        "",
      ].join("\n"),
      { filepath: generatedCatalogModule },
    ),
    "utf8",
  );
}

async function writeCatalogShards(fonts) {
  const shardsByFont = {};
  for (const font of fonts) {
    if (font.shards?.length) shardsByFont[font.id] = font.shards;
  }
  writeFileSync(
    catalogShardsFile,
    await format(`${JSON.stringify(shardsByFont, null, 2)}\n`, {
      filepath: catalogShardsFile,
    }),
    "utf8",
  );
}

// ---------------------------------------------------------------------------
// Font inspection

function fontCodepoints(sourceFile) {
  const cached = codepointCache.get(sourceFile);
  if (cached) return cached;

  const result = spawnSync(
    pythonBin,
    [
      "-c",
      [
        "import json, pathlib, sys",
        "from fontTools.ttLib import TTFont",
        "path = pathlib.Path(sys.argv[1])",
        "if path.suffix.lower() in {'.ttc', '.otc'}:",
        "    raise SystemExit('collection files must have a member extracted before reading the cmap: ' + str(path))",
        "font = TTFont(str(path), lazy=True)",
        "try:",
        "    codepoints = set()",
        "    if 'cmap' in font:",
        "        for table in font['cmap'].tables:",
        "            if table.isUnicode():",
        "                codepoints.update(int(value) for value in table.cmap.keys())",
        "    print(json.dumps(sorted(value for value in codepoints if 0 <= value <= 0x10FFFF and not 0xD800 <= value <= 0xDFFF)))",
        "finally:",
        "    font.close()",
      ].join("\n"),
      sourceFile,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to inspect cmap for ${sourceFile}: ${result.stderr || result.stdout}`,
    );
  }
  const codepoints = JSON.parse(result.stdout);
  codepointCache.set(sourceFile, codepoints);
  return codepoints;
}

// Resolve the file pyftsubset should read for a (weight, style) pair. TTC/OTC
// collections cannot be subset directly, so the matching member font gets
// extracted (and cached) as a standalone .ttf first.
function subsettableSourceFile(rawFont, sourceFiles, weight, style) {
  const sourceSpec = sourceSpecFor(rawFont, weight, style);
  const picked = pickSourceFile(sourceFiles, sourceSpec?.path ?? null);
  if (!/\.(ttc|otc)$/i.test(picked)) return picked;
  return extractTtcMember(rawFont, picked, sourceSpec);
}

function extractTtcMember(rawFont, collectionFile, sourceSpec) {
  const families = [rawFont.family, sourceSpec?.family]
    .filter(Boolean)
    .map(String);
  const fallbackIndex = Number.isInteger(sourceSpec?.fontNumber)
    ? sourceSpec.fontNumber
    : -1;
  const cacheKey = [collectionFile, families.join("|"), fallbackIndex].join(" ");
  const cached = ttcExtractionCache.get(cacheKey);
  if (cached) return cached;

  const targetDir = path.join(sourcesDir, rawFont.id, "extracted-ttc");
  const result = spawnSync(
    pythonBin,
    [
      "-c",
      [
        "import json, pathlib, sys",
        "from fontTools.ttLib import TTCollection",
        "source = pathlib.Path(sys.argv[1])",
        "target_dir = pathlib.Path(sys.argv[2])",
        "families = [value.lower() for value in json.loads(sys.argv[3]) if value]",
        "fallback_index = int(sys.argv[4])",
        "collection = TTCollection(str(source), lazy=True)",
        "try:",
        "    count = len(collection.fonts)",
        "    index = None",
        "    for member_index, font in enumerate(collection.fonts):",
        "        if index is not None:",
        "            break",
        "        if 'name' not in font:",
        "            continue",
        "        for record in font['name'].names:",
        "            if record.nameID not in (1, 16):",
        "                continue",
        "            try:",
        "                value = record.toUnicode().lower()",
        "            except Exception:",
        "                continue",
        "            if any(family in value for family in families):",
        "                index = member_index",
        "                break",
        "    if index is None and 0 <= fallback_index < count:",
        "        index = fallback_index",
        "    if index is None:",
        "        index = 0",
        "    target = target_dir / (source.stem + '-' + str(index) + '.ttf')",
        "    if not target.exists():",
        "        target_dir.mkdir(parents=True, exist_ok=True)",
        "        partial = target.parent / (target.name + '.part')",
        "        collection.fonts[index].save(str(partial))",
        "        partial.replace(target)",
        "    print(json.dumps({'index': index, 'path': str(target)}))",
        "finally:",
        "    collection.close()",
      ].join("\n"),
      collectionFile,
      targetDir,
      JSON.stringify(families),
      String(fallbackIndex),
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `Failed to extract a member font from ${collectionFile}: ${result.stderr || result.stdout}`,
    );
  }
  const extracted = JSON.parse(result.stdout.trim().split("\n").pop());
  console.log(
    `Using member ${extracted.index} of ${path.basename(collectionFile)} for ${rawFont.id}`,
  );
  ttcExtractionCache.set(cacheKey, extracted.path);
  return extracted.path;
}

function sourceSpecFor(rawFont, weight, style) {
  const files = rawFont?.source?.files ?? [];
  return (
    files.find(
      (file) =>
        String(file.weight ?? "400") === String(weight) &&
        String(file.style ?? "normal") === String(style),
    ) ??
    files.find((file) => String(file.weight ?? "400") === String(weight)) ??
    files[0] ??
    null
  );
}

// ---------------------------------------------------------------------------
// Source acquisition

async function prepareSourceFiles(rawFont) {
  const fontDir = path.join(sourcesDir, rawFont.id);
  const downloadsDir = path.join(fontDir, "downloads");
  const extractedDir = path.join(fontDir, "extracted");
  mkdirSync(downloadsDir, { recursive: true });
  mkdirSync(extractedDir, { recursive: true });

  const source = rawFont.source ?? {};
  const downloads = [];
  if (source.type === "webRelease") {
    for (const assetFile of source.assetFiles ?? []) {
      const filename = templateVersion(assetFile, source.version);
      const url = githubReleaseUrl(source, filename);
      downloads.push(await download(url, path.join(downloadsDir, filename)));
    }
  } else if (source.type === "webUrl") {
    for (const entry of source.urls ?? []) {
      const url = typeof entry === "string" ? entry : entry.url;
      const filename =
        (typeof entry === "object" && entry.filename) ||
        path.basename(new URL(url).pathname) ||
        `${shortHash(url)}.bin`;
      downloads.push(await download(url, path.join(downloadsDir, filename)));
    }
  } else {
    throw new Error(
      `Unsupported custom source type for ${rawFont.id}: ${source.type}`,
    );
  }

  for (const file of downloads) {
    if (isArchive(file)) extractArchive(file, extractedDir);
  }

  return [
    ...recursiveFiles(downloadsDir).filter(isFontFile),
    ...recursiveFiles(extractedDir).filter(isFontFile),
  ];
}

function githubReleaseUrl(source, filename) {
  const versionPath =
    source.version && source.version !== "latest"
      ? `download/${encodeURIComponent(source.version)}`
      : "latest/download";
  return `https://github.com/${source.owner}/${source.repo}/releases/${versionPath}/${encodePath(filename)}`;
}

async function download(url, target) {
  if (existsSync(target)) return target;
  mkdirSync(path.dirname(target), { recursive: true });
  console.log(`Downloading ${url}`);

  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(900_000),
      headers: process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {},
    });
  } catch (error) {
    return downloadWithCurl(url, target, error);
  }

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }

  const tempTarget = `${target}.part`;
  rmSync(tempTarget, { force: true });
  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(tempTarget),
  );
  rename(tempTarget, target);
  return target;
}

function downloadWithCurl(url, target, fetchError) {
  const tempTarget = `${target}.part`;
  rmSync(tempTarget, { force: true });

  const curl = runCurlDownload(url, tempTarget);

  if (
    curl.status !== 0 &&
    insecureDownloadAllowed(url) &&
    tlsVerificationFailed(fetchError, curl)
  ) {
    console.warn(
      `Retrying ${url} with curl --insecure because the upstream certificate chain is not trusted by this build environment.`,
    );
    rmSync(tempTarget, { force: true });
    const insecureCurl = runCurlDownload(url, tempTarget, { insecure: true });
    if (insecureCurl.status === 0) {
      rename(tempTarget, target);
      return target;
    }
    rmSync(tempTarget, { force: true });
    throwDownloadError(url, fetchError, curl, insecureCurl);
  }

  if (curl.status !== 0) {
    rmSync(tempTarget, { force: true });
    throwDownloadError(url, fetchError, curl);
  }

  rename(tempTarget, target);
  return target;
}

function runCurlDownload(url, target, { insecure = false } = {}) {
  return spawnSync(
    "curl",
    [
      "--fail",
      "--location",
      "--show-error",
      "--silent",
      "--retry",
      "3",
      "--retry-all-errors",
      "--connect-timeout",
      "30",
      "--max-time",
      "900",
      ...(insecure ? ["--insecure"] : []),
      "--output",
      target,
      url,
    ],
    { encoding: "utf8" },
  );
}

function insecureDownloadAllowed(value) {
  if (insecureDownloadHosts.has("*")) return true;
  try {
    const hostname = new URL(value).hostname.toLocaleLowerCase();
    return insecureDownloadHosts.has(hostname);
  } catch {
    return false;
  }
}

function tlsVerificationFailed(fetchError, curl) {
  return /certificate|CERT|UNABLE_TO_VERIFY|issuer/i.test(
    `${errorMessage(fetchError)}\n${curl.stderr}\n${curl.stdout}`,
  );
}

function throwDownloadError(url, fetchError, curl, insecureCurl = null) {
  throw new Error(
    [
      `Failed to download ${url}`,
      `fetch error: ${errorMessage(fetchError)}`,
      `curl error: ${curlOutput(curl)}`,
      insecureCurl ? `curl --insecure error: ${curlOutput(insecureCurl)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}

function curlOutput(curl) {
  return curl.stderr || curl.stdout || `exit ${curl.status}`;
}

function errorMessage(error) {
  if (error instanceof Error) {
    return error.cause
      ? `${error.message}; cause: ${errorMessage(error.cause)}`
      : error.message;
  }
  return String(error);
}

function extractArchive(archive, targetDir) {
  const result = spawnSync(
    pythonBin,
    [
      "-c",
      [
        "import pathlib, sys, tarfile, zipfile",
        "archive = pathlib.Path(sys.argv[1])",
        "target = pathlib.Path(sys.argv[2])",
        "target.mkdir(parents=True, exist_ok=True)",
        "name = archive.name.lower()",
        "if name.endswith('.zip'):",
        "    zipfile.ZipFile(archive).extractall(target)",
        "elif name.endswith(('.tar', '.tar.gz', '.tgz', '.tar.bz2', '.tbz2', '.tar.xz', '.txz')):",
        "    tarfile.open(archive).extractall(target)",
      ].join("\n"),
      archive,
      targetDir,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Failed to extract ${archive}`);
  }
}

// ---------------------------------------------------------------------------
// Subsetting and upload

function subsetAsset({ asset, sourceFile }) {
  const targetFile = assetFilePath(asset);
  mkdirSync(path.dirname(targetFile), { recursive: true });
  const result = spawnSync(
    pyftsubsetBin,
    [
      sourceFile,
      `--output-file=${targetFile}`,
      "--flavor=woff2",
      "--layout-features=*",
      "--no-hinting",
      `--unicodes=${asset.unicodeRange.replaceAll(" ", "")}`,
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(
      `pyftsubset failed for ${asset.family} ${asset.weight} ${asset.style} shard ${asset.shardId}`,
    );
  }
}

async function uploadAssets(assets) {
  if (assets.length === 0) return;
  const method = selectedUploadMethod();
  const concurrency = r2UploadConcurrency ?? (method === "s3" ? 8 : 2);
  console.log(
    `Uploading ${assets.length} assets to R2 bucket ${r2Bucket} using ${method} with concurrency ${concurrency}.`,
  );
  await runPool(assets, concurrency, async (asset, index) => {
    await uploadAssetWithRetry(asset, method, index + 1, assets.length);
  });
}

function selectedUploadMethod() {
  const method = uploadMethod.toLocaleLowerCase();
  if (method === "s3") {
    if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error(
        "R2_UPLOAD_METHOD=s3 requires CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
      );
    }
    return method;
  }
  if (method === "wrangler") return method;
  if (method !== "auto") {
    throw new Error(
      `Unsupported R2_UPLOAD_METHOD=${uploadMethod}; expected auto, s3, or wrangler.`,
    );
  }
  return r2AccountId && r2AccessKeyId && r2SecretAccessKey ? "s3" : "wrangler";
}

async function uploadAssetWithRetry(asset, method, position, total) {
  let lastError = null;
  for (let attempt = 1; attempt <= r2UploadRetries + 1; attempt += 1) {
    try {
      if (method === "s3") await uploadAssetWithS3(asset);
      else uploadAssetWithWrangler(asset);
      if (position === total || position % 25 === 0) {
        console.log(`Uploaded ${position}/${total} assets`);
      }
      return;
    } catch (error) {
      lastError = error;
      if (attempt > r2UploadRetries) break;
      const delay = retryDelayMs(attempt);
      console.warn(
        `Upload failed for ${asset.key} (attempt ${attempt}/${r2UploadRetries + 1}): ${errorMessage(error)}. Retrying in ${Math.round(delay / 1000)}s.`,
      );
      await sleep(delay);
    }
  }
  throw new Error(
    `Failed to upload ${asset.key} to R2 bucket ${r2Bucket}: ${errorMessage(lastError)}`,
  );
}

async function uploadAssetWithS3(asset) {
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey) {
    throw new Error(
      "S3 upload requires CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.",
    );
  }
  const targetFile = assetFilePath(asset);
  const objectPath = `${r2Bucket}/${asset.key}`;
  const endpoint = `https://${r2AccountId}.r2.cloudflarestorage.com/${encodeS3Path(objectPath)}`;
  const payloadHash = sha256Hex(readFileSync(targetFile));
  const now = new Date();
  const amzDate = timestamp(now);
  const dateStamp = amzDate.slice(0, 8);
  const headers = {
    "content-length": String(statSync(targetFile).size),
    "content-type": "font/woff2",
    host: `${r2AccountId}.r2.cloudflarestorage.com`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("");
  const canonicalRequest = [
    "PUT",
    `/${encodeS3Path(objectPath)}`,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hex(
    await hmac(
      await signingKey(r2SecretAccessKey, dateStamp),
      new TextEncoder().encode(stringToSign),
    ),
  );
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: {
      ...headers,
      Authorization: [
        `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId}/${credentialScope}`,
        `SignedHeaders=${signedHeaders}`,
        `Signature=${signature}`,
      ].join(", "),
    },
    body: createReadStream(targetFile),
    duplex: "half",
  });
  if (!response.ok) {
    throw new Error(
      `S3 PUT ${response.status} ${response.statusText}: ${await response.text()}`,
    );
  }
}

function uploadAssetWithWrangler(asset) {
  const targetFile = assetFilePath(asset);
  const result = spawnSync(
    "wrangler",
    [
      "r2",
      "object",
      "put",
      `${r2Bucket}/${asset.key}`,
      "--file",
      targetFile,
      "--content-type",
      "font/woff2",
      "--remote",
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Failed to upload ${asset.key} to R2 bucket ${r2Bucket}`);
  }
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index], index);
      }
    },
  );
  await Promise.all(workers);
}

function retryDelayMs(attempt) {
  const base = Math.min(60_000, 1_000 * 2 ** (attempt - 1));
  return base + Math.floor(Math.random() * 500);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function encodeS3Path(value) {
  return value
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function timestamp(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function signingKey(secret, dateStamp) {
  const encoder = new TextEncoder();
  const dateKey = await hmac(encoder.encode(`AWS4${secret}`), dateStamp);
  const regionKey = await hmac(dateKey, "auto");
  const serviceKey = await hmac(regionKey, "s3");
  return hmac(serviceKey, "aws4_request");
}

async function hmac(key, value) {
  const cryptoKey = await webcrypto.subtle.importKey(
    "raw",
    key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  return new Uint8Array(await webcrypto.subtle.sign("HMAC", cryptoKey, data));
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pickSourceFile(sourceFiles, sourcePath) {
  if (sourceFiles.length === 0) {
    throw new Error("No source font files were downloaded or extracted.");
  }
  if (!sourcePath) return sourceFiles[0];
  const normalized = sourcePath.replaceAll("\\", "/").toLowerCase();
  return (
    sourceFiles.find((file) =>
      file.replaceAll("\\", "/").toLowerCase().endsWith(normalized),
    ) ??
    sourceFiles.find(
      (file) => path.basename(file).toLowerCase() === path.basename(normalized),
    ) ??
    sourceFiles[0]
  );
}

function assetFilePath(asset) {
  return path.resolve(rootDir, asset.filePath);
}

function recursiveFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir).map((entry) => path.join(dir, entry));
  return entries.flatMap((entry) =>
    statSync(entry).isDirectory() ? recursiveFiles(entry) : [entry],
  );
}

function isFontFile(file) {
  return /\.(otf|ttf|ttc|otc|woff2?)$/i.test(file);
}

function isArchive(file) {
  return /\.(zip|tar|tar\.gz|tgz|tar\.bz2|tbz2|tar\.xz|txz)$/i.test(file);
}

function templateVersion(value, version) {
  return String(value).replaceAll("{version}", version ?? "");
}

function encodePath(value) {
  return String(value)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function shortHash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

function positiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function optionalPositiveIntegerEnv(name) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function assertCommand(command, commandArgs, message) {
  const result = spawnSync(command, commandArgs, { stdio: "ignore" });
  if (result.status !== 0) throw new Error(message);
}

function rename(from, to) {
  rmSync(to, { force: true });
  writeFileSync(to, readFileSync(from));
  rmSync(from, { force: true });
}
