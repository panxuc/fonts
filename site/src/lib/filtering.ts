// Catalog filtering and sorting, mirroring the fonts.google.com left drawer.
import type { FamilyMetadata, TagsData } from "./metadata";

export type SortOption = "Trending" | "Most popular" | "Newest" | "Name";
export const sortOptions: SortOption[] = [
  "Trending",
  "Most popular",
  "Newest",
  "Name",
];

export type FilterSection = {
  id: string;
  label: string;
  icon: string;
  tagPrefix: string;
  values: string[];
  // Chips rendered in a representative font (label -> family), like the real drawer.
  chipFonts?: Record<string, string>;
};

// Sections, values and preview fonts copied from the live fonts.google.com drawer.
export const filterSections: FilterSection[] = [
  {
    id: "feeling",
    label: "Feeling",
    icon: "sentiment_satisfied",
    tagPrefix: "/Expressive/",
    values: [
      "Business",
      "Fancy",
      "Calm",
      "Playful",
      "Cute",
      "Artistic",
      "Vintage",
      "Loud",
      "Sophisticated",
      "Futuristic",
      "Active",
      "Stiff",
      "Innovative",
      "Happy",
      "Childlike",
      "Rugged",
      "Awkward",
      "Excited",
    ],
    chipFonts: {
      Business: "Roboto",
      Fancy: "Great Vibes",
      Calm: "Poppins",
      Playful: "DynaPuff",
      Cute: "Caveat",
      Artistic: "Leckerli One",
      Vintage: "Pirata One",
      Loud: "Limelight",
      Sophisticated: "Quintessential",
      Futuristic: "Audiowide",
      Active: "Racing Sans One",
      Stiff: "Iceberg",
      Innovative: "Rubik Glitch",
      Happy: "Lobster",
      Childlike: "Fuzzy Bubbles",
      Rugged: "Cabin Sketch",
      Awkward: "Barriecito",
      Excited: "Kablammo",
    },
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "apparel",
    tagPrefix: "/Theme/",
    values: [
      "Techno",
      "Monospaced",
      "Blobby",
      "Marker",
      "Art Deco",
      "Art Nouveau",
      "Distressed",
      "Stencil",
      "Wood type",
      "Medieval",
      "Blackletter",
      "Pixel",
      "Not text",
      "Tuscan",
      "Wacky",
      "Shaded",
      "Inline",
    ],
    chipFonts: {
      Techno: "Audiowide",
      Monospaced: "Roboto Mono",
      Blobby: "Chicle",
      Marker: "Kavivanar",
      "Art Deco": "Ribeye",
      "Art Nouveau": "Amarante",
      Distressed: "Averia Libre",
      Stencil: "Black Ops One",
      "Wood type": "Rye",
      Medieval: "Metamorphous",
      Blackletter: "New Rocker",
      Pixel: "Pixelify Sans",
      "Not text": "Noto Music",
      Tuscan: "Sancreek",
      Wacky: "Kablammo",
      Shaded: "Vast Shadow",
      Inline: "Train One",
    },
  },
  {
    id: "calligraphy",
    label: "Calligraphy",
    icon: "script",
    tagPrefix: "/Script/",
    values: ["All", "Handwritten", "Formal", "Informal", "Upright"],
    chipFonts: {
      All: "Google Sans Flex",
      Handwritten: "Kalam",
      Formal: "Dancing Script",
      Informal: "Mansalva",
      Upright: "Pangolin",
    },
  },
  {
    id: "serif",
    label: "Serif",
    icon: "serif",
    tagPrefix: "/Serif/",
    values: [
      "All",
      "Transitional",
      "Slab",
      "Old Style",
      "Modern",
      "Humanist",
      "Scotch",
      "Fatface",
      "Didone",
    ],
    chipFonts: {
      All: "Tiro Bangla",
      Transitional: "Roboto Slab",
      Slab: "Roboto Slab",
      "Old Style": "EB Garamond",
      Modern: "Playfair Display",
      Humanist: "Rakkas",
      Scotch: "STIX Two Text",
      Fatface: "Gravitas One",
      Didone: "Vidaloka",
    },
  },
  {
    id: "sans-serif",
    label: "Sans Serif",
    icon: "font_download",
    tagPrefix: "/Sans/",
    values: [
      "All",
      "Humanist",
      "Geometric",
      "Neo Grotesque",
      "Rounded",
      "Superellipse",
      "Grotesque",
      "Glyphic",
    ],
    chipFonts: {
      All: "Merriweather Sans",
      Humanist: "Merriweather Sans",
      Geometric: "Poppins",
      "Neo Grotesque": "Roboto Flex",
      Rounded: "Nunito",
      Superellipse: "Oxanium",
      Grotesque: "Oswald",
      Glyphic: "Red Rose",
    },
  },
  {
    id: "technology",
    label: "Technology",
    icon: "custom_typography",
    tagPrefix: "",
    values: ["None", "Variable", "Color"],
  },
  {
    id: "seasonal",
    label: "Seasonal",
    icon: "interests",
    tagPrefix: "/Seasonal/",
    values: [
      "Lunar New Year",
      "Valentine's",
      "Holi",
      "Halloween",
      "Diwali",
      "Christmas",
      "Hanukkah",
      "Kwanzaa",
    ],
    chipFonts: {
      "Lunar New Year": "Sofia Sans Extra Condensed",
      "Valentine's": "Dancing Script",
      Holi: "Honk",
      Halloween: "Creepster",
      Diwali: "Eagle Lake",
      Christmas: "Berkshire Swash",
      Hanukkah: "Courgette",
      Kwanzaa: "Agbalumo",
    },
  },
];

