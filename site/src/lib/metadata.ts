// Runtime catalog data, fetched the same way fonts.google.com fetches it.

import type {
  FamilyDetailMetadata,
  FamilyMetadata,
  MetadataFontsResponse,
} from "../../../src/types";
import { GLASS_SAMPLE_TEXT, glassSampleCodeForLanguage } from "./glass-samples";

export type { FamilyDetailMetadata, FamilyMetadata };

let cached: Promise<MetadataFontsResponse> | null = null;

export function loadMetadata(): Promise<MetadataFontsResponse> {
  cached ??= fetch("/metadata/fonts").then(async (response) => {
    if (!response.ok) throw new Error(`metadata/fonts ${response.status}`);
    return stripJsonPrefix(await response.text());
  });
  return cached;
}

const detailCache = new Map<string, Promise<FamilyDetailMetadata>>();

export function loadFamilyDetail(
  family: string,
): Promise<FamilyDetailMetadata> {
  let pending = detailCache.get(family);
  if (!pending) {
    pending = fetch(`/metadata/fonts/${encodeURIComponent(family)}`).then(
      async (response) => {
        if (!response.ok) {
          throw new Error(`metadata/fonts/${family} ${response.status}`);
        }
        return stripJsonPrefix(await response.text());
      },
    );
    detailCache.set(family, pending);
  }
  return pending;
}

function stripJsonPrefix(text: string) {
  return JSON.parse(text.replace(/^\)\]\}'\n?/, ""));
}

export type TagsData = {
  tags: Record<string, Record<string, number>>;
};

let cachedTags: Promise<TagsData> | null = null;

export function loadTags(): Promise<TagsData> {
  cachedTags ??= fetch("/data/tags.json").then(async (response) => {
    if (!response.ok) return { tags: {} };
    return (await response.json()) as TagsData;
  });
  return cachedTags;
}

// ---------------------------------------------------------------------------
// Display helpers shared across pages.

export function familyDisplayName(font: FamilyMetadata) {
  return font.displayName || font.family;
}

export function styleCountLabel(font: FamilyMetadata) {
  if (font.axes.length > 0) {
    // The live site counts italic as an additional axis ("Variable (3 axes)"
    // for Roboto whose registered axes are wdth+wght).
    const hasItalic = Object.keys(font.fonts).some((key) => key.endsWith("i"));
    const axisCount = font.axes.length + (hasItalic ? 1 : 0);
    return `Variable (${axisCount} ${axisCount === 1 ? "axis" : "axes"})`;
  }
  const count = Object.keys(font.fonts).length;
  return `${count} ${count === 1 ? "style" : "styles"}`;
}

export function designerLabel(font: FamilyMetadata) {
  return font.designers.join(", ");
}

const CJK_SUBSETS = new Set([
  "chinese-simplified",
  "chinese-traditional",
  "chinese-hongkong",
  "japanese",
  "korean",
]);

export type FontScript = "latin" | "zh-Hans" | "zh-Hant" | "ja" | "ko";

export function familyScript(font: FamilyMetadata): FontScript {
  if (font.primaryScript === "Hans") return "zh-Hans";
  if (font.primaryScript === "Hant") return "zh-Hant";
  if (font.primaryScript === "Jpan") return "ja";
  if (font.primaryScript === "Kore") return "ko";
  for (const subset of font.subsets) {
    if (subset === "chinese-simplified") return "zh-Hans";
    if (subset === "chinese-traditional" || subset === "chinese-hongkong") {
      return "zh-Hant";
    }
    if (subset === "japanese") return "ja";
    if (subset === "korean") return "ko";
  }
  return "latin";
}

export function isCjk(font: FamilyMetadata) {
  return (
    familyScript(font) !== "latin" ||
    font.subsets.some((subset) => CJK_SUBSETS.has(subset))
  );
}

// Default sample sentence per language from kermitproject.org/utf8.html.
export function sampleTextFor(font: FamilyMetadata) {
  return glassSampleTextFor(font);
}

export function specimenHeroTextFor(font: FamilyMetadata) {
  return glassSampleTextFor(font);
}

export function stylesSampleTextFor(font: FamilyMetadata) {
  return glassSampleTextFor(font);
}

export function glassSampleTextFor(font: FamilyMetadata) {
  return GLASS_SAMPLE_TEXT[glassSampleCodeFor(font)];
}

export function glassSampleCodeFor(font: FamilyMetadata) {
  const languages = [font.primaryLanguage, ...font.languages];
  for (const language of languages) {
    const code = glassSampleCodeForLanguage(language);
    if (code) return code;
  }
  const script = familyScript(font);
  if (script === "latin") return "en";
  return script;
}

export const weightNames: Record<string, string> = {
  "100": "Thin",
  "200": "ExtraLight",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "SemiBold",
  "700": "Bold",
  "800": "ExtraBold",
  "900": "Black",
};

export type StyleRow = {
  key: string;
  label: string;
  weight: number;
  italic: boolean;
};

// Expand a family's fonts map ("400", "400i", ...) into ordered style rows.
export function familyStyleRows(font: FamilyMetadata): StyleRow[] {
  const keys = Object.keys(font.fonts);
  const rows = keys
    .map((key) => {
      const italic = key.endsWith("i");
      const weight = Number(italic ? key.slice(0, -1) : key) || 400;
      return {
        key,
        weight,
        italic,
        label: `${weightNames[String(weight)] ?? weight} ${weight}${italic ? " Italic" : ""}`,
      };
    })
    .sort((a, b) => a.weight - b.weight || Number(a.italic) - Number(b.italic));
  return rows;
}
