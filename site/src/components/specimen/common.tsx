// Shared Material/markup building blocks for the specimen, selection and
// embed pages. Markup mirrors the harvested fonts.google.com DOM so the
// rules in gf.css apply unchanged.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Icon } from "../../lib/icons";
import type { FamilyMetadata } from "../../lib/metadata";
import { navigate } from "../../lib/router";

// ---------------------------------------------------------------------------
// Buttons

export function MatIconButton({
  label,
  icon,
  size = 24,
  className = "",
  iconClassName = "",
  filled = false,
  disabled = false,
  title,
  onClick,
}: {
  label: string;
  icon: string;
  size?: number;
  className?: string;
  iconClassName?: string;
  filled?: boolean;
  disabled?: boolean;
  title?: string;
  onClick?: () => void;
}) {
  return (
    <button
      mat-icon-button=""
      aria-label={label}
      title={title}
      disabled={disabled || undefined}
      onClick={onClick}
      className={`mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button gmat-mdc-button-with-prefix ${className}${
        disabled ? " mat-mdc-button-disabled" : ""
      }`.trim()}
    >
      <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span>
      <gf-icon
        name={icon}
        role="presentation"
        aria-hidden="true"
        filled={filled ? "" : undefined}
        className={iconClassName}
        style={{ width: size, height: size }}
      >
        <Icon name={icon} size={size} />
      </gf-icon>
      <span className="mat-focus-indicator"></span>
      <span className="mat-mdc-button-touch-target"></span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// mat-select arrow svg

export function SelectArrow() {
  return (
    <div className="mat-mdc-select-arrow-wrapper">
      <div className="mat-mdc-select-arrow">
        <svg
          viewBox="0 0 24 24"
          width="24px"
          height="24px"
          focusable="false"
          aria-hidden="true"
        >
          <path d="M7 10l5 5 5-5z"></path>
        </svg>
      </div>
    </div>
  );
}

// Filled-appearance gf-select (type tester toolbar / size selects). A real
// native <select> is layered invisibly over the trigger so the control works
// while the visible markup matches fonts.google.com.
export function GfSelect({
  ariaLabel,
  value,
  display,
  options,
  onChange,
  className = "",
  title,
  trigger,
}: {
  ariaLabel: string;
  value: string;
  display?: ReactNode;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
  title?: string;
  trigger?: ReactNode;
}) {
  return (
    <gf-select title={title} className={className}>
      <mat-form-field className="mat-mdc-form-field gmat-mdc-form-field mat-mdc-form-field-type-mat-select mat-form-field-appearance-fill mat-primary mat-form-field-animations-enabled">
        <div className="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled mdc-text-field--no-label">
          <div className="mat-mdc-form-field-focus-overlay"></div>
          <div className="mat-mdc-form-field-flex">
            <div className="mat-mdc-form-field-infix">
              <mat-select
                role="combobox"
                aria-haspopup="listbox"
                className="mat-mdc-select gmat-mdc-select options__wrapper"
                tabIndex={-1}
                aria-expanded="false"
                aria-label={ariaLabel}
                style={{ position: "relative" }}
              >
                <div className="mat-mdc-select-trigger">
                  <div className="mat-mdc-select-value">
                    <span className="mat-mdc-select-value-text">
                      <mat-select-trigger className="gf-label-large">
                        {trigger ?? display ?? value}
                      </mat-select-trigger>
                    </span>
                  </div>
                  <SelectArrow />
                </div>
                <select
                  aria-label={ariaLabel}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </mat-select>
            </div>
          </div>
          <div className="mdc-line-ripple mdc-line-ripple--deactivating"></div>
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
    </gf-select>
  );
}

// Outline-appearance gf-select (Styles section variant picker, glyph subset,
// axis fallback dropdown when a `trigger` node is provided).
export function OutlineSelect({
  ariaLabel,
  value,
  options,
  onChange,
  trigger,
}: {
  ariaLabel: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  trigger?: ReactNode;
}) {
  return (
    <gf-select appearance="outline">
      <mat-form-field className="mat-mdc-form-field gmat-mdc-form-field mat-mdc-form-field-type-mat-select mat-form-field-appearance-outline mat-primary mat-form-field-animations-enabled">
        <div className="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--outlined mdc-text-field--no-label">
          <div className="mat-mdc-form-field-flex">
            <div className="mdc-notched-outline mdc-notched-outline--no-label">
              <div className="mat-mdc-notch-piece mdc-notched-outline__leading"></div>
              <div className="mat-mdc-notch-piece mdc-notched-outline__notch"></div>
              <div className="mat-mdc-notch-piece mdc-notched-outline__trailing"></div>
            </div>
            <div className="mat-mdc-form-field-infix">
              <mat-select
                role="combobox"
                aria-haspopup="listbox"
                className="mat-mdc-select gmat-mdc-select options__wrapper"
                tabIndex={-1}
                aria-expanded="false"
                aria-label={ariaLabel}
                style={{ position: "relative" }}
              >
                <div className="mat-mdc-select-trigger">
                  <div className="mat-mdc-select-value">
                    <span className="mat-mdc-select-value-text">
                      {trigger ? (
                        <mat-select-trigger className="gf-label-large">
                          {trigger}
                        </mat-select-trigger>
                      ) : (
                        <span className="mat-mdc-select-min-line">{value}</span>
                      )}
                    </span>
                  </div>
                  <SelectArrow />
                </div>
                <select
                  aria-label={ariaLabel}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </mat-select>
            </div>
          </div>
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
    </gf-select>
  );
}

// ---------------------------------------------------------------------------
// mat-slider (functional). The native range input drives state; the visual
// thumb/track are positioned like Angular Material does (translateX in px).

export function MatSlider({
  ariaLabel,
  min,
  max,
  step,
  value,
  displayValue,
  onChange,
  className = "",
}: {
  ariaLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  displayValue?: string;
  onChange: (value: number) => void;
  className?: string;
}) {
  const host = useRef<HTMLElement | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const update = () => setWidth(element.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const fraction = max > min ? (value - min) / (max - min) : 0;
  const label = displayValue ?? String(value);
  return (
    <mat-slider
      ref={host}
      color="primary"
      discrete=""
      className={`mat-mdc-slider mdc-slider gmat-mdc-slider gf-slider-large mat-primary mdc-slider--discrete ${className}`.trim()}
    >
      <input
        type="range"
        className="mdc-slider__input"
        aria-label={ariaLabel}
        aria-valuetext={label}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
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
              left: 0,
              right: "auto",
              transformOrigin: "left center",
              transform: `scaleX(${fraction})`,
            }}
          ></div>
        </div>
      </div>
      <mat-slider-visual-thumb
        className={`mdc-slider__thumb mat-mdc-slider-visual-thumb${
          label.length < 3 ? " mdc-slider__thumb--short-value" : ""
        }`}
        style={{ transform: `translateX(${fraction * width}px)` }}
      >
        <div className="mdc-slider__value-indicator-container">
          <div className="mdc-slider__value-indicator">
            <span className="mdc-slider__value-indicator-text">{label}</span>
          </div>
        </div>
        <div className="mdc-slider__thumb-knob"></div>
        <div className="mat-ripple mat-focus-indicator"></div>
      </mat-slider-visual-thumb>
    </mat-slider>
  );
}

// ---------------------------------------------------------------------------
// mat-slide-toggle (italic axis toggle)

export function SlideToggle({
  ariaLabel,
  checked,
  onChange,
}: {
  ariaLabel: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <mat-slide-toggle
      className={`mat-mdc-slide-toggle gmat-mdc-slide-toggle mat-primary${
        checked ? " mat-mdc-slide-toggle-checked" : ""
      }`}
    >
      <div className="mdc-form-field mat-internal-form-field">
        <button
          role="switch"
          type="button"
          className={`mdc-switch ${checked ? "mdc-switch--selected mdc-switch--checked" : "mdc-switch--unselected"}`}
          aria-label={ariaLabel}
          aria-checked={checked}
          onClick={() => onChange(!checked)}
        >
          <div className="mat-mdc-slide-toggle-touch-target"></div>
          <span className="mdc-switch__track"></span>
          <span className="mdc-switch__handle-track">
            <span className="mdc-switch__handle">
              <span className="mdc-switch__shadow">
                <span className="mdc-elevation-overlay"></span>
              </span>
              <span className="mdc-switch__ripple">
                <span className="mat-ripple mat-mdc-slide-toggle-ripple mat-focus-indicator"></span>
              </span>
              <span className="mdc-switch__icons">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="mdc-switch__icon mdc-switch__icon--on"
                >
                  <path d="M19.69,5.23L8.96,15.96l-4.23-4.23L2.96,13.5l6,6L21.46,7L19.69,5.23z"></path>
                </svg>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="mdc-switch__icon mdc-switch__icon--off"
                >
                  <path d="M20 13H4v-2h16v2z"></path>
                </svg>
              </span>
            </span>
          </span>
        </button>
        <label className="mdc-label"></label>
      </div>
    </mat-slide-toggle>
  );
}

// ---------------------------------------------------------------------------
// mat-checkbox (type scale italic checkbox)

export function MatCheckbox({
  ariaLabel,
  label,
  checked,
  disabled = false,
  onChange,
  className = "",
}: {
  ariaLabel: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <mat-checkbox
      gmat-checkbox=""
      color="primary"
      className={`mat-mdc-checkbox gmat-mdc-checkbox mat-primary${
        checked ? " mat-mdc-checkbox-checked" : ""
      }${disabled ? " mat-mdc-checkbox-disabled" : ""} ${className}`.trim()}
    >
      <div className="mdc-form-field mat-internal-form-field">
        <div className="mdc-checkbox">
          <div
            aria-hidden="true"
            className="mat-mdc-checkbox-touch-target"
          ></div>
          <input
            type="checkbox"
            className="mdc-checkbox__native-control"
            aria-label={ariaLabel}
            checked={checked}
            disabled={disabled}
            onChange={(event) => onChange(event.target.checked)}
          />
          <div aria-hidden="true" className="mdc-checkbox__ripple"></div>
          <div
            aria-hidden="true"
            className={`mdc-checkbox__background${checked ? " mdc-checkbox--selected" : ""}`}
          >
            <svg
              focusable="false"
              viewBox="0 0 24 24"
              className="mdc-checkbox__checkmark"
            >
              <path
                fill="none"
                d="M1.73,12.91 8.1,19.28 22.79,4.59"
                className="mdc-checkbox__checkmark-path"
              ></path>
            </svg>
            <div className="mdc-checkbox__mixedmark"></div>
          </div>
          <div
            aria-hidden="true"
            className="mat-ripple mat-mdc-checkbox-ripple mat-focus-indicator"
          ></div>
        </div>
        <label className="mdc-label">
          <span className="checkbox__title gf-body-medium">{label}</span>
        </label>
      </div>
    </mat-checkbox>
  );
}

// ---------------------------------------------------------------------------
// Filter chips (specimen tag row / how-to-use categories)

export function FilterChips({
  ariaLabel,
  chips,
  nowrap = false,
  onToggle,
}: {
  ariaLabel: string;
  chips: Array<{ label: string; selected?: boolean }>;
  nowrap?: boolean;
  onToggle?: (label: string) => void;
}) {
  return (
    <gf-filter-chips>
      <mat-chip-listbox
        aria-label={ariaLabel}
        className={`mdc-evolution-chip-set mat-mdc-chip-listbox mat-mdc-chip-set selectable${
          nowrap ? " nowrap" : ""
        }`}
        role="listbox"
        tabIndex={0}
        aria-required="false"
        aria-disabled="false"
        aria-multiselectable="false"
        aria-orientation="horizontal"
      >
        <div role="presentation" className="mdc-evolution-chip-set__chips">
          {chips.map((chip) => (
            <mat-chip-option
              key={chip.label}
              appearance="hairline-filter"
              className={`mat-mdc-chip mat-mdc-chip-option gmat-mdc-chip mat-primary mdc-evolution-chip mat-mdc-standard-chip mdc-evolution-chip--filter mdc-evolution-chip--selectable${
                chip.selected
                  ? " mat-mdc-chip-selected mdc-evolution-chip--selected"
                  : ""
              } mdc-evolution-chip--selecting mdc-evolution-chip--with-primary-graphic gmat-filter-chip gmat-hairline-chip gmat-selectable-chip`}
              role="presentation"
            >
              <span className="mat-mdc-chip-focus-overlay"></span>
              <span className="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
                <button
                  role="option"
                  className="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
                  type="button"
                  aria-label={`Filter by ${chip.label}`}
                  aria-selected={chip.selected ? "true" : "false"}
                  aria-disabled="false"
                  tabIndex={-1}
                  onClick={onToggle ? () => onToggle(chip.label) : undefined}
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
                    {chip.label}
                    <span className="mat-mdc-chip-primary-focus-indicator mat-focus-indicator"></span>
                  </span>
                </button>
              </span>
            </mat-chip-option>
          ))}
        </div>
      </mat-chip-listbox>
    </gf-filter-chips>
  );
}

// ---------------------------------------------------------------------------
// Specimen header (family title + "Designed by" links)

export function SpecimenHeader({
  font,
  className,
}: {
  font: FamilyMetadata;
  className?: string;
}) {
  const displayName = font.displayName;
  const onDesigner = (name: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    navigate(
      { page: "browse" },
      { query: `?query=${encodeURIComponent(name)}` },
    );
  };
  return (
    <gf-specimen-header className={className}>
      {displayName ? (
        <div className="responsive-headings">
          <h1 className="mat-text--title title header--breakable">
            {displayName}
          </h1>
        </div>
      ) : (
        <h1 className="mat-text--title gm3-type-xl title header--breakable">
          {font.family}
        </h1>
      )}
      {!displayName && font.designers.length > 0 ? (
        <div className="header__subtitle">
          <p className="mat-text--secondary gm3-type-body header__subtitle-designer">
            Designed by{" "}
            {font.designers.map((name, index) => (
              <span key={name}>
                <a
                  href={`/?query=${encodeURIComponent(name)}`}
                  onClick={onDesigner(name)}
                >
                  {name}
                </a>
                {index < font.designers.length - 1 ? "," : null}{" "}
              </span>
            ))}
          </p>
        </div>
      ) : null}
    </gf-specimen-header>
  );
}

// ---------------------------------------------------------------------------
// Knowledge carousel section ("Choosing type", "Develop in web", ...)

export type KnowledgeCard = {
  title: string;
  href: string;
  image: string;
};

export function KnowledgeCards({
  cards,
  className,
}: {
  cards: KnowledgeCard[];
  className?: string;
}) {
  return (
    <gf-carousel className={className}>
      <div className="scrollable">
        <div className="wrapper carousel__cols-3">
          {cards.map((card, index) => (
            <gf-knowledge-card
              key={card.href}
              gf-carousel-item=""
              className={`carousel-item fill-height${index === 0 ? " carousel-item--active" : ""}`}
            >
              <a
                className="mat-ripple gf-block-anchor card__wrapper"
                aria-label={card.title}
                href={card.href}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  width="488"
                  height="275"
                  className="card__image card__image--painted"
                  title={card.title}
                  alt=""
                  loading="lazy"
                  src={card.image}
                />
                <p className="card__title gf-headline-small card__title--no-description">
                  {card.title}
                </p>
              </a>
            </gf-knowledge-card>
          ))}
        </div>
        <div className="gradient gradient--right"></div>
        <button
          mat-fab=""
          appearance="fill"
          color="secondary"
          className="mdc-fab mat-mdc-fab-base mat-mdc-fab mat-mdc-button-base gmat-mdc-button nav-button nav-button--right gmat-elevation-z2 mat-secondary gmat-mdc-fab-fill gmat-mdc-fab-lowered"
          aria-hidden="true"
          tabIndex={-1}
          onClick={(event) => {
            const scrollable = (event.currentTarget as HTMLElement).closest(
              ".scrollable",
            );
            scrollable?.scrollBy({ left: 500, behavior: "smooth" });
          }}
        >
          <span className="mat-mdc-button-persistent-ripple mdc-fab__ripple"></span>
          <span className="mdc-button__label">
            <gf-icon
              name="arrow_forward_ios"
              className="nav-button__icon"
              role="presentation"
              aria-hidden="true"
              style={{ width: 20, height: 20 }}
            >
              <Icon name="arrow_forward_ios" size={20} />
            </gf-icon>
          </span>
          <span className="mat-focus-indicator"></span>
          <span className="mat-mdc-button-touch-target"></span>
        </button>
      </div>
    </gf-carousel>
  );
}

export function KnowledgeSection({
  title,
  viewAllHref,
  viewAllLabel,
  description,
  cards,
  descriptionClass = "description gm3-type-body",
  children,
}: {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  description: string;
  cards?: KnowledgeCard[];
  descriptionClass?: string;
  children?: ReactNode;
}) {
  return (
    <gf-knowledge-section>
      <div className="header responsive-headings">
        <h2 className="header__left">{title}</h2>
        <div className="header__right">
          {viewAllHref ? (
            <a
              mat-stroked-button=""
              section-action=""
              color="primary"
              className="mdc-button mat-mdc-button-base gmat-mdc-button module__view-all-button mdc-button--outlined mat-mdc-outlined-button mat-primary"
              aria-label={viewAllLabel ?? `View all articles in ${title}`}
              href={viewAllHref}
              target="_blank"
              rel="noreferrer"
            >
              <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
              <span className="mdc-button__label">View all articles</span>
              <span className="mat-focus-indicator"></span>
              <span className="mat-mdc-button-touch-target"></span>
            </a>
          ) : null}
        </div>
      </div>
      <div className="content">
        <p className={descriptionClass}>{description}</p>
        {children ?? (cards ? <KnowledgeCards cards={cards} /> : null)}
      </div>
    </gf-knowledge-section>
  );
}

// ---------------------------------------------------------------------------
// Family tag chips (classification + technology + expressive tags)

const TAG_SECTION_LABELS: Array<[string, string]> = [
  ["/Sans/", "Sans Serif"],
  ["/Serif/", "Serif"],
  ["/Slab/", "Slab Serif"],
  ["/Script/", "Calligraphy"],
  ["/Theme/", "Appearance"],
  ["/Seasonal/", "Seasonal"],
  ["/Expressive/", "Feeling"],
];

export function familyTagChips(
  font: FamilyMetadata,
  tags: Record<string, Record<string, number>> | undefined,
): string[] {
  const chips: Array<{ label: string; group: number; score: number }> = [];
  if (tags) {
    for (const [tag, families] of Object.entries(tags)) {
      const score = families[font.family];
      if (score === undefined || score < 30) continue;
      const section = TAG_SECTION_LABELS.find(([prefix]) =>
        tag.startsWith(prefix),
      );
      if (!section) continue;
      const value = tag.slice(section[0].length);
      const group = TAG_SECTION_LABELS.findIndex(
        ([prefix]) => prefix === section[0],
      );
      chips.push({ label: `${section[1]} — ${value}`, group, score });
    }
  }
  chips.sort((a, b) => a.group - b.group || b.score - a.score);
  const labels = chips.map((chip) => chip.label);
  // Technology chips appear after classification chips, before feelings.
  const technology: string[] = [];
  if (font.axes.length > 0) technology.push("Technology — Variable");
  if (font.colorCapabilities.length > 0) technology.push("Technology — Color");
  const firstFeeling = labels.findIndex((label) => label.startsWith("Feeling"));
  if (firstFeeling === -1) return [...labels, ...technology];
  return [
    ...labels.slice(0, firstFeeling),
    ...technology,
    ...labels.slice(firstFeeling),
  ];
}

// ---------------------------------------------------------------------------
// Sample text helpers shared by tester / styles / type-scale sections.

export type SampleTexts = {
  // Type tester blocks (Heading 1/2/3 defaults).
  tester: string[];
  // Type-scale grid, by font size key.
  grid: Record<48 | 36 | 32 | 21 | 16, string>;
  // CJK poster lines (md/lg/sm), null for latin specimens.
  poster: { md: string; lg: string; sm: string } | null;
};

const LATIN_PARAGRAPH_A =
  "No one shall be subjected to arbitrary arrest, detention or exile. Everyone is entitled in full equality to a fair and public hearing by an independent and impartial tribunal, in the determination of his rights and obligations and of any criminal charge against him. No one shall be subjected to arbitrary interference with his privacy, family, home or correspondence, nor to attacks upon his honour and reputation. Everyone has the right to the protection of the law against such interference or attacks.";

const LATIN_PARAGRAPH_B =
  "Everyone has the right to freedom of thought, conscience and religion; this right includes freedom to change his religion or belief, and freedom, either alone or in community with others and in public or private, to manifest his religion or belief in teaching, practice, worship and observance. Everyone has the right to freedom of opinion and expression; this right includes freedom to hold opinions without interference and to seek, receive and impart information and ideas through any media and regardless of frontiers. Everyone has the right to rest and leisure, including reasonable limitation of working hours and periodic holidays with pay.";

const CJK_PARAGRAPH =
  "鉴于对人类家庭所有成员的固有尊严及其平等的和不移的权利的承认,乃是世界自由、正义与和平的基础, 鉴于对人权的无视和侮蔑已发展为野蛮暴行,这些暴行玷污了人类的良心";

export function sampleTextsFor(
  font: FamilyMetadata,
  script: "latin" | "sc" | "tc" | "jp" | "kr",
  stylesSample: string,
): SampleTexts {
  if (script === "latin") {
    return {
      tester: [stylesSample, LATIN_PARAGRAPH_A, LATIN_PARAGRAPH_B],
      grid: {
        48: "Whereas a common understanding of these rights and freedoms is",
        36: "No one shall be held in slavery or servitude; slavery and the slave trade shall be prohibited in all their forms.",
        32: "Everyone has the right to an effective remedy by the competent national tribunals for acts violating the fundamental rights granted him by the constitution or by law.",
        21: LATIN_PARAGRAPH_A,
        16: LATIN_PARAGRAPH_B,
      },
      poster: null,
    };
  }
  if (script === "sc" || script === "tc") {
    const traditional = script === "tc";
    const t = (simplified: string, trad: string) =>
      traditional ? trad : simplified;
    return {
      tester: [stylesSample, CJK_PARAGRAPH, CJK_PARAGRAPH],
      grid: {
        48: t(
          "法律之前人人平等,并有权享受法律的平等保护,不受任何歧视。",
          "法律之前人人平等,並有權享受法律的平等保護,不受任何歧視。",
        ),
        36: CJK_PARAGRAPH,
        32: CJK_PARAGRAPH,
        21: CJK_PARAGRAPH,
        16: CJK_PARAGRAPH,
      },
      poster: {
        md: t("任何人不得使为奴隶或奴役", "任何人不得使為奴隸或奴役"),
        lg: t("人人生而自由", "人人生而自由"),
        sm: t(
          "人人有权享有生命、自由和人身安全",
          "人人有權享有生命、自由和人身安全",
        ),
      },
    };
  }
  if (script === "jp") {
    const paragraph =
      "人類社会のすべての構成員の固有の尊厳と平等で譲ることのできない権利とを承認することは、世界における自由、正義及び平和の基礎である";
    return {
      tester: [stylesSample, paragraph, paragraph],
      grid: {
        48: "すべての人は、法の前において平等であり、",
        36: paragraph,
        32: paragraph,
        21: paragraph,
        16: paragraph,
      },
      poster: {
        md: "何人も、奴隷にされ、又は苦役に服することはない",
        lg: "すべての人間は、生まれながらにして自由であり",
        sm: "すべての人は、生命、自由及び身体の安全に対する権利を有する",
      },
    };
  }
  const paragraph =
    "모든 인류 구성원의 천부의 존엄성과 동등하고 양도할 수 없는 권리를 인정하는 것이 세계의 자유, 정의 및 평화의 기초이며";
  return {
    tester: [stylesSample, paragraph, paragraph],
    grid: {
      48: "모든 사람은 법 앞에 평등하며",
      36: paragraph,
      32: paragraph,
      21: paragraph,
      16: paragraph,
    },
    poster: {
      md: "어느 누구도 노예나 예속 상태에 놓이지 아니한다",
      lg: "모든 인간은 태어날 때부터 자유로우며",
      sm: "모든 사람은 생명권과 신체의 자유와 안전을 누릴 권리가 있다",
    },
  };
}

// ---------------------------------------------------------------------------
// Selection / embed tile subheader ("Variable" pill or "N styles" label)

export function TileVariantLabel({ font }: { font: FamilyMetadata }) {
  if (font.axes.length > 0) {
    return (
      <gf-tile-variant-button>
        <button
          mat-button=""
          color="secondary"
          type="button"
          aria-label="More information about variable fonts"
          className="mdc-button mat-mdc-button-base gmat-mdc-button xap-inline-dialog variant variant--variable mat-text--secondary gf-label-large mat-mdc-button gmat-mdc-button-with-prefix mat-secondary"
        >
          <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
          <span className="mdc-button__label">
            <span className="variant__label">Variable</span>
            <gf-icon
              name="info"
              role="presentation"
              aria-hidden="true"
              style={{ width: 20, height: 20 }}
            >
              <Icon name="info" size={20} />
            </gf-icon>
          </span>
          <span className="mat-focus-indicator"></span>
          <span className="mat-mdc-button-touch-target"></span>
        </button>
      </gf-tile-variant-button>
    );
  }
  const count = Object.keys(font.fonts).length;
  return (
    <gf-tile-variant-button>
      <span className="variant variant__label mat-text--secondary gf-label-large">
        {count} {count === 1 ? "style" : "styles"}
      </span>
    </gf-tile-variant-button>
  );
}

// ---------------------------------------------------------------------------
// Misc

// Font-family stack for inline samples once ensureFullFamily() loaded the css.
export function familyStack(font: FamilyMetadata): CSSProperties {
  return { fontFamily: `"${font.family}", Tofu` };
}

export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
