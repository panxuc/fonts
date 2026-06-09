// Top app header (gf-google-header): lockup, search with autocomplete,
// sort select, shopping bag and the per-route secondary nav row.
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { useAppState } from "../lib/app-state";
import { sortOptions, type SortOption } from "../lib/filtering";
import { familyDisplayName, type FamilyMetadata } from "../lib/metadata";
import { navigate, type Route, type SpecimenTab } from "../lib/router";
import { addFamily, useSelectedFamilies } from "../lib/selection";
import {
  ButtonRipple,
  ButtonSpans,
  GfIcon,
  IconButtonRipple,
  MatSelect,
  OverlayPortal,
  attrs,
  useAnchorRect,
  useDismiss,
  withAttrs,
} from "./mat";

function LockupLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="104"
      height="31"
      fill="none"
      viewBox="0 0 104 31"
      aria-hidden="true"
    >
      <rect width="31" height="31" rx="8" fill="currentColor" opacity="0.1" />
      <path
        d="M9 23V7h12.5v3H12.6v3.6h7.9v3h-7.9V23H9Z"
        fill="currentColor"
      />
      <text
        x="40"
        y="21.5"
        fill="currentColor"
        fontFamily="inherit"
        fontSize="18"
        fontWeight="600"
      >
        Fonts
      </text>
    </svg>
  );
}

// Wrap the segments of `name` around the typed query in highlight spans,
// like the live autocomplete (the completion, not the match, is bold).
function HighlightedName({ name, query }: { name: string; query: string }) {
  const index = name.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0 || !query) {
    return <span className="gf-body-large">{name}</span>;
  }
  const before = name.slice(0, index);
  const match = name.slice(index, index + query.length);
  const after = name.slice(index + query.length);
  return (
    <span className="gf-body-large">
      {before ? <span className="highlight-text">{before}</span> : null}
      {match}
      {after ? <span className="highlight-text">{after}</span> : null}
    </span>
  );
}

function SearchField() {
  const { families, filters, setQuery } = useAppState();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const fieldRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const rect = useAnchorRect(open, fieldRef as RefObject<HTMLElement>);
  useDismiss(open, close, [
    fieldRef,
    panelRef as RefObject<HTMLElement | null>,
  ]);

  const query = filters.query;
  const matches = query.trim()
    ? families
        .filter((font) =>
          familyDisplayName(font)
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
        )
        .slice(0, 6)
    : [];
  const showPanel = open && matches.length > 0;

  const go = (font: FamilyMetadata) => {
    setOpen(false);
    navigate({ page: "specimen", family: font.family, tab: "specimen" });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && showPanel) {
      event.preventDefault();
      setActiveIndex((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === "ArrowUp" && showPanel) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      const pick = matches[activeIndex] ?? matches[0];
      if (pick) {
        event.preventDefault();
        go(pick);
      }
    } else if (event.key === "Escape") {
      close();
    }
  };

  return (
    <gf-search>
      <mat-form-field
        ref={fieldRef}
        className="mat-mdc-form-field gmat-mdc-form-field search-field mat-form-field--none gf-common mat-mdc-form-field-type-mat-input mat-mdc-form-field-has-icon-prefix mat-form-field-appearance-fill mat-primary mat-form-field-animations-enabled"
      >
        <div className="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled mdc-text-field--no-label">
          <div className="mat-mdc-form-field-focus-overlay"></div>
          <div className="mat-mdc-form-field-flex">
            <div className="mat-mdc-form-field-icon-prefix">
              <GfIcon name="search" className="search-field__prefix" withName />
            </div>
            <div className="mat-mdc-form-field-infix">
              <input
                {...attrs("matinput")}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="mat-mdc-autocomplete-trigger gmat-mdc-input mat-mdc-input-element search-field__input mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"
                aria-label="Search fonts"
                placeholder="Search fonts"
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={showPanel}
                aria-haspopup="listbox"
                id="mat-input-search"
                aria-invalid="false"
                aria-required="false"
                aria-owns="mat-autocomplete-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
              />
              <mat-autocomplete></mat-autocomplete>
            </div>
          </div>
          <div
            {...attrs("matformfieldlineripple")}
            className="mdc-line-ripple mdc-line-ripple--deactivating"
          ></div>
        </div>
        <div
          aria-atomic="true"
          aria-live="polite"
          className="mat-mdc-form-field-subscript-wrapper mat-mdc-form-field-bottom-align"
        >
          <div className="mat-mdc-form-field-hint-wrapper">
            <div className="mat-mdc-form-field-hint-spacer"></div>
          </div>
        </div>
      </mat-form-field>
      {showPanel && rect ? (
        <OverlayPortal>
          <div
            className="cdk-overlay-popover cdk-overlay-connected-position-bounding-box"
            dir="ltr"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              pointerEvents: "none",
            }}
          >
            <div
              className="cdk-overlay-pane gmat-mdc-autocomplete"
              style={{
                width: rect.width,
                top: rect.top,
                left: rect.left,
                position: "absolute",
                pointerEvents: "auto",
              }}
            >
              <div
                ref={panelRef}
                role="listbox"
                className="mat-mdc-autocomplete-panel mdc-menu-surface mdc-menu-surface--open gmat-elevation-z1 search-autocomplete mat-autocomplete-panel-animations-enabled mat-primary mat-mdc-autocomplete-visible"
                id="mat-autocomplete-search"
              >
                {matches.map((font, index) => (
                  <mat-option
                    key={font.family}
                    role="option"
                    className={`mat-mdc-option mdc-list-item${
                      index === activeIndex ? " mat-mdc-option-active" : ""
                    }`}
                    id={`${font.family}-${index}`}
                    aria-selected={index === activeIndex}
                    aria-disabled="false"
                    onClick={() => go(font)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <span className="mdc-list-item__primary-text">
                      <GfIcon
                        name="font_download"
                        className="autosuggestion-icon"
                      />
                      <HighlightedName
                        name={familyDisplayName(font)}
                        query={query.trim()}
                      />
                    </span>
                    <div
                      aria-hidden="true"
                      {...attrs("mat-ripple")}
                      className="mat-ripple mat-mdc-option-ripple mat-focus-indicator"
                    ></div>
                  </mat-option>
                ))}
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}
    </gf-search>
  );
}

