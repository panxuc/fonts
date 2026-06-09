// Left filter drawer (gf-fonts-drawer): preview controls, language filters
// and the category chip sections, mirroring the fonts.google.com drawer.
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import { useAppState } from "../lib/app-state";
import {
  filterSections,
  hasActiveFilters,
  writingSystems,
  type FilterSection,
  type WritingSystem,
} from "../lib/filtering";
import type { FamilyMetadata } from "../lib/metadata";
import { ensurePreviewFont } from "../lib/preview-fonts";
import {
  ButtonSpans,
  ExpansionPanel,
  FormFieldSubscript,
  GfIcon,
  IconButtonRipple,
  LineRipple,
  MatSelect,
  OverlayPortal,
  attrs,
  useAnchorRect,
  useDismiss,
  withAttrs,
} from "./mat";

const FONT_SIZE_OPTIONS = [8, 12, 14, 20, 24, 32, 40, 64, 96, 120, 184, 280];
const SLIDER_MIN = 8;
const SLIDER_MAX = 300;

// Per-chip preview font sizes harvested from the live drawer (the site tunes
// the size per family so all chips read at a similar optical size).
const CHIP_FONT_SIZES: Record<string, number> = {
  "feeling|Business": 14,
  "feeling|Fancy": 19,
  "feeling|Calm": 14,
  "feeling|Playful": 14,
  "feeling|Cute": 20,
  "feeling|Artistic": 17,
  "feeling|Vintage": 17,
  "feeling|Loud": 15,
  "feeling|Sophisticated": 15,
  "feeling|Futuristic": 13,
  "feeling|Active": 16,
  "feeling|Stiff": 15,
  "feeling|Innovative": 14,
  "feeling|Happy": 15,
  "feeling|Childlike": 14,
  "feeling|Rugged": 15,
  "feeling|Awkward": 14,
  "feeling|Excited": 14,
  "appearance|Techno": 15,
  "appearance|Monospaced": 14,
  "appearance|Blobby": 17,
  "appearance|Marker": 15,
  "appearance|Art Deco": 15,
  "appearance|Art Nouveau": 15,
  "appearance|Distressed": 16,
  "appearance|Stencil": 14,
  "appearance|Wood type": 14,
  "appearance|Medieval": 13,
  "appearance|Blackletter": 16,
  "appearance|Pixel": 17,
  "appearance|Not text": 14,
  "appearance|Tuscan": 15,
  "appearance|Wacky": 15,
  "appearance|Shaded": 14,
  "appearance|Inline": 14,
  "calligraphy|All": 14,
  "calligraphy|Handwritten": 16,
  "calligraphy|Formal": 19,
  "calligraphy|Informal": 16,
  "calligraphy|Upright": 16,
  "serif|All": 14,
  "serif|Transitional": 14,
  "serif|Slab": 14,
  "serif|Old Style": 16,
  "serif|Modern": 14,
  "serif|Humanist": 16,
  "serif|Scotch": 16,
  "serif|Fatface": 13,
  "serif|Didone": 15,
  "sans-serif|All": 14,
  "sans-serif|Humanist": 14,
  "sans-serif|Geometric": 14,
  "sans-serif|Neo Grotesque": 14,
  "sans-serif|Rounded": 15,
  "sans-serif|Superellipse": 14,
  "sans-serif|Grotesque": 15,
  "sans-serif|Glyphic": 14,
  "technology|None": 14,
  "seasonal|Lunar New Year": 18,
  "seasonal|Valentine's": 19,
  "seasonal|Holi": 21.5,
  "seasonal|Halloween": 18,
  "seasonal|Diwali": 15,
  "seasonal|Christmas": 16.5,
  "seasonal|Hanukkah": 16.5,
  "seasonal|Kwanzaa": 16.5,
};

function PreviewTextField() {
  const { previewText, setPreviewText } = useAppState();
  return (
    <gf-text-modifier>
      <mat-form-field className="mat-mdc-form-field gmat-mdc-form-field text-modifier__input-container gf-body-large mat-form-field--none mat-mdc-form-field-type-mat-input mat-form-field-appearance-fill mat-primary mat-form-field-animations-enabled">
        <div className="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled mdc-text-field--no-label">
          <div className="mat-mdc-form-field-focus-overlay"></div>
          <div className="mat-mdc-form-field-flex">
            <div className="mat-mdc-form-field-infix">
              <textarea
                {...attrs("matinput")}
                aria-label="Preview text"
                placeholder="Type something"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                dir="auto"
                className="gmat-mdc-input mat-mdc-input-element text-modifier__input mat-mdc-form-field-textarea-control mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"
                rows={5}
                id="mat-input-preview-text"
                aria-invalid="false"
                aria-required="false"
                value={previewText}
                onChange={(event) => setPreviewText(event.target.value)}
              ></textarea>
            </div>
          </div>
          <LineRipple />
        </div>
        <FormFieldSubscript />
      </mat-form-field>
    </gf-text-modifier>
  );
}

