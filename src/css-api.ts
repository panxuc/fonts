// CSS API (/css and /css2) emulation for custom catalog families. The output
// mirrors what fonts.googleapis.com serves for sliced CJK fonts:
//
//   - For each requested (style, weight) pair the numbered slices come first
//     (ascending numerically, no comment), followed by the named subsets
//     (cyrillic, vietnamese, latin-ext, latin, ... in catalog order) which
//     carry a `/* name */` comment.
//   - The (style, weight) groups are emitted one after another in the order
//     they were requested.
//   - Blocks are separated by a single newline and contain no font-stretch
//     line, matching Google's CJK responses.

import { assetUrl, type FontCatalogEntry } from "./catalog.ts";
import type {
  CssApiRequest,
  CssFamilyRequest,
  FontAssetShard,
} from "./types.ts";

export type CssGenerationOptions = {
  display: string | null;
  staticBaseUrl: string;
  text: string | null;
};

const validDisplayValues = new Set([
  "auto",
  "block",
  "swap",
  "fallback",
  "optional",
]);

// ---------------------------------------------------------------------------
// Request parsing

export function parseCssApiRequest(url: URL): CssApiRequest {
  const endpoint = url.pathname === "/css" ? "/css" : "/css2";
  const display = url.searchParams.get("display");
  const text = url.searchParams.get("text");
  const familyParams = url.searchParams.getAll("family");
  const families =
    endpoint === "/css"
      ? familyParams.flatMap(parseLegacyFamilyList)
      : familyParams.map(parseCss2Family);
  return {
    endpoint,
    display: display && validDisplayValues.has(display) ? display : null,
    text: text || null,
    families,
  };
}

// /css (v1): family=Family+One:400,700italic|Family+Two
function parseLegacyFamilyList(value: string): CssFamilyRequest[] {
  return value
    .split("|")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const [name, variantList = ""] = splitOnce(raw, ":");
      return {
        raw,
        family: normalizeRequestedFamily(name),
        axes: [],
        tuples: [],
        legacyVariants: variantList
          .split(",")
          .map((variant) => variant.trim())
          .filter(Boolean),
      };
    });
}

// /css2: family=Family+Name:ital,wght@0,400;1,700
function parseCss2Family(raw: string): CssFamilyRequest {
  const [name, axisSpec = ""] = splitOnce(raw.trim(), ":");
  const [axisList = "", tupleList = ""] = splitOnce(axisSpec, "@");
  return {
    raw: raw.trim(),
    family: normalizeRequestedFamily(name),
    axes: axisList
      .split(",")
      .map((axis) => axis.trim())
      .filter(Boolean),
    tuples: tupleList
      .split(";")
      .map((tuple) => tuple.trim())
      .filter(Boolean)
      .map((tuple) => tuple.split(",").map((value) => value.trim())),
    legacyVariants: [],
  };
}

function splitOnce(value: string, separator: string): [string, string?] {
  const index = value.indexOf(separator);
  if (index === -1) return [value];
  return [value.slice(0, index), value.slice(index + separator.length)];
}

