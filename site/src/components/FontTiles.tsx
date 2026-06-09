// Catalog tiles (gf-font-tiles), list and grid layouts, with incremental
// rendering and per-tile lazy preview-font loading.
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppState, type ViewMode } from "../lib/app-state";
import {
  designerLabel,
  familyDisplayName,
  sampleTextFor,
  styleCountLabel,
  stylesSampleTextFor,
  type FamilyMetadata,
} from "../lib/metadata";
import { ensurePreviewFont } from "../lib/preview-fonts";
import { navigate } from "../lib/router";

const BATCH_SIZE = 30;

function familySlug(font: FamilyMetadata) {
  return encodeURIComponent(font.family).replaceAll("%20", "+");
}

function tileTextClass(font: FamilyMetadata) {
  return `tile__${font.family
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "_")} tile__text`;
}

function Tile({
  font,
  position,
  total,
  sampleText,
  previewSize,
  viewMode,
}: {
  font: FamilyMetadata;
  position: number;
  total: number;
  sampleText: string;
  previewSize: number;
  viewMode: ViewMode;
}) {
  const tileRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  // Track viewport visibility so fonts are fetched only for tiles on (or
  // near) screen, and re-fetched with new subset text when previews change.
  useEffect(() => {
    const element = tileRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setInView(entry.isIntersecting);
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (inView && sampleText) ensurePreviewFont(font, sampleText);
  }, [inView, font, sampleText]);

  const name = familyDisplayName(font);
  const subtitle = styleCountLabel(font);
  const authors = designerLabel(font);
  const slug = familySlug(font);
  const open = () =>
    navigate({ page: "specimen", family: font.family, tab: "specimen" });

  return (
    <gf-tile ref={tileRef} aria-setsize={total} aria-posinset={position}>
      <div className="tile__header">
        <a
          className="gf-block-anchor"
          href={`/specimen/${slug}`}
          aria-label={`${name}. ${subtitle}. ${authors}`}
          onClick={(event) => {
            event.preventDefault();
            open();
          }}
        >
          <div className="tile__header--title mat-text--title gf-title-medium">
            <span className="gf-block-anchor__text">{name}</span>
          </div>
        </a>
        <span
          role="presentation"
          aria-hidden="true"
          className="tile__header--subtitle mat-text--secondary gf-body-medium"
        >
          {subtitle}
        </span>
        <span
          role="presentation"
          aria-hidden="true"
          className="tile__header--authors mat-text--secondary gf-body-medium nowrap"
        >
          {authors}
        </span>
      </div>
      <gf-feathering dir="auto" className="ltr">
        <div
          translate="no"
          className={tileTextClass(font)}
          style={{
            fontSize: `${previewSize}px`,
            textAlign: "start",
            transitionProperty: "opacity, transform",
            fontFamily: `"${font.family}", sans-serif`,
            fontWeight: 400,
            fontStyle: "normal",
            fontStretch: "normal",
            fontOpticalSizing: "auto",
            opacity: 1,
            lineHeight: "initial",
            transitionDuration: "350ms",
          }}
        >
          {sampleText}
        </div>
      </gf-feathering>
    </gf-tile>
  );
}

export function FontTiles() {
  const { filteredFamilies, viewMode, previewText, previewSize } =
    useAppState();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const total = filteredFamilies.length;

  // Restart incremental rendering whenever the result set changes.
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [filteredFamilies]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((count) =>
            count >= total ? count : Math.min(total, count + BATCH_SIZE),
          );
        }
      },
      { rootMargin: "1200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [total, visibleCount]);

  const visible = useMemo(
    () => filteredFamilies.slice(0, visibleCount),
    [filteredFamilies, visibleCount],
  );

  const trimmedPreview = previewText.trim();

  return (
    <gf-font-tiles
      className={viewMode === "grid" ? "layout--grid" : "layout--row"}
    >
      <div
        aria-label="List of font families"
        className="gf-grid-layout tiles-container"
        style={{ paddingTop: "0px" }}
      >
        {visible.map((font, index) => (
          <Tile
            key={font.family}
            font={font}
            position={index + 1}
            total={total}
            sampleText={
              trimmedPreview ||
              (viewMode === "grid"
                ? stylesSampleTextFor(font)
                : sampleTextFor(font))
            }
            previewSize={previewSize}
            viewMode={viewMode}
          />
        ))}
      </div>
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{ height: 1, width: "100%" }}
      ></div>
    </gf-font-tiles>
  );
}