export const writingSystems = [
  "All writing systems",
  "Arabic",
  "Armenian",
  "Bengali",
  "Chinese (Hong Kong)",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Cyrillic",
  "Cyrillic Extended",
  "Devanagari",
  "Ethiopic",
  "Georgian",
  "Greek",
  "Greek Extended",
  "Gujarati",
  "Gurmukhi",
  "Hebrew",
  "Japanese",
  "Kannada",
  "Khmer",
  "Korean",
  "Lao",
  "Latin",
  "Latin Extended",
  "Malayalam",
  "Math",
  "Myanmar",
  "Oriya",
  "Sinhala",
  "Symbols",
  "Tamil",
  "Telugu",
  "Thai",
  "Tibetan",
  "Vietnamese",
] as const;

export type WritingSystem = (typeof writingSystems)[number];

const writingSystemSubsets: Record<string, string> = {
  Arabic: "arabic",
  Armenian: "armenian",
  Bengali: "bengali",
  "Chinese (Hong Kong)": "chinese-hongkong",
  "Chinese (Simplified)": "chinese-simplified",
  "Chinese (Traditional)": "chinese-traditional",
  Cyrillic: "cyrillic",
  "Cyrillic Extended": "cyrillic-ext",
  Devanagari: "devanagari",
  Ethiopic: "ethiopic",
  Georgian: "georgian",
  Greek: "greek",
  "Greek Extended": "greek-ext",
  Gujarati: "gujarati",
  Gurmukhi: "gurmukhi",
  Hebrew: "hebrew",
  Japanese: "japanese",
  Kannada: "kannada",
  Khmer: "khmer",
  Korean: "korean",
  Lao: "lao",
  Latin: "latin",
  "Latin Extended": "latin-ext",
  Malayalam: "malayalam",
  Math: "math",
  Myanmar: "myanmar",
  Oriya: "oriya",
  Sinhala: "sinhala",
  Symbols: "symbols",
  Tamil: "tamil",
  Telugu: "telugu",
  Thai: "thai",
  Tibetan: "tibetan",
  Vietnamese: "vietnamese",
};

export type FilterState = {
  query: string;
  writingSystem: WritingSystem;
  chips: Record<string, string[]>; // section id -> selected values
};

export const emptyFilters: FilterState = {
  query: "",
  writingSystem: "All writing systems",
  chips: {},
};

export function hasActiveFilters(state: FilterState) {
  return (
    state.query.trim() !== "" ||
    state.writingSystem !== "All writing systems" ||
    Object.values(state.chips).some((values) => values.length > 0)
  );
}

const TAG_SCORE_THRESHOLD = 30;

export function filterFamilies(
  families: FamilyMetadata[],
  state: FilterState,
  tags: TagsData | null,
): FamilyMetadata[] {
  const query = state.query.trim().toLocaleLowerCase();
  const subset = writingSystemSubsets[state.writingSystem];
  let tagScores: Map<string, number> | null = null;

  const chipSelections = filterSections
    .map((section) => ({
      section,
      values: state.chips[section.id] ?? [],
    }))
    .filter((entry) => entry.values.length > 0);

  if (tags && chipSelections.some((entry) => entry.section.tagPrefix)) {
    tagScores = new Map();
    for (const { section, values } of chipSelections) {
      if (!section.tagPrefix) continue;
      for (const value of values) {
        const tagFamilies =
          value === "All"
            ? Object.entries(tags.tags)
                .filter(([tag]) => tag.startsWith(section.tagPrefix))
                .flatMap(([, items]) => Object.entries(items))
            : Object.entries(tags.tags[`${section.tagPrefix}${value}`] ?? {});
        for (const [family, score] of tagFamilies) {
          if (score < TAG_SCORE_THRESHOLD) continue;
          tagScores.set(family, Math.max(tagScores.get(family) ?? 0, score));
        }
      }
    }
  }

  const technology = state.chips.technology ?? [];

  const result = families.filter((font) => {
    if (query) {
      const haystack =
        `${font.family} ${font.displayName ?? ""} ${font.category}`.toLocaleLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (subset && !font.subsets.includes(subset)) return false;
    if (tagScores && !tagScores.has(font.family)) return false;
    if (technology.length) {
      const variable = font.axes.length > 0;
      const color = font.colorCapabilities.length > 0;
      const matches = technology.some((value) =>
        value === "Variable"
          ? variable
          : value === "Color"
            ? color
            : !variable && !color,
      );
      if (!matches) return false;
    }
    return true;
  });

  if (tagScores) {
    result.sort(
      (a, b) => (tagScores.get(b.family) ?? 0) - (tagScores.get(a.family) ?? 0),
    );
  }
  return result;
}

export function sortFamilies(
  families: FamilyMetadata[],
  sort: SortOption,
): FamilyMetadata[] {
  const next = [...families];
  const byName = (a: FamilyMetadata, b: FamilyMetadata) =>
    a.family.localeCompare(b.family);
  switch (sort) {
    // The live site's "Trending" order matches metadata defaultSort, not the
    // trending field (verified against harvested ground truth).
    case "Trending":
      next.sort(
        (a, b) =>
          (a.defaultSort ?? 1e9) - (b.defaultSort ?? 1e9) || byName(a, b),
      );
      break;
    case "Most popular":
      next.sort(
        (a, b) => (a.popularity ?? 1e9) - (b.popularity ?? 1e9) || byName(a, b),
      );
      break;
    case "Newest":
      next.sort(
        (a, b) =>
          (b.dateAdded ?? "").localeCompare(a.dateAdded ?? "") || byName(a, b),
      );
      break;
    case "Name":
      next.sort(byName);
      break;
  }
  return next;
}
