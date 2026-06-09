// Runtime catalog data, fetched the same way fonts.google.com fetches it.

import type {
  FamilyDetailMetadata,
  FamilyMetadata,
  MetadataFontsResponse,
} from "../../../src/types";

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

export function familyScript(
  font: FamilyMetadata,
): "latin" | "sc" | "tc" | "jp" | "kr" {
  if (font.primaryScript === "Hans") return "sc";
  if (font.primaryScript === "Hant") return "tc";
  if (font.primaryScript === "Jpan") return "jp";
  if (font.primaryScript === "Kore") return "kr";
  for (const subset of font.subsets) {
    if (subset === "chinese-simplified") return "sc";
    if (subset === "chinese-traditional" || subset === "chinese-hongkong") {
      return "tc";
    }
    if (subset === "japanese") return "jp";
    if (subset === "korean") return "kr";
  }
  return "latin";
}

export function isCjk(font: FamilyMetadata) {
  return (
    familyScript(font) !== "latin" ||
    font.subsets.some((subset) => CJK_SUBSETS.has(subset))
  );
}

// Default sample sentence per script, mirroring fonts.google.com previews.
export function sampleTextFor(font: FamilyMetadata) {
  const script = familyScript(font);
  if (script === "sc") {
    return "人人生而自由，在尊严和权利上一律平等。";
  }
  if (script === "tc") {
    return "人人生而自由，在尊嚴和權利上一律平等。";
  }
  if (script === "jp") {
    return "すべての人間は、生まれながらにして自由であり、";
  }
  if (script === "kr") {
    return "모든 인간은 태어날 때부터 자유로우며";
  }
  return "Everyone has the right to freedom of thought, conscience and religion.";
}

export function specimenHeroTextFor(font: FamilyMetadata) {
  const script = familyScript(font);
  if (script === "sc") return "鉴于对人类家庭所有成员的固有尊严";
  if (script === "tc") return "鑑於對人類家庭所有成員的固有尊嚴";
  if (script === "jp") return "人類社会のすべての構成員の固有の尊厳と";
  if (script === "kr") return "모든 인류 구성원의 천부의 존엄성과";
  return "Whereas disregard and contempt for human rights have resulted";
}

export function stylesSampleTextFor(font: FamilyMetadata) {
  const script = familyScript(font);
  if (script === "sc") return "鉴于承认人类家庭所有成员的固有尊严";
  if (script === "tc") return "鑑於承認人類家庭所有成員的固有尊嚴";
  if (script === "jp") return "人間の固有の尊厳の承認は";
  if (script === "kr") return "고유의 존엄성을 인정하는 것은";
  return "Whereas recognition of the inherent dignity";
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