function FontSizeSlider() {
  const { previewSize, setPreviewSize } = useAppState();
  const sliderRef = useRef<HTMLElement | null>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  useLayoutEffect(() => {
    const element = sliderRef.current;
    if (!element) return;
    const update = () => setTrackWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const clamped = Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, previewSize));
  const fraction = (clamped - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);
  return (
    <mat-slider
      ref={sliderRef}
      color="primary"
      discrete=""
      className="mat-mdc-slider mdc-slider gmat-mdc-slider font-size__slider gf-slider-large mat-primary mdc-slider--discrete"
    >
      <input
        type="range"
        {...attrs("matsliderthumb")}
        aria-label="font size slider"
        className="mdc-slider__input"
        aria-valuetext={String(clamped)}
        step={1}
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        value={clamped}
        onChange={(event) => setPreviewSize(Number(event.target.value))}
        style={{
          padding: "0px 16px",
          width: "calc(100% + 10px)",
          left: "-21px",
        }}
      />
      <div className="mdc-slider__track">
        <div className="mdc-slider__track--inactive"></div>
        <div className="mdc-slider__track--active">
          <div
            className="mdc-slider__track--active_fill"
            style={{
              left: "0px",
              right: "auto",
              transformOrigin: "left center",
              transform: `scaleX(${fraction})`,
            }}
          ></div>
        </div>
      </div>
      <mat-slider-visual-thumb
        className="mdc-slider__thumb mat-mdc-slider-visual-thumb mdc-slider__thumb--short-value"
        style={{ transform: `translateX(${fraction * trackWidth}px)` }}
      >
        <div className="mdc-slider__value-indicator-container">
          <div className="mdc-slider__value-indicator">
            <span className="mdc-slider__value-indicator-text">{clamped}</span>
          </div>
        </div>
        <div className="mdc-slider__thumb-knob"></div>
        <div
          {...attrs("matripple")}
          className="mat-ripple mat-focus-indicator"
        ></div>
      </mat-slider-visual-thumb>
    </mat-slider>
  );
}

function FontSizeModifier() {
  const { previewSize, setPreviewSize } = useAppState();
  const options = FONT_SIZE_OPTIONS.includes(previewSize)
    ? FONT_SIZE_OPTIONS
    : [...FONT_SIZE_OPTIONS, previewSize].sort((a, b) => a - b);
  return (
    <gf-drawer-font-size-modifier>
      <gf-font-size-modifier>
        <div className="font-size__wrapper has-slider">
          <gf-select mattooltip="Font size" className="mat-mdc-tooltip-trigger">
            <MatSelect
              ariaLabel="Select a font size"
              value={String(previewSize)}
              display={`${previewSize}px`}
              options={options.map(String)}
              onChange={(value) => setPreviewSize(Number(value))}
              triggerVariant="trigger"
              selectId="mat-select-font-size"
            />
          </gf-select>
        </div>
        <FontSizeSlider />
      </gf-font-size-modifier>
    </gf-drawer-font-size-modifier>
  );
}