function normalizeRequestedFamily(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// CSS generation

export function generateCustomCss(
  familyRequest: CssFamilyRequest,
  font: FontCatalogEntry,
  options: CssGenerationOptions,
): string {
  const blocks: string[] = [];
  for (const variant of requestedVariants(familyRequest, font)) {
    let shards = orderedShards(font, variant.shardWeight, variant.style);
    if (options.text !== null) {
      shards = narrowShardsToText(shards, options.text);
    }
    for (const shard of shards) {
      blocks.push(fontFaceBlock(font, variant, shard, options));
    }
  }
  return blocks.join("\n");
}

// Google's emission order for one (style, weight) group: numbered slices
// first in ascending numeric order, then everything else (named subsets and
// our ext-NNN overflow chunks) in the order the catalog stores them.
function orderedShards(
  font: FontCatalogEntry,
  weight: string,
  style: string,
): FontAssetShard[] {
  const matching = font.shards.filter(
    (shard) => shard.weight === weight && shard.style === style,
  );
  const numbered = matching
    .filter((shard) => isNumberedShard(shard.id))
    .sort((left, right) => Number(left.id) - Number(right.id));
  const named = matching.filter((shard) => !isNumberedShard(shard.id));
  return [...numbered, ...named];
}

function isNumberedShard(id: string) {
  return /^\d+$/.test(id);
}

function fontFaceBlock(
  font: FontCatalogEntry,
  variant: ResolvedVariant,
  shard: FontAssetShard,
  options: CssGenerationOptions,
) {
  const lines: string[] = [];
  // Numbered CJK slices render no comment in Google's output; named subsets
  // (and our ext-NNN chunks) render `/* id */`.
  if (!isNumberedShard(shard.id)) lines.push(`/* ${shard.id} */`);
  lines.push(
    "@font-face {",
    `  font-family: '${escapeCssString(font.family)}';`,
    `  font-style: ${variant.style};`,
    `  font-weight: ${variant.cssWeight};`,
  );
  if (options.display) lines.push(`  font-display: ${options.display};`);
  lines.push(
    `  src: url(${assetUrl(font, shard, options.staticBaseUrl)}) format('woff2');`,
    `  unicode-range: ${shard.unicodeRange};`,
    "}",
  );
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Variant resolution

type ResolvedVariant = {
  style: "normal" | "italic";
  // Value emitted as font-weight ("400", or "100 900" for a variable range).
  cssWeight: string;
  // Catalog weight token the shard assets are stored under.
  shardWeight: string;
};

function requestedVariants(
  familyRequest: CssFamilyRequest,
  font: FontCatalogEntry,
): ResolvedVariant[] {
  const pairs: Array<{ style: "normal" | "italic"; weight: string }> = [];

  if (familyRequest.tuples.length) {
    const italIndex = familyRequest.axes.indexOf("ital");
    const wghtIndex = familyRequest.axes.indexOf("wght");
    for (const tuple of familyRequest.tuples) {
      pairs.push({
        style:
          italIndex !== -1 && tuple[italIndex] === "1" ? "italic" : "normal",
        weight: (wghtIndex !== -1 ? tuple[wghtIndex] : undefined) ?? "400",
      });
    }
  } else if (familyRequest.legacyVariants.length) {
    for (const variant of familyRequest.legacyVariants) {
      const parsed = parseLegacyVariant(variant);
      if (parsed) pairs.push(parsed);
    }
  }

  if (!pairs.length) pairs.push({ style: "normal", weight: "400" });

  const variants: ResolvedVariant[] = [];
  const seen = new Set<string>();
  for (const pair of pairs) {
    const style = font.styles.includes(pair.style)
      ? pair.style
      : (font.styles[0] ?? "normal");
    for (const resolved of resolveWeight(pair.weight, font.weights)) {
      const key = `${style}/${resolved.cssWeight}/${resolved.shardWeight}`;
      if (seen.has(key)) continue;
      seen.add(key);
      variants.push({ style, ...resolved });
    }
  }
  return variants;
}

// /css (v1) variant tokens: "400", "700italic", "italic", "bolditalic", "b",
// "bi", "regular", ...
function parseLegacyVariant(
  variant: string,
): { style: "normal" | "italic"; weight: string } | null {
  const value = variant.trim().toLocaleLowerCase();
  if (!value) return null;
  const styleSuffix = value.match(/(italic|oblique|i)$/)?.[1];
  const rest = styleSuffix ? value.slice(0, -styleSuffix.length) : value;
  const weight =
    rest.match(/^\d{1,3}/)?.[0] ?? (rest.startsWith("b") ? "700" : "400");
  return { style: styleSuffix ? "italic" : "normal", weight };
}

// Map a requested weight token onto the weights the catalog actually has:
// exact tokens win, a "min..max" request expands to the discrete weights it
// covers, a discrete request inside a variable token serves that token, and
// anything else falls back to the closest available weight.
function resolveWeight(
  token: string,
  weights: string[],
): Array<{ cssWeight: string; shardWeight: string }> {
  const available = weights.length ? weights : ["400"];
  if (available.includes(token)) {
    return [{ cssWeight: cssWeightValue(token), shardWeight: token }];
  }

  if (token.includes("..")) {
    const [min, max] = token.split("..").map(Number);
    const covered = available.filter((weight) => {
      if (weight.includes("..")) return false;
      const numeric = Number(weight);
      return numeric >= min && numeric <= max;
    });
    if (covered.length) {
      return covered.map((weight) => ({
        cssWeight: weight,
        shardWeight: weight,
      }));
    }
    return [closestWeight((min + max) / 2 || 400, available)];
  }

  const numeric = Number(token);
  if (Number.isFinite(numeric)) {
    const containing = available.find((weight) => {
      if (!weight.includes("..")) return false;
      const [min, max] = weight.split("..").map(Number);
      return numeric >= min && numeric <= max;
    });
    if (containing) return [{ cssWeight: token, shardWeight: containing }];
  }
  return [closestWeight(Number.isFinite(numeric) ? numeric : 400, available)];
}

function closestWeight(target: number, available: string[]) {
  let best = available[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const weight of available) {
    const value = weight.includes("..")
      ? weight.split("..").reduce((sum, part) => sum + Number(part), 0) / 2
      : Number(weight);
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      best = weight;
      bestDistance = distance;
    }
  }
  return { cssWeight: cssWeightValue(best), shardWeight: best };
}

function cssWeightValue(token: string) {
  return token.replace("..", " ");
}

// ---------------------------------------------------------------------------
// text= narrowing

function narrowShardsToText(
  shards: FontAssetShard[],
  text: string,
): FontAssetShard[] {
  const codepoints = [
    ...new Set([...text].map((character) => character.codePointAt(0)!)),
  ].sort((left, right) => left - right);
  const narrowed: FontAssetShard[] = [];
  for (const shard of shards) {
    const matched = codepoints.filter((codepoint) =>
      unicodeRangeIncludes(shard.unicodeRange, codepoint),
    );
    if (!matched.length) continue;
    narrowed.push({
      ...shard,
      unicodeRange: matched
        .map((codepoint) => `U+${codepoint.toString(16).toUpperCase()}`)
        .join(", "),
    });
  }
  return narrowed;
}

function unicodeRangeIncludes(rangeList: string, codepoint: number) {
  return rangeList.split(",").some((part) => {
    const range = part.trim().replace(/^U\+/i, "");
    if (!range) return false;
    const [start, end = start] = range.split("-");
    return (
      codepoint >= parseUnicodeRangePoint(start, "0") &&
      codepoint <= parseUnicodeRangePoint(end, "F")
    );
  });
}

function parseUnicodeRangePoint(value: string, wildcard: "0" | "F") {
  return Number.parseInt(value.replaceAll("?", wildcard), 16);
}

// ---------------------------------------------------------------------------
// Upstream helpers

export function googleCssUrl(
  endpoint: "/css" | "/css2",
  family: CssFamilyRequest,
  sourceUrl: URL,
) {
  const params = new URLSearchParams();
  params.append("family", family.raw);
  for (const key of ["display", "text", "subset", "effect"]) {
    for (const value of sourceUrl.searchParams.getAll(key)) {
      params.append(key, value);
    }
  }
  return `https://fonts.googleapis.com${endpoint}?${params.toString()}`;
}

export function rewriteGstaticUrls(css: string, staticBaseUrl: string) {
  return css.replaceAll(
    "https://fonts.gstatic.com/",
    `${staticBaseUrl}/gstatic/`,
  );
}

function escapeCssString(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
