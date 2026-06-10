// Browse catalog page (gf-catalog): guidance cards, results toolbar and the
// font tiles, mirroring fonts.google.com's catalog markup.
import { FontTiles } from "../components/FontTiles";
import { GuidanceCards } from "../components/GuidanceCards";
import {
  ButtonRipple,
  ButtonSpans,
  GfIcon,
  IconButtonRipple,
  attrs,
  withAttrs,
} from "../components/mat";
import { useAppState, type ViewMode } from "../lib/app-state";

const ABOUT_RESULTS_TOOLTIP =
  "Search results are based on font and font designer names which most closely match your query, and are ranked using the following factors: (1) web usage of the font family; (2) trend in web usage of the font family; (3) the number of styles in the font family; (4) the date the font family was added; and/or (5) how applicable the font family is to the dominant language(s) in your country (based on your location and settings). The relative weight given to each factor is determined by the sorting method you choose; for example, the date the font family was added will play a bigger role if you choose to sort by “Newest”.";

function LayoutToggleButton({
  mode,
  current,
  onSelect,
}: {
  mode: ViewMode;
  current: ViewMode;
  onSelect: (mode: ViewMode) => void;
}) {
  const isGrid = mode === "grid";
  const active = mode === current;
  return (
    <button
      {...attrs("mat-icon-button")}
      aria-label={`Set layout type to ${isGrid ? "grid" : "row"}`}
      aria-pressed={active}
      className={`mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button layout__toggle-button layout__toggle-button--${
        isGrid ? "left" : "right"
      } gmat-mdc-button-with-prefix ${
        active ? "mat-primary" : "mat-secondary--gray"
      }`}
      onClick={() => onSelect(mode)}
    >
      <IconButtonRipple />
      <GfIcon name={isGrid ? "view_module" : "view_list"} withName />
      <ButtonSpans />
    </button>
  );
}

export function BrowsePage() {
  const {
    families,
    filteredFamilies,
    filters,
    loading,
    viewMode,
    setViewMode,
  } = useAppState();
  const filteredCount = loading ? 0 : filteredFamilies.length;
  const totalCount = loading
    ? 0
    : filters.query.trim()
      ? families.length
      : families.filter((font) => font.isCustom).length;

  return (
    <gf-catalog>
      <GuidanceCards />
      <gf-fonts-page>
        <h1 className="cdk-visually-hidden">Find the fonts for your project</h1>
        <div role="region" id="catalog-results">
          <gf-live-announcement message="Fonts filtered">
            <span
              aria-live="polite"
              aria-relevant="removals"
              className="cdk-visually-hidden"
            ></span>
          </gf-live-announcement>
          <div className="mat-text--secondary gf-label-large catalog__results-count-container">
            <p className="catalog__results-count">
              {filteredCount.toLocaleString()} of {totalCount.toLocaleString()}{" "}
              families
            </p>
            <gf-grid-controls>
              <gf-info-tooltip
                tooltip={ABOUT_RESULTS_TOOLTIP}
                arialabel="About these results"
              >
                <span className="mat-text--secondary tooltip">
                  <button
                    {...withAttrs({
                      color: "secondary--gray",
                      "mat-button": "",
                      mattooltipclass: "gf-tooltip-large-content",
                    })}
                    className="mdc-button mat-mdc-button-base gmat-mdc-button mat-mdc-tooltip-trigger mat-mdc-button gmat-mdc-button-with-prefix mat-secondary--gray"
                    aria-label="About these results"
                    title={ABOUT_RESULTS_TOOLTIP}
                  >
                    <ButtonRipple />
                    <span className="mdc-button__label">
                      <div className="tooltip-button__wrapper">
                        About these results
                        <GfIcon
                          name="info"
                          className="tooltip__icon--with-title"
                          withName
                        />
                      </div>
                    </span>
                    <ButtonSpans />
                  </button>
                </span>
              </gf-info-tooltip>
              <gf-layout-type className="grid-list-layout-type">
                <div className="layout__toggle-wrapper">
                  <LayoutToggleButton
                    mode="grid"
                    current={viewMode}
                    onSelect={setViewMode}
                  />
                  <LayoutToggleButton
                    mode="list"
                    current={viewMode}
                    onSelect={setViewMode}
                  />
                </div>
              </gf-layout-type>
            </gf-grid-controls>
          </div>
          <FontTiles />
        </div>
      </gf-fonts-page>
    </gf-catalog>
  );
}