// Searchable select used for "Writing system" (functional) and "Language"
// (present but inert; we do not replicate the language database).
function SearchableSelect({
  label,
  placeholder,
  value,
  options,
  onSelect,
  inputId,
  inert = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  options?: readonly string[];
  onSelect?: (value: string) => void;
  inputId: string;
  inert?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const fieldRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => {
    setOpen(false);
    setText(null);
  }, []);
  const rect = useAnchorRect(open, fieldRef as RefObject<HTMLElement>);
  useDismiss(open, close, [
    fieldRef,
    panelRef as RefObject<HTMLElement | null>,
  ]);

  const displayValue = text ?? value;
  const filtered =
    options?.filter((option) =>
      text
        ? option.toLocaleLowerCase().includes(text.toLocaleLowerCase())
        : true,
    ) ?? [];
  const floatLabel = open || displayValue !== "";

  const pick = (option: string) => {
    onSelect?.(option);
    close();
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (inert) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      else setActiveIndex((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" && open) {
      const option = filtered[activeIndex] ?? filtered[0];
      if (option) {
        event.preventDefault();
        pick(option);
      }
    } else if (event.key === "Escape") {
      close();
    }
  };

  return (
    <gf-searchable-select label={label} placeholder={placeholder}>
      <mat-form-field
        ref={fieldRef}
        className={`mat-mdc-form-field gmat-mdc-form-field mat-mdc-form-field-type-mat-input mat-mdc-form-field-has-icon-suffix mat-form-field-appearance-fill${
          floatLabel ? "" : " mat-form-field-hide-placeholder"
        } mat-primary mat-form-field-animations-enabled${
          open ? " mat-focused" : ""
        }`}
      >
        <div
          className={`mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled${
            open ? " mdc-text-field--focused" : ""
          }`}
        >
          <div className="mat-mdc-form-field-focus-overlay"></div>
          <div className="mat-mdc-form-field-flex">
            <div className="mat-mdc-form-field-infix">
              <label
                {...attrs("matformfieldfloatinglabel")}
                className={`mdc-floating-label mat-mdc-floating-label${
                  floatLabel ? " mdc-floating-label--float-above" : ""
                }`}
                id={`${inputId}-label`}
                htmlFor={inputId}
              >
                <mat-label className="gf-label-large">{label}</mat-label>
              </label>
              <input
                {...attrs("matinput")}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                dir="auto"
                spellCheck={false}
                className="mat-mdc-autocomplete-trigger gmat-mdc-input mat-mdc-input-element select__search mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"
                placeholder={placeholder}
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={open}
                aria-haspopup="listbox"
                id={inputId}
                aria-invalid="false"
                aria-required="false"
                readOnly={inert}
                value={displayValue}
                onChange={(event) => {
                  setText(event.target.value);
                  setActiveIndex(-1);
                }}
                onFocus={() => {
                  if (!inert) {
                    setOpen(true);
                    setText("");
                  }
                }}
                onClick={() => {
                  if (!inert) setOpen(true);
                }}
                onKeyDown={onKeyDown}
              />
              <mat-autocomplete
                hidesingleselectionindicator=""
                className="mat-mdc-autocomplete"
              ></mat-autocomplete>
            </div>
            <div className="mat-mdc-form-field-icon-suffix">
              <GfIcon
                name="arrow_drop_down"
                className="select__arrow"
                withName
              />
            </div>
          </div>
          <LineRipple />
        </div>
        <FormFieldSubscript />
      </mat-form-field>
      {open && rect && filtered.length > 0 ? (
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
                className="mat-mdc-autocomplete-panel mdc-menu-surface mdc-menu-surface--open gmat-elevation-z1 mat-autocomplete-panel-animations-enabled mat-primary mat-mdc-autocomplete-visible"
                id={`${inputId}-listbox`}
                aria-label={label}
              >
                {filtered.map((option, index) => {
                  const selected = option === value;
                  return (
                    <mat-option
                      key={option}
                      role="option"
                      className={`mat-mdc-option mdc-list-item${
                        selected ? " mdc-list-item--selected" : ""
                      }${index === activeIndex ? " mat-mdc-option-active" : ""}`}
                      id={`${inputId}-option-${index}`}
                      aria-selected={selected}
                      aria-disabled="false"
                      onClick={() => pick(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <span className="mdc-list-item__primary-text">
                        <span className="gf-body-large">{option}</span>
                      </span>
                      <div
                        aria-hidden="true"
                        {...attrs("mat-ripple")}
                        className="mat-ripple mat-mdc-option-ripple mat-focus-indicator"
                      ></div>
                    </mat-option>
                  );
                })}
              </div>
            </div>
          </div>
        </OverlayPortal>
      ) : null}
    </gf-searchable-select>
  );
}

function FilterChip({
  section,
  label,
  index,
  selected,
  font,
  onToggle,
}: {
  section: FilterSection;
  label: string;
  index: number;
  selected: boolean;
  font: FamilyMetadata | undefined;
  onToggle: () => void;
}) {
  const size = CHIP_FONT_SIZES[`${section.id}|${label}`] ?? 14;
  return (
    <mat-chip-option
      appearance="hairline-filter"
      className={`mat-mdc-chip mat-mdc-chip-option gmat-mdc-chip filter mat-primary mdc-evolution-chip mat-mdc-standard-chip mdc-evolution-chip--filter mdc-evolution-chip--selectable mdc-evolution-chip--selecting mdc-evolution-chip--with-primary-graphic gmat-filter-chip gmat-hairline-chip gmat-selectable-chip${
        selected ? " mat-mdc-chip-selected mdc-evolution-chip--selected" : ""
      }`}
      id={`mat-mdc-chip-${section.id}-${index}`}
      role="presentation"
    >
      <span className="mat-mdc-chip-focus-overlay"></span>
      <span className="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
        <button
          {...attrs("matchipaction")}
          role="option"
          className="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
          type="button"
          aria-selected={selected}
          aria-disabled="false"
          tabIndex={-1}
          onClick={onToggle}
        >
          <span className="mdc-evolution-chip__graphic mat-mdc-chip-graphic">
            <span className="mdc-evolution-chip__checkmark">
              <svg
                viewBox="-2 -3 30 30"
                focusable="false"
                aria-hidden="true"
                className="mdc-evolution-chip__checkmark-svg"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  d="M1.73,12.91 8.1,19.28 22.79,4.59"
                  className="mdc-evolution-chip__checkmark-path"
                ></path>
              </svg>
            </span>
          </span>
          <span className="mdc-evolution-chip__text-label mat-mdc-chip-action-label">
            <div
              translate="no"
              className="filter__label"
              style={{
                fontSize: `${size}px`,
                fontFamily: font ? `"${font.family}"` : undefined,
                fontWeight: 400,
                fontStyle: "normal",
                fontStretch: "normal",
              }}
            >
              {label}
            </div>
            <span className="mat-mdc-chip-primary-focus-indicator mat-focus-indicator"></span>
          </span>
        </button>
      </span>
    </mat-chip-option>
  );
}

function ChipSection({ section }: { section: FilterSection }) {
  const { familyByName, filters, toggleChip } = useAppState();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [fontsRequested, setFontsRequested] = useState(false);

  // Load the chips' representative preview fonts lazily, when the section
  // scrolls into view in the drawer.
  useEffect(() => {
    if (fontsRequested) return;
    const element = bodyRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setFontsRequested(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setFontsRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [fontsRequested]);

  useEffect(() => {
    if (!fontsRequested) return;
    for (const value of section.values) {
      const familyName = section.chipFonts?.[value];
      const font = familyName ? familyByName.get(familyName) : undefined;
      if (font) ensurePreviewFont(font, value);
    }
  }, [fontsRequested, section, familyByName]);

  const selectedValues = filters.chips[section.id] ?? [];
  return (
    <gf-category-filters-section>
      <ExpansionPanel
        title={section.label}
        icon={section.icon}
        iconFontFamily='"Google Symbols Category Filters"'
      >
        <div ref={bodyRef}>
          <mat-chip-listbox
            className="mdc-evolution-chip-set mat-mdc-chip-listbox mat-mdc-chip-set fixed-width"
            aria-label={`Filter fonts by ${section.label}`}
            role="listbox"
            tabIndex={0}
            aria-required="false"
            aria-disabled="false"
            aria-multiselectable="false"
            aria-orientation="horizontal"
          >
            <div role="presentation" className="mdc-evolution-chip-set__chips">
              {section.values.map((value, index) => {
                const familyName = section.chipFonts?.[value];
                return (
                  <FilterChip
                    key={value}
                    section={section}
                    label={value}
                    index={index}
                    selected={selectedValues.includes(value)}
                    font={familyName ? familyByName.get(familyName) : undefined}
                    onToggle={() => toggleChip(section.id, value)}
                  />
                );
              })}
            </div>
          </mat-chip-listbox>
        </div>
      </ExpansionPanel>
    </gf-category-filters-section>
  );
}

// Static "Properties / Number of styles" panel (visual parity only).
function PropertiesPanel() {
  return (
    <ExpansionPanel
      title="Properties"
      icon="linear_scale"
      iconName
      panelClassName=" left-drawer__expansion-panel--number-of-style"
    >
      <gf-font-property-filter>
        <span id="label-number-of-styles" className="gf-label-large nowrap">
          Number of styles
        </span>
        <mat-slider
          color="primary"
          discrete=""
          aria-labelledby="label-number-of-styles"
          className="mat-mdc-slider mdc-slider gmat-mdc-slider menu__slider mat-primary mdc-slider--discrete"
        >
          <input
            type="range"
            {...attrs("matsliderthumb")}
            aria-labelledby="label-number-of-styles"
            className="mdc-slider__input"
            aria-valuetext="1"
            step={1}
            min={1}
            max={18}
            defaultValue={1}
            style={{
              padding: "0px 16px",
              width: "calc(100% + 10px)",
              left: "-21px",
            }}
          />
          <div className="mdc-slider__track">
            <div className="mdc-slider__track--inactive"></div>
            <div className="mdc-slider__track--active">
              <div
                className="mdc-slider__track--active_fill"
                style={{
                  left: "0px",
                  right: "auto",
                  transformOrigin: "left center",
                  transform: "scaleX(0.03)",
                }}
              ></div>
            </div>
          </div>
          <mat-slider-visual-thumb
            className="mdc-slider__thumb mat-mdc-slider-visual-thumb mdc-slider__thumb--short-value"
            style={{ transform: "translateX(3px)" }}
          >
            <div className="mdc-slider__value-indicator-container">
              <div className="mdc-slider__value-indicator">
                <span className="mdc-slider__value-indicator-text">1</span>
              </div>
            </div>
            <div className="mdc-slider__thumb-knob"></div>
            <div
              {...attrs("matripple")}
              className="mat-ripple mat-focus-indicator"
            ></div>
          </mat-slider-visual-thumb>
        </mat-slider>
      </gf-font-property-filter>
    </ExpansionPanel>
  );
}

export function LeftDrawer() {
  const {
    filters,
    previewText,
    previewSize,
    setWritingSystem,
    resetFilters,
    setDrawerOpen,
  } = useAppState();
  const pristine =
    !hasActiveFilters(filters) && previewText === "" && previewSize === 40;

  return (
    <gf-left-drawer id="left-drawer">
      <gf-fonts-drawer>
        <gf-left-drawer-reset>
          <button
            {...withAttrs({ "mat-button": "", color: "primary" })}
            aria-label="Reset all filters"
            className={`mdc-button mat-mdc-button-base gmat-mdc-button reset-button__button mat-mdc-button gmat-mdc-button-with-prefix mat-primary${
              pristine ? " mat-mdc-button-disabled" : ""
            }`}
            disabled={pristine}
            onClick={resetFilters}
          >
            <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
            <span className="mdc-button__label">
              <div className="reset-button__label">
                <GfIcon
                  name="refresh"
                  className="reset-button__icon"
                  withName
                />
                <span className="gf-label-large">Reset all</span>
              </div>
            </span>
            <ButtonSpans />
          </button>
          <button
            {...withAttrs({ "mat-icon-button": "", color: "secondary" })}
            aria-label="Close filters drawer"
            className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button close-button gmat-mdc-button-with-prefix mat-secondary"
            onClick={() => setDrawerOpen(false)}
          >
            <IconButtonRipple />
            <GfIcon name="close" withName />
            <ButtonSpans />
          </button>
        </gf-left-drawer-reset>
        <div className="section-title__wrapper">
          <h2 className="section-title gf-label-large">Preview</h2>
        </div>
        <PreviewTextField />
        <FontSizeModifier />
        <mat-divider
          role="separator"
          className="mat-divider divider mat-divider-horizontal"
          aria-orientation="horizontal"
        ></mat-divider>
        <div className="section-title__wrapper">
          <h2 className="section-title gf-label-large">Filter</h2>
        </div>
        <ExpansionPanel title="Language" icon="language" iconName>
          <gf-lang-filters>
            <SearchableSelect
              label="Writing system"
              placeholder="Search for writing system"
              value={
                filters.writingSystem === "All writing systems"
                  ? ""
                  : filters.writingSystem
              }
              options={writingSystems}
              onSelect={(value) => setWritingSystem(value as WritingSystem)}
              inputId="mat-input-writing-system"
            />
            <SearchableSelect
              label="Language"
              placeholder="Search for language"
              value=""
              inputId="mat-input-language"
              inert
            />
          </gf-lang-filters>
        </ExpansionPanel>
        <gf-category-filters>
          {filterSections.map((section) => (
            <ChipSection key={section.id} section={section} />
          ))}
        </gf-category-filters>
        <PropertiesPanel />
        <gf-drawer-sort-by></gf-drawer-sort-by>
      </gf-fonts-drawer>
    </gf-left-drawer>
  );
}
