// Central UI state shared by the header, drawer and pages.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  emptyFilters,
  filterFamilies,
  sortFamilies,
  type FilterState,
  type SortOption,
  type WritingSystem,
} from "./filtering";
import {
  loadMetadata,
  loadTags,
  type FamilyMetadata,
  type TagsData,
} from "./metadata";
import { readQueryParam, replaceQuery } from "./router";

export type ViewMode = "list" | "grid";

export type AppState = {
  families: FamilyMetadata[];
  familyByName: Map<string, FamilyMetadata>;
  tags: TagsData | null;
  loading: boolean;
  filters: FilterState;
  sort: SortOption;
  viewMode: ViewMode;
  drawerOpen: boolean;
  previewText: string;
  previewSize: number;
  dark: boolean;
  filteredFamilies: FamilyMetadata[];
  setQuery: (value: string) => void;
  setWritingSystem: (value: WritingSystem) => void;
  toggleChip: (sectionId: string, value: string) => void;
  resetFilters: () => void;
  setSort: (value: SortOption) => void;
  setViewMode: (value: ViewMode) => void;
  setDrawerOpen: (value: boolean) => void;
  setPreviewText: (value: string) => void;
  setPreviewSize: (value: number) => void;
  toggleDark: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [families, setFamilies] = useState<FamilyMetadata[]>([]);
  const [tags, setTags] = useState<TagsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...emptyFilters,
    query: readQueryParam("query"),
  }));
  const [sort, setSort] = useState<SortOption>("Trending");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [drawerOpen, setDrawerOpen] = useState(
    () =>
      typeof window === "undefined" ||
      (window.matchMedia?.("(min-width: 1000px)").matches ?? true),
  );
  const [previewText, setPreviewText] = useState("");
  const [previewSize, setPreviewSize] = useState(40);
  const [dark, setDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage?.getItem("isDarkTheme") === "true",
  );

  useEffect(() => {
    let cancelled = false;
    loadMetadata()
      .then((data) => {
        if (cancelled) return;
        setFamilies(data.familyMetadataList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    loadTags().then((data) => {
      if (!cancelled) setTags(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("gf-dark-theme", dark);
    try {
      window.localStorage?.setItem("isDarkTheme", String(dark));
    } catch {
      // localStorage unavailable; theme stays session-only.
    }
  }, [dark]);

  const familyByName = useMemo(
    () => new Map(families.map((font) => [font.family, font])),
    [families],
  );

  const filteredFamilies = useMemo(() => {
    const matches = filterFamilies(families, filters, tags);
    const visible = filters.query.trim()
      ? matches
      : matches.filter((font) => font.isCustom);
    return sortFamilies(visible, sort);
  }, [families, filters, tags, sort]);

  const value: AppState = {
    families,
    familyByName,
    tags,
    loading,
    filters,
    sort,
    viewMode,
    drawerOpen,
    previewText,
    previewSize,
    dark,
    filteredFamilies,
    setQuery: (query) => {
      setFilters((state) => ({ ...state, query }));
      replaceQuery({ query: query || null });
    },
    setWritingSystem: (writingSystem) =>
      setFilters((state) => ({ ...state, writingSystem })),
    toggleChip: (sectionId, value) =>
      setFilters((state) => {
        const selected = state.chips[sectionId] ?? [];
        const next = selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value];
        return { ...state, chips: { ...state.chips, [sectionId]: next } };
      }),
    resetFilters: () => {
      setFilters({ ...emptyFilters });
      setPreviewText("");
      setPreviewSize(40);
      replaceQuery({ query: null });
    },
    setSort,
    setViewMode,
    setDrawerOpen,
    setPreviewText,
    setPreviewSize,
    toggleDark: () => setDark((value) => !value),
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error("useAppState outside provider");
  return state;
}
