// Types mirroring the real Google Fonts metadata payloads plus the custom
// catalog entries this service adds on top of them.

export type FontAxis = {
  tag: string;
  min: number;
  max: number;
  defaultValue: number;
};

export type AxisRegistryEntry = {
  tag: string;
  displayName: string;
  min: number;
  defaultValue: number;
  max: number;
  precision: number;
  description: string;
  fallbackOnly: boolean;
  illustrationUrl?: string;
  fallbacks: Array<{
    name: string;
    value: number;
    displayName?: string;
  }>;
};

export type FamilyMetadataFont = {
  thickness: number | null;
  slant: number | null;
  width: number | null;
  lineHeight: number;
};

export type FamilyDesigner = {
  name: string;
  bio: string | null;
  imageUrl: string | null;
};

// Shape of entries in https://fonts.google.com/metadata/fonts familyMetadataList.
export type FamilyMetadata = {
  family: string;
  displayName: string | null;
  category: string;
  stroke: string | null;
  classifications: string[];
  size: number;
  subsets: string[];
  fonts: Record<string, FamilyMetadataFont>;
  axes: FontAxis[];
  designers: string[];
  lastModified: string;
  dateAdded: string;
  popularity: number;
  trending: number;
  defaultSort: number;
  androidFragment: string | null;
  isNoto: boolean;
  colorCapabilities: string[];
  primaryScript: string;
  primaryLanguage: string;
  isOpenSource: boolean;
  isBrandFont: boolean;
  languages: string[];
  isCustom?: boolean;
};

export type MetadataFontsResponse = {
  axisRegistry: AxisRegistryEntry[];
  familyMetadataList: FamilyMetadata[];
  promotedScript: string | null;
};

// Shape of https://fonts.google.com/metadata/fonts/<family> (after the )]}' prefix).
export type FamilyDetailMetadata = {
  family: string;
  displayName: string | null;
  coverage: Record<string, string>;
  fonts: Record<string, FamilyMetadataFont>;
  axes: FontAxis[];
  stats: {
    requests: Record<string, number>;
    countryBreakdown?: Record<string, number>;
  } | null;
  description: string | null;
  license: string;
  designers: FamilyDesigner[];
  fontUses: string[] | null;
  category: string;
  stroke: string | null;
  classifications: string[];
  lastModified: string;
  size: number;
  updateNotes: unknown[];
  isNoto: boolean;
  colorCapabilities: string[];
  primaryScript: string;
  primaryLanguage: string;
  article: unknown | null;
  languages: string[];
  minisiteUrl: string;
  isOpenSource: boolean;
  isCustom?: boolean;
};

// Developer API (webfonts/v1/webfonts) item.
export type WebfontItem = {
  kind: "webfonts#webfont";
  family: string;
  category: string;
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  files: Record<string, string>;
  axes?: Array<{ tag: string; start: number; end: number }>;
};

export type WebfontsResponse = {
  kind: "webfonts#webfontList";
  items: WebfontItem[];
};

// ---------------------------------------------------------------------------
// Custom catalog

// One deliverable WOFF2 asset of a custom family. Named shards ("latin",
// "latin-ext", ...) render a `/* id */` comment in the CSS API output;
// numbered shards (Google-style CJK slices, id like "37") render none.
export type FontAssetShard = {
  id: string;
  unicodeRange: string;
  weight: string; // "400" or a variable range "100..900"
  style: "normal" | "italic";
};

export type CustomFontSourceFile = {
  path: string;
  weight?: string | number;
  style?: string;
  family?: string;
};

export type FontCatalogEntry = {
  id: string;
  family: string;
  displayName: string | null;
  language: string; // BCP-47, e.g. "zh-Hans"
  // Script key selecting the slicing strategy: "sc" | "tc" | "jp" | "kr" | "latin"
  script: string;
  category: string; // Google category label: "Sans Serif" | "Serif" | "Display" | "Handwriting" | "Monospace"
  subsets: string[]; // e.g. ["menu", "chinese-simplified", "latin", "latin-ext"]
  shards: FontAssetShard[];
  weights: string[];
  styles: Array<"normal" | "italic">;
  axes: FontAxis[];
  version: string;
  lastModified: string;
  dateAdded: string;
  designers: string[];
  description: string | null;
  license: {
    type: string;
    url?: string;
  };
  source: {
    kind: "custom";
    type: string;
    upstream?: string;
    owner?: string;
    repo?: string;
  };
};

// ---------------------------------------------------------------------------
// CSS API request model

export type CssFamilyRequest = {
  raw: string;
  family: string;
  axes: string[]; // e.g. ["ital", "wght"]
  tuples: string[][]; // e.g. [["0","400"], ["1","700"]]
  legacyVariants: string[]; // /css (v1) style list: ["400", "700italic", ...]
};

export type CssApiRequest = {
  endpoint: "/css" | "/css2";
  display: string | null;
  text: string | null;
  families: CssFamilyRequest[];
};
