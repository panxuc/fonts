import { fontCatalog } from "./generated/catalog-data.ts";
import type {
  FamilyDetailMetadata,
  FamilyMetadata,
  FamilyMetadataFont,
  FontCatalogEntry,
  MetadataFontsResponse,
  WebfontItem,
  WebfontsResponse,
} from "./types";

export { fontCatalog };
export type { FontCatalogEntry };

const familyIndex = new Map(
  fontCatalog.map((font) => [normalizeFamily(font.family), font]),
);

export function findCustomFamily(family: string): FontCatalogEntry | null {
  return familyIndex.get(normalizeFamily(family)) ?? null;
}

export function customFamilies(): FontCatalogEntry[] {
  return fontCatalog;
}

export function normalizeFamily(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// familyMetadataList entries (shape of fonts.google.com/metadata/fonts)

export function toFamilyMetadata(
  font: FontCatalogEntry,
  ordinal: number,
): FamilyMetadata {
  return {
    family: font.family,
    displayName: font.displayName,
    category: font.category,
    stroke: strokeForCategory(font.category),
    classifications: classificationsForCategory(font.category),
    size: 0,
    subsets: font.subsets,
    fonts: fontsMap(font),
    axes: font.axes,
    designers: font.designers,
    lastModified: font.lastModified,
    dateAdded: font.dateAdded,
    popularity: ordinal,
    trending: ordinal,
    defaultSort: ordinal,
    androidFragment: null,
    isNoto: false,
    colorCapabilities: [],
    primaryScript: primaryScriptFor(font.script),
    primaryLanguage: font.language,
    isOpenSource: isOpenSourceLicense(font.license.type),
    isBrandFont: false,
    languages: languagesFor(font),
  };
}

export function appendCustomFamilyMetadata(
  response: MetadataFontsResponse,
): MetadataFontsResponse {
  const seen = new Set(
    response.familyMetadataList.map((font) => normalizeFamily(font.family)),
  );
  let maxSort = 0;
  for (const font of response.familyMetadataList) {
    maxSort = Math.max(
      maxSort,
      font.defaultSort ?? 0,
      font.popularity ?? 0,
      font.trending ?? 0,
    );
  }
  const custom = fontCatalog
    .filter((font) => !seen.has(normalizeFamily(font.family)))
    .map((font, index) => toFamilyMetadata(font, maxSort + index + 1));
  return {
    ...response,
    familyMetadataList: [...response.familyMetadataList, ...custom],
  };
}

export function toMetadataFontsResponse(): MetadataFontsResponse {
  return {
    axisRegistry: [],
    familyMetadataList: fontCatalog.map((font, index) =>
      toFamilyMetadata(font, index + 1),
    ),
    promotedScript: null,
  };
}

// ---------------------------------------------------------------------------
// Per-family metadata (shape of fonts.google.com/metadata/fonts/<family>)

export function toFamilyDetailMetadata(
  font: FontCatalogEntry,
): FamilyDetailMetadata {
  return {
    family: font.family,
    displayName: font.displayName,
    coverage: coverageFor(font),
    fonts: fontsMap(font),
    axes: font.axes,
    stats: null,
    description: font.description,
    license: licenseSlug(font.license.type),
    designers: font.designers.map((name) => ({
      name,
      bio: null,
      imageUrl: null,
    })),
    fontUses: null,
    category: font.category,
    stroke: strokeForCategory(font.category),
    classifications: classificationsForCategory(font.category),
    lastModified: font.lastModified,
    size: 0,
    updateNotes: [],
    isNoto: false,
    colorCapabilities: [],
    primaryScript: primaryScriptFor(font.script),
    primaryLanguage: font.language,
    article: null,
    languages: languagesFor(font),
    minisiteUrl: font.source.upstream ?? "",
    isOpenSource: isOpenSourceLicense(font.license.type),
  };
}

// ---------------------------------------------------------------------------
// Developer API items

export function toWebfontItem(
  font: FontCatalogEntry,
  staticBase: string,
): WebfontItem {
  const files: Record<string, string> = {};
  for (const style of font.styles) {
    for (const weight of font.weights) {
      const variant = variantName(weight, style);
      const shard = representativeShard(font, weight, style);
      if (shard) {
        files[variant] = assetUrl(font, shard, staticBase);
      }
    }
  }
  return {
    kind: "webfonts#webfont",
    family: font.family,
    category: font.category.toLocaleLowerCase().replace(/\s+/g, "-"),
    variants: font.styles.flatMap((style) =>
      font.weights.map((weight) => variantName(weight, style)),
    ),
    subsets: font.subsets.filter((subset) => subset !== "menu"),
    version: `v${font.version}`,
    lastModified: font.lastModified,
    files,
  };
}

export function toWebfontsResponse(staticBase: string): WebfontsResponse {
  return {
    kind: "webfonts#webfontList",
    items: [...fontCatalog]
      .sort((a, b) => a.family.localeCompare(b.family))
      .map((font) => toWebfontItem(font, staticBase)),
  };
}

export function mergeCustomWebfonts(
  official: WebfontsResponse,
  staticBase: string,
): WebfontsResponse {
  const seen = new Set(official.items.map((item) => item.family));
  const custom = fontCatalog
    .filter((font) => !seen.has(font.family))
    .map((font) => toWebfontItem(font, staticBase));
  return { ...official, items: [...official.items, ...custom] };
}

// ---------------------------------------------------------------------------
// Asset addressing (must match scripts/build-custom-assets.mjs output)

export function assetKey(font: FontCatalogEntry, shard: FontAssetShardLike) {
  const style = shard.style === "italic" ? "italic" : "normal";
  return `s/${font.id}/v${font.version}/${font.id}-${style}-${shard.weight}.${shard.id}.woff2`;
}

export function assetUrl(
  font: FontCatalogEntry,
  shard: FontAssetShardLike,
  staticBase: string,
) {
  return `${staticBase}/${assetKey(font, shard)}`;
}

type FontAssetShardLike = {
  id: string;
  weight: string;
  style: string;
};

function representativeShard(
  font: FontCatalogEntry,
  weight: string,
  style: string,
) {
  const shards = font.shards.filter(
    (shard) => shard.weight === weight && shard.style === style,
  );
  return shards.find((shard) => shard.id === "latin") ?? shards[0] ?? null;
}

// ---------------------------------------------------------------------------

function variantName(weight: string, style: string) {
  if (style === "italic") {
    return weight === "400" ? "italic" : `${weight}italic`;
  }
  return weight === "400" ? "regular" : weight;
}

function fontsMap(font: FontCatalogEntry): Record<string, FamilyMetadataFont> {
  const entries: Array<[string, FamilyMetadataFont]> = [];
  for (const style of font.styles) {
    for (const weight of font.weights) {
      entries.push([
        `${weight}${style === "italic" ? "i" : ""}`,
        {
          thickness: thicknessForWeight(weight),
          slant: style === "italic" ? 4 : 1,
          width: 7,
          lineHeight: 1,
        },
      ]);
    }
  }
  return Object.fromEntries(entries);
}

function thicknessForWeight(weight: string) {
  const numeric = Number(weight);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(1, Math.min(10, Math.round(numeric / 100) + 1));
}

function strokeForCategory(category: string) {
  if (category === "Sans Serif" || category === "Monospace") {
    return "Sans Serif";
  }
  if (category === "Serif") return "Serif";
  return null;
}

function classificationsForCategory(category: string) {
  if (category === "Display") return ["Display"];
  if (category === "Handwriting") return ["Handwriting"];
  if (category === "Monospace") return ["Monospace"];
  return [];
}

function primaryScriptFor(script: string) {
  if (script === "sc") return "Hans";
  if (script === "tc") return "Hant";
  if (script === "jp") return "Jpan";
  if (script === "kr") return "Kore";
  return "";
}

function languagesFor(font: FontCatalogEntry) {
  if (font.script === "sc") return ["zh_Hani", "zh_Hans"];
  if (font.script === "tc") return ["zh_Hani", "zh_Hant"];
  if (font.script === "jp") return ["ja_Jpan"];
  if (font.script === "kr") return ["ko_Kore"];
  return ["en_Latn"];
}

function licenseSlug(license: string) {
  const value = license.toLocaleLowerCase();
  if (value.includes("ofl")) return "ofl";
  if (value.includes("apache")) return "apache2";
  if (value.includes("gpl")) return "gpl";
  if (value.includes("ipa")) return "ipa";
  if (value.includes("mit")) return "mit";
  return value || "unknown";
}

function isOpenSourceLicense(license: string) {
  const value = license.toLocaleLowerCase();
  return ["ofl", "apache", "gpl", "ipa", "mit"].some((token) =>
    value.includes(token),
  );
}

function coverageFor(font: FontCatalogEntry): Record<string, string> {
  const primary = font.subsets.find((subset) => subset !== "menu") ?? "latin";
  const points: Array<[number, number]> = [];
  for (const shard of font.shards) {
    if (shard.weight !== font.weights[0] || shard.style !== font.styles[0]) {
      continue;
    }
    for (const part of shard.unicodeRange.split(",")) {
      const match = part.trim().match(/^U\+([0-9A-F]+)(?:-([0-9A-F]+))?$/i);
      if (!match) continue;
      const start = Number.parseInt(match[1], 16);
      const end = match[2] ? Number.parseInt(match[2], 16) : start;
      points.push([start, end]);
    }
  }
  points.sort((a, b) => a[0] - b[0]);
  const out: string[] = [];
  for (const [start, end] of points) {
    out.push(start === end ? String(start) : `${start}-${end}`);
  }
  return { [primary]: out.join(",") };
}
