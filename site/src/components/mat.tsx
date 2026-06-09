// Shared Angular-Material-shaped primitives used by the browse experience.
// The markup mirrors the cleaned fonts.google.com DOM snapshots so the
// harvested gf.css styles it without changes.
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

// Overlays render into a cdk-overlay-container at the body level, like the
// real app. Rendering them inline would subject position:fixed to ancestor
// transform/contain containing-blocks and inherited text styles.
export function OverlayPortal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="cdk-overlay-container">{children}</div>,
    document.body,
  );
}

// Angular marker attributes (mat-icon-button="", matinput="", color="...")
// are not in React's DOM typings; spread them so TS accepts them on
// intrinsic elements.
export function attrs(...names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, ""]));
}

export function withAttrs(map: Record<string, string>): Record<string, string> {
  return map;
}

// gf-icon wrapper exactly as the live site renders Google Symbols icons.
export function GfIcon({
  name,
  size = 24,
  className,
  filled = false,
  animated = false,
  withName = false,
  iconStyle,
}: {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  animated?: boolean;
  withName?: boolean;
  iconStyle?: CSSProperties;
}) {
  const extra: Record<string, string> = {};
  if (filled) extra.filled = "";
  if (animated) extra.animated = "";
  if (withName) extra.name = name;
  return (
    <gf-icon
      role="presentation"
      aria-hidden="true"
      className={className}
      {...extra}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      <mat-icon
        role="img"
        fontset="google-symbols-subset"
        className="mat-icon notranslate icon google-symbols-subset mat-icon-no-color"
        aria-hidden="true"
        data-mat-icon-type="font"
        data-mat-icon-namespace="google-symbols-subset"
        style={{
          fontSize: `${size}px`,
          width: `${size}px`,
          height: `${size}px`,
          ...iconStyle,
        }}
      >
        {name}
      </mat-icon>
    </gf-icon>
  );
}

// Trailing spans every Material button carries.
export function ButtonSpans() {
  return (
    <>
      <span className="mat-focus-indicator"></span>
      <span className="mat-mdc-button-touch-target"></span>
    </>
  );
}

export function IconButtonRipple() {
  return (
    <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span>
  );
}

export function ButtonRipple() {
  return (
    <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
  );
}

// Close an overlay on Escape or on pointer-down outside the given elements.
export function useDismiss(
  open: boolean,
  close: () => void,
  refs: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      close();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onPointer, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onPointer, true);
    };
  }, [open, close, refs]);
}

// Fixed-position coordinates for an overlay anchored under an element.
export function useAnchorRect(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
) {
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  useEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const update = () => {
      const box = anchorRef.current?.getBoundingClientRect();
      if (box) {
        setRect({ top: box.bottom, left: box.left, width: box.width });
      }
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef]);
  return rect;
}

const chevronDown = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 -960 960 960"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z"></path>
  </svg>
);