function ShoppingBag() {
  const selected = useSelectedFamilies();
  const [calloutDismissed, setCalloutDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage?.getItem("gf-bag-callout-dismissed") === "true",
  );
  const dismiss = () => {
    setCalloutDismissed(true);
    try {
      window.localStorage?.setItem("gf-bag-callout-dismissed", "true");
    } catch {
      // Session-only dismissal.
    }
  };
  const count = selected.length;
  const hasItems = count > 0;
  return (
    <div className="nav__items">
      <div className="nav__shopping-bag gf-nav__button">
        <gf-shopping-bag>
          <button
            {...withAttrs({
              "mat-icon-button": "",
              mattooltip: "View selected families",
            })}
            className={`mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button mat-mdc-tooltip-trigger shopping-bag__toggle gmat-mdc-button-with-prefix${
              hasItems
                ? " shopping-bag__toggle--has-items mat-primary"
                : " mat-secondary--gray"
            }`}
            aria-hidden="false"
            aria-label={
              hasItems
                ? `View selected families (${count} ${
                    count === 1 ? "family" : "families"
                  } selected)`
                : "View selected families"
            }
            onClick={() => navigate({ page: "selection" })}
          >
            <IconButtonRipple />
            {hasItems ? (
              <div className="shopping-bag__count">
                <span className="count__label">{count}</span>
              </div>
            ) : null}
            <GfIcon name="shopping_bag" withName animated filled={hasItems} />
            <ButtonSpans />
          </button>
        </gf-shopping-bag>
        {!calloutDismissed ? (
          <gf-shopping-bag-callout className="google-header-shopping-bag-callout">
            <div
              tabIndex={0}
              role="dialog"
              className="callout callout--show"
              aria-label="View selected families."
            >
              <div className="gf-body-medium gmat-elevation-z2 callout__text">
                {" View selected families. "}
                <a className="gf-label-large callout__link" onClick={dismiss}>
                  {" Dismiss "}
                </a>
              </div>
            </div>
          </gf-shopping-bag-callout>
        ) : null}
      </div>
    </div>
  );
}

function DrawerToggle() {
  const { drawerOpen, setDrawerOpen } = useAppState();
  return (
    <gf-left-drawer-toggle>
      <button
        {...withAttrs(
          drawerOpen
            ? { "mat-flat-button": "", color: "primary" }
            : { color: "primary" },
        )}
        aria-expanded={drawerOpen}
        aria-controls="left-drawer"
        className={`mdc-button mat-mdc-button-base gmat-mdc-button rounded toggle__button emphasized ${
          drawerOpen
            ? "mdc-button--unelevated mat-mdc-unelevated-button"
            : "mdc-button--outlined mat-mdc-outlined-button"
        } gmat-mdc-button-with-prefix mat-primary`}
        aria-label={drawerOpen ? "Close Filters panel" : "Open Filters panel"}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        <ButtonRipple />
        <span className="mdc-button__label">
          <GfIcon name={drawerOpen ? "close" : "tune"} size={18} /> Filters{" "}
        </span>
        <ButtonSpans />
      </button>
    </gf-left-drawer-toggle>
  );
}

