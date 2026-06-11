import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { format } from "prettier";
import YAML from "yaml";

const rootDir = path.resolve(new URL("..", import.meta.url).pathname);
const catalogFile = path.join(rootDir, "fonts.catalog.yaml");
const outFile = path.join(rootDir, "src/generated/catalog-data.ts");
const jsonOutFile = path.join(rootDir, "src/generated/catalog-data.json");
const publicJsonOutFile = path.join(
  rootDir,
  "site/public/data/catalog-data.json",
);
const shardsFile = path.join(rootDir, "scripts/data/catalog-shards.json");
const catalog = YAML.parse(readFileSync(catalogFile, "utf8"));

// Shards are produced by build-custom-assets --materialize and kept in a small
// tracked data file so generated catalog files can stay out of git.
const catalogShards = new Map();
if (existsSync(shardsFile)) {
  try {
    for (const [id, shards] of Object.entries(
      JSON.parse(readFileSync(shardsFile, "utf8")),
    )) {
      if (Array.isArray(shards) && shards.length) catalogShards.set(id, shards);
    }
  } catch {
    // First build or invalid shard data: start fresh.
  }
}

const entries = catalog
  .filter((font) => font.source?.type !== "google")
  .map(normalizeFont);

mkdirSync(path.dirname(outFile), { recursive: true });
mkdirSync(path.dirname(publicJsonOutFile), { recursive: true });
writeFileSync(
  outFile,
  await format(
    [
      'import type { FontCatalogEntry } from "../types";',
      "",
      "export const fontCatalog = (",
      JSON.stringify(entries, null, 2),
      ") satisfies FontCatalogEntry[];",
      "",
    ].join("\n"),
    { filepath: outFile },
  ),
  "utf8",
);
writeFileSync(
  jsonOutFile,
  await format(`${JSON.stringify(entries, null, 2)}\n`, {
    filepath: jsonOutFile,
  }),
  "utf8",
);
writeFileSync(publicJsonOutFile, readFileSync(jsonOutFile), "utf8");

console.log(`Wrote ${entries.length} custom catalog entries to ${outFile}`);

function normalizeFont(font) {
  const language = font.language ?? "und";
  const script = scriptForLanguage(language);
  const weights = inferWeights(font);
  const styles = inferStyles(font);
  return {
    id: font.id,
    family: font.family,
    displayName: font.name && font.name !== font.family ? font.name : null,
    language,
    script,
    category: categoryFromTone(font.tone),
    subsets: subsetsForScript(script),
    shards: catalogShards.get(font.id) ?? [],
    weights,
    styles,
    axes: [],
    version: String(font.source?.version ?? "1").replace(/^v/, "") || "1",
    lastModified: String(font.lastModified ?? "2026-06-10"),
    dateAdded: String(font.dateAdded ?? "2026-06-10"),
    designers: designersFor(font),
    description: font.description ?? null,
    license: {
      type: font.license?.type ?? "unknown",
      url: font.license?.url,
    },
    source: {
      kind: "custom",
      type: font.source?.type ?? "custom",
      upstream: upstreamFromSource(font.source),
      owner: font.source?.owner,
      repo: font.source?.repo,
    },
  };
}

function categoryFromTone(tone) {
  if (tone === "sans") return "Sans Serif";
  if (tone === "mono") return "Monospace";
  if (tone === "handwriting") return "Handwriting";
  if (tone === "display") return "Display";
  return "Serif";
}

function scriptForLanguage(language) {
  const value = language.toLowerCase();
  if (value === "zh-hant" || value.startsWith("zh-hant")) return "tc";
  if (value.startsWith("zh")) return "sc";
  if (value.startsWith("ja")) return "jp";
  if (value.startsWith("ko")) return "kr";
  return "latin";
}

function subsetsForScript(script) {
  const bySc = {
    sc: ["chinese-simplified"],
    tc: ["chinese-traditional"],
    jp: ["japanese"],
    kr: ["korean"],
    latin: [],
  };
  return ["menu", ...(bySc[script] ?? []), "latin", "latin-ext"];
}

function designersFor(font) {
  if (Array.isArray(font.designers) && font.designers.length) {
    return font.designers.map(String);
  }
  if (font.designer) return [String(font.designer)];
  if (font.source?.owner) return [String(font.source.owner)];
  return [];
}

function inferWeights(font) {
  const weights = new Set();
  for (const file of font.source?.files ?? []) {
    if (file.weight) weights.add(String(file.weight));
  }
  for (const file of font.source?.assetFiles ?? []) {
    const name = String(file).toLocaleLowerCase();
    if (name.includes("thin")) weights.add("100");
    if (name.includes("extralight")) weights.add("200");
    if (name.includes("light") && !name.includes("extralight")) {
      weights.add("300");
    }
    if (name.includes("regular")) weights.add("400");
    if (name.includes("medium")) weights.add("500");
    if (name.includes("semibold")) weights.add("600");
    if (name.includes("bold") && !name.includes("semibold")) {
      weights.add("700");
    }
    if (name.includes("black")) weights.add("900");
  }
  if (weights.size === 0) weights.add("400");
  return [...weights].sort((a, b) => Number(a) - Number(b));
}

function inferStyles(font) {
  const styles = new Set();
  for (const file of font.source?.files ?? []) {
    if (file.style) styles.add(String(file.style));
  }
  if (styles.size === 0) styles.add("normal");
  return [...styles].sort();
}

function upstreamFromSource(source = {}) {
  if (source.owner && source.repo) {
    return `https://github.com/${source.owner}/${source.repo}`;
  }
  const firstUrl = source.urls?.[0]?.url ?? source.urls?.[0];
  return firstUrl ? String(firstUrl) : undefined;
}