export const selectArrow = (
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

export function FormFieldSubscript() {
  return (
    <div
      aria-atomic="true"
      aria-live="polite"
      className="mat-mdc-form-field-subscript-wrapper mat-mdc-form-field-bottom-align"
    >
      <div className="mat-mdc-form-field-hint-wrapper">
        <div className="mat-mdc-form-field-hint-spacer"></div>
      </div>
    </div>
  );
}

export function LineRipple() {
  return (
    <div
      {...attrs("matformfieldlineripple")}
      className="mdc-line-ripple mdc-line-ripple--deactivating"
    ></div>
  );
}

// Collapsible drawer section, mirroring mat-expansion-panel.
export function ExpansionPanel({
  title,
  icon,
  iconFontFamily,
  iconName,
  panelClassName = "",
  defaultExpanded = true,
  children,
}: {
  title: string;
  icon: string;
  iconFontFamily?: string;
  iconName?: boolean;
  panelClassName?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const headerId = `mat-expansion-panel-header-${id}`;
  const contentId = `cdk-accordion-child-${id}`;
  const toggle = () => setExpanded((value) => !value);
  return (
    <mat-accordion displaymode="flat" className="mat-accordion">
      <mat-expansion-panel
        className={`mat-expansion-panel gmat-elevation-z0 left-drawer__expansion-panel${panelClassName}${
          expanded ? " mat-expanded" : ""
        } mat-expansion-panel-animations-enabled`}
      >
        <mat-expansion-panel-header
          role="button"
          className={`mat-expansion-panel-header mat-focus-indicator${
            expanded ? " mat-expanded" : ""
          } mat-expansion-toggle-indicator-after`}
          id={headerId}
          tabIndex={0}
          aria-controls={contentId}
          aria-expanded={expanded}
          aria-disabled="false"
          onClick={toggle}
          onKeyDown={(event: ReactKeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
          }}
        >
          <span className="mat-content">
            <mat-panel-title className="mat-expansion-panel-header-title gf-label-large">
              <GfIcon
                name={icon}
                className="title-icon"
                withName={iconName}
                iconStyle={
                  iconFontFamily ? { fontFamily: iconFontFamily } : undefined
                }
              />
              {title}
            </mat-panel-title>
          </span>
          <span className="mat-expansion-indicator">{chevronDown}</span>
        </mat-expansion-panel-header>
        <div className="mat-expansion-panel-content-wrapper">
          <div
            role="region"
            className="mat-expansion-panel-content"
            id={contentId}
            aria-labelledby={headerId}
          >
            <div className="mat-expansion-panel-body">{children}</div>
          </div>
        </div>
      </mat-expansion-panel>
    </mat-accordion>
  );
}

// Material select (trigger + fixed-position listbox panel) shared by the
// header sort control and the drawer font-size control.
export function MatSelect({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  display,
  triggerVariant = "min-line",
  panelWidth,
  panelClassName = "gmat-mdc-select",
  selectId,
}: {
  label?: string;
  ariaLabel: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  display?: string;
  triggerVariant?: "min-line" | "trigger";
  panelWidth?: number;
  panelClassName?: string;
  selectId: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selectRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const close = useCallback(() => setOpen(false), []);
  const rect = useAnchorRect(open, selectRef as RefObject<HTMLElement>);
  useDismiss(open, close, [selectRef, panelRef]);

  const openPanel = () => {
    setActiveIndex(Math.max(0, options.indexOf(value)));
    setOpen(true);
  };

  const pick = (option: string) => {
    onChange(option);
    setOpen(false);
    selectRef.current?.focus();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        openPanel();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(options[activeIndex]);
    } else if (event.key === "Tab") {
      close();
    }
  };

  const labelId = `${selectId}-label`;
  const panelId = `${selectId}-panel`;
  const valueText =
    triggerVariant === "trigger" ? (
      <mat-select-trigger className="gf-label-large">
        {display ?? value}
      </mat-select-trigger>
    ) : (
      <span className="mat-mdc-select-min-line">{display ?? value}</span>
    );

  return (
    <mat-form-field
      className={`mat-mdc-form-field gmat-mdc-form-field mat-mdc-form-field-type-mat-select mat-form-field-appearance-fill mat-primary mat-form-field-animations-enabled${
        open ? " mat-focused" : ""
      }`}
    >
      <div
        className={`mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--filled${
          label ? "" : " mdc-text-field--no-label"
        }${open ? " mdc-text-field--focused" : ""}`}
      >
        <div className="mat-mdc-form-field-focus-overlay"></div>
        <div className="mat-mdc-form-field-flex">
          <div className="mat-mdc-form-field-infix">
            {label ? (
              <label
                {...attrs("matformfieldfloatinglabel")}
                className="mdc-floating-label mat-mdc-floating-label mdc-floating-label--float-above"
                id={labelId}
              >
                <mat-label className="gf-label-large">{label}</mat-label>
              </label>
            ) : null}
            <mat-select
              ref={selectRef}
              role="combobox"
              aria-haspopup="listbox"
              className={`mat-mdc-select gmat-mdc-select options__wrapper${
                open ? " mat-select-open" : ""
              }`}
              id={selectId}
              tabIndex={0}
              aria-expanded={open}
              aria-label={ariaLabel}
              aria-required="false"
              aria-disabled="false"
              aria-invalid="false"
              {...(open ? { "aria-controls": panelId } : {})}
              onKeyDown={onKeyDown}
            >
              <div
                cdk-overlay-origin=""
                className="mat-mdc-select-trigger"
                onClick={() => (open ? close() : openPanel())}
              >
                <div className="mat-mdc-select-value" id={`${selectId}-value`}>
                  <span className="mat-mdc-select-value-text">{valueText}</span>
                </div>
                {selectArrow}
              </div>
              {open && rect ? (
                <OverlayPortal>
                  <div
                    className="cdk-overlay-backdrop cdk-overlay-transparent-backdrop cdk-overlay-backdrop-showing"
                    style={{ position: "fixed", inset: 0, zIndex: 10000 }}
                    onClick={close}
                  ></div>
                  <div
                    className="cdk-overlay-popover cdk-overlay-connected-position-bounding-box"
                    dir="ltr"
                    style={{
                      position: "fixed",
                      top: rect.top,
                      left: rect.left,
                      zIndex: 10001,
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                    }}
                  >
                    <div
                      className={`cdk-overlay-pane ${panelClassName}`}
                      style={{
                        width: panelWidth ?? Math.max(rect.width, 112),
                        position: "static",
                      }}
                    >
                      <div
                        ref={panelRef as RefObject<HTMLDivElement>}
                        role="listbox"
                        tabIndex={-1}
                        className="mat-mdc-select-panel mdc-menu-surface mdc-menu-surface--open mat-select-panel-animations-enabled mat-primary"
                        id={panelId}
                        aria-multiselectable="false"
                        aria-label={ariaLabel}
                      >
                        {options.map((option, index) => {
                          const selected = option === value;
                          const active = index === activeIndex;
                          return (
                            <mat-option
                              key={option}
                              role="option"
                              className={`mat-mdc-option mdc-list-item gf-body-large${
                                selected ? " mdc-list-item--selected" : ""
                              }${active ? " mat-mdc-option-active" : ""}`}
                              id={`${selectId}-option-${index}`}
                              aria-selected={selected}
                              aria-disabled="false"
                              onClick={() => pick(option)}
                              onMouseEnter={() => setActiveIndex(index)}
                            >
                              <span className="mdc-list-item__primary-text">
                                <span>{option}</span>
                              </span>
                              {selected ? (
                                <mat-pseudo-checkbox
                                  state="checked"
                                  aria-hidden="true"
                                  appearance="minimal"
                                  className="mat-pseudo-checkbox mat-mdc-option-pseudo-checkbox mat-pseudo-checkbox-checked mat-pseudo-checkbox-minimal"
                                ></mat-pseudo-checkbox>
                              ) : null}
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
            </mat-select>
          </div>
        </div>
        <LineRipple />
      </div>
      <FormFieldSubscript />
    </mat-form-field>
  );
}