const specimenTabs: { label: string; icon: string; tab: SpecimenTab }[] = [
  { label: "Specimen", icon: "font_download", tab: "specimen" },
  { label: "About", icon: "info", tab: "about" },
  { label: "License", icon: "article", tab: "license" },
  { label: "Glyphs & languages", icon: "glyphs", tab: "glyphs" },
];

function SpecimenSecondaryNav({
  family,
  tab,
}: {
  family: string;
  tab: SpecimenTab;
}) {
  const slug = encodeURIComponent(family).replaceAll("%20", "+");
  return (
    <gf-specimen-secondary-nav>
      <gf-feathering dir="auto" className="ltr">
        <div className="nav__container secondary-nav__scroller">
          <ul className="nav__actions">
            {specimenTabs.map((item) => {
              const active = item.tab === tab;
              const href =
                item.tab === "specimen"
                  ? `specimen/${slug}`
                  : `specimen/${slug}/${item.tab}`;
              return (
                <li key={item.tab}>
                  <gf-secondary-nav-item
                    iconname={item.icon}
                    label={item.label}
                  >
                    <a
                      {...withAttrs({ "mat-button": "", color: "secondary" })}
                      className={`mdc-button mat-mdc-button-base gmat-mdc-button item mat-mdc-button${
                        active ? " active" : ""
                      } gmat-mdc-button-with-prefix mat-secondary`}
                      href={`/${href}`}
                      aria-current={active}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ page: "specimen", family, tab: item.tab });
                      }}
                    >
                      <ButtonRipple />
                      <span className="mdc-button__label">
                        <div className="content">
                          <GfIcon
                            name={item.icon}
                            size={20}
                            filled={active}
                            animated
                          />
                          <span className="item__label">{item.label}</span>
                        </div>
                      </span>
                      <ButtonSpans />
                    </a>
                  </gf-secondary-nav-item>
                </li>
              );
            })}
          </ul>
        </div>
      </gf-feathering>
      <div className="nav__get-font-and-callout">
        <button
          {...withAttrs({ "mat-flat-button": "", color: "primary" })}
          aria-label="Get font"
          className="mdc-button mat-mdc-button-base gmat-mdc-button gf-title-medium gmat-elevation-z0 nav__get-font fab-tablet-mobile-button emphasized mdc-button--unelevated mat-mdc-unelevated-button mat-primary"
          onClick={() => {
            addFamily(family);
            navigate({ page: "selection" });
          }}
        >
          <ButtonRipple />
          <span className="mdc-button__label"> Get font </span>
          <ButtonSpans />
        </button>
      </div>
    </gf-specimen-secondary-nav>
  );
}

export function GfHeader({ route }: { route: Route }) {
  const { sort, setSort, drawerOpen } = useAppState();
  const isBrowse = route.page === "browse";

  // The live header collapses the search row's left margin transition when
  // the drawer opens; the shell already offsets us via mat-sidenav-content.
  useEffect(() => {
    // no-op; placeholder to keep parity with future scroll behaviors.
  }, []);

  return (
    <gf-google-header className={`header${isBrowse ? " has-left-drawer" : ""}`}>
      <div className="gf-header">
        <gf-notifications></gf-notifications>
        <header
          className={`gf-header__content${
            isBrowse && drawerOpen ? " content--left-drawer-open" : ""
          }`}
        >
          <div className="gf-header__main">
            <div className="gf-lockup gf-header__lockup">
              <a
                aria-label="Fonts"
                className="gf-lockup__link"
                href="/"
                onClick={(event) => {
                  event.preventDefault();
                  navigate({ page: "browse" });
                }}
              >
                <gf-thumbnail className="thumbnail--gf-logo">
                  <LockupLogo />
                </gf-thumbnail>
              </a>
            </div>
            <div className="nav">
              <gf-toolbar-search>
                <gf-toolbar-row>
                  <SearchField />
                  {isBrowse ? (
                    <>
                      <mat-divider
                        role="separator"
                        vertical="true"
                        className="mat-divider full-height mat-divider-vertical"
                        aria-orientation="vertical"
                      ></mat-divider>
                      <gf-sort-by>
                        <gf-select label="Sort by" className="transparent">
                          <MatSelect
                            label="Sort by"
                            ariaLabel="Select a sort order"
                            value={sort}
                            options={[...sortOptions]}
                            onChange={(value) => setSort(value as SortOption)}
                            panelWidth={136}
                            selectId="mat-select-sort"
                          />
                        </gf-select>
                      </gf-sort-by>
                    </>
                  ) : null}
                </gf-toolbar-row>
              </gf-toolbar-search>
              <ShoppingBag />
            </div>
          </div>
          <div className="gf-header__secondary-nav">
            {isBrowse ? <DrawerToggle /> : null}
            {route.page === "specimen" ? (
              <SpecimenSecondaryNav family={route.family} tab={route.tab} />
            ) : null}
          </div>
        </header>
      </div>
    </gf-google-header>
  );
}
