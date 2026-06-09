import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  FilterChips,
  GfSelect,
  KnowledgeSection,
  MatCheckbox,
  MatIconButton,
  MatSlider,
  OutlineSelect,
  SlideToggle,
  SpecimenHeader,
  familyStack,
  familyTagChips,
  sampleTextsFor,
  useDocumentTitle,
} from "../components/specimen/common";
import {
  choosingTypeCards,
  choosingTypeDescription,
  choosingTypeHref,
} from "../components/specimen/knowledge-data";
import { LicenseTab } from "../components/specimen/LicenseTab";
import { useAppState } from "../lib/app-state";
import {
  familyScript,
  familyStyleRows,
  loadFamilyDetail,
  specimenHeroTextFor,
  stylesSampleTextFor,
  weightNames,
  type FamilyDetailMetadata,
  type FamilyMetadata,
  type StyleRow,
} from "../lib/metadata";
import { ensureFullFamily } from "../lib/preview-fonts";
import { navigate, type SpecimenTab } from "../lib/router";

export function SpecimenPage({
  family,
  tab,
}: {
  family: string;
  tab: SpecimenTab;
}) {
  const { familyByName, loading } = useAppState();
  const font = familyByName.get(family) ?? null;
  useDocumentTitle(font ? `${font.family} - Fonts` : null);

  useEffect(() => {
    if (font) ensureFullFamily(font);
  }, [font]);

  if (!font) {
    return loading ? (
      <gf-better-specimen>
        <div className="better-specimen__content better-specimen__content--dense" />
      </gf-better-specimen>
    ) : (
      <NotFound family={family} />
    );
  }

  return (
    <gf-better-specimen>
      <div className="better-specimen__content better-specimen__content--dense">
        {tab === "about" ? <AboutTab font={font} /> : null}
        {tab === "license" ? <LicenseTab font={font} /> : null}
        {tab === "glyphs" ? <GlyphsTab font={font} /> : null}
        {tab === "specimen" || tab === "tester" ? (
          <SpecimenMain font={font} />
        ) : null}
      </div>
    </gf-better-specimen>
  );
}

function NotFound({ family }: { family: string }) {
  return (
    <gf-checkout-overview>
      <gf-error>
        <div role="img" aria-hidden="true" className="error-kaomoji">
          {" "}
          (˚Δ˚)b{" "}
        </div>
        <div className="error-text gf-title-medium">
          <div>The font family “{family}” is not available.</div>
        </div>
        <button
          mat-stroked-button=""
          color="primary"
          className="mdc-button mat-mdc-button-base gmat-mdc-button rounded mdc-button--outlined mat-mdc-outlined-button mat-primary"
          type="button"
          onClick={() => navigate({ page: "browse" })}
        >
          <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
          <span className="mdc-button__label"> Browse fonts </span>
          <span className="mat-focus-indicator"></span>
          <span className="mat-mdc-button-touch-target"></span>
        </button>
      </gf-error>
    </gf-checkout-overview>
  );
}

// ---------------------------------------------------------------------------
// Main specimen tab

function SpecimenMain({ font }: { font: FamilyMetadata }) {
  const { tags } = useAppState();
  const chips = useMemo(() => familyTagChips(font, tags?.tags), [font, tags]);
  const script = familyScript(font);
  const heroText = specimenHeroTextFor(font);

  return (
    <gf-specimen>
      <SpecimenHeader font={font} className="header--tags" />
      {chips.length ? (
        <gf-feathering className="ltr">
          <div className="feathering__scroller">
            <FilterChips
              ariaLabel="Filter content by tags"
              nowrap
              chips={chips.map((label) => ({ label }))}
              onToggle={(label) => {
                const query = label.split(" — ").pop() ?? label;
                navigate(
                  { page: "browse" },
                  { query: `?query=${encodeURIComponent(query)}` },
                );
              }}
            />
          </div>
        </gf-feathering>
      ) : null}
      <SpecimenHero font={font} text={heroText} />
      <MiniPlayground font={font} script={script} />
      <StylesSection font={font} />
      <TextPreviewSection font={font} script={script} />
      <ChoosingType />
    </gf-specimen>
  );
}

function ChoosingType() {
  return (
    <gf-knowledge-choosing-type>
      <gf-knowledge-module-section className="choosing-type__module-section gf-rc1 with-gradient--cyan with-mobile-one-column">
        <KnowledgeSection
          title="Choosing type"
          viewAllHref={choosingTypeHref}
          viewAllLabel="View all articles in Choosing type"
          description={choosingTypeDescription}
          cards={choosingTypeCards}
        />
      </gf-knowledge-module-section>
    </gf-knowledge-choosing-type>
  );
}

function SpecimenHero({ font, text }: { font: FamilyMetadata; text: string }) {
  return (
    <gf-specimen-hero className="hero">
      <div className="container">
        <div className="hero">
          <div
            translate="no"
            className="hero__text-sample"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            style={{
              ...familyStack(font),
              fontWeight: 400,
              fontStyle: "normal",
              opacity: 1,
              lineHeight: "initial",
            }}
          >
            {` ${text} `}
          </div>
        </div>
      </div>
    </gf-specimen-hero>
  );
}

// ---------------------------------------------------------------------------
// Mini playground (type tester)

type TesterBlock = {
  label: string;
  size: number;
  align: CSSProperties["textAlign"];
  color: boolean;
  highlight: boolean;
  text: string;
};

const TYPE_STYLES: Array<{ label: string; size: number }> = [
  { label: "Heading 1", size: 28 },
  { label: "Heading 2", size: 22 },
  { label: "Heading 3", size: 18 },
  { label: "Body", size: 16 },
];

function testerBlocksFor(texts: string[]): TesterBlock[] {
  return texts.map((text, index) => ({
    label: TYPE_STYLES[Math.min(index, TYPE_STYLES.length - 1)].label,
    size: TYPE_STYLES[Math.min(index, TYPE_STYLES.length - 1)].size,
    align: "start",
    color: false,
    highlight: false,
    text,
  }));
}

function MiniPlayground({
  font,
  script,
}: {
  font: FamilyMetadata;
  script: "latin" | "sc" | "tc" | "jp" | "kr";
}) {
  const samples = useMemo(
    () => sampleTextsFor(font, script, stylesSampleTextFor(font)),
    [font, script],
  );
  const styleRows = useMemo(() => familyStyleRows(font), [font]);
  const weights = useMemo(
    () => [...new Set(styleRows.map((row) => row.weight))],
    [styleRows],
  );
  const hasItalic = styleRows.some((row) => row.italic);
  const wghtAxis = font.axes.find((axis) => axis.tag === "wght");
  const otherAxes = font.axes.filter(
    (axis) => axis.tag !== "wght" && axis.tag !== "ital",
  );
  const defaultWeight = weights.includes(400) ? 400 : (weights[0] ?? 400);

  const [italic, setItalic] = useState(false);
  const [weight, setWeight] = useState(defaultWeight);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});
  const [blocks, setBlocks] = useState<TesterBlock[]>(() =>
    testerBlocksFor(samples.tester),
  );
  const [active, setActive] = useState(0);

  useEffect(() => {
    setBlocks(testerBlocksFor(samples.tester));
    setActive(0);
    setItalic(false);
    setWeight(defaultWeight);
    setAxisValues({});
  }, [samples, defaultWeight]);

  const activeBlock = blocks[active] ?? blocks[0];

  function patchActive(patch: Partial<TesterBlock>) {
    setBlocks((current) =>
      current.map((block, index) =>
        index === active ? { ...block, ...patch } : block,
      ),
    );
  }

  const axisAtDefault =
    weight === defaultWeight &&
    !italic &&
    otherAxes.every(
      (axis) =>
        (axisValues[axis.tag] ?? axis.defaultValue) === axis.defaultValue,
    );

  const sampleStyle: CSSProperties = {
    ...familyStack(font),
    fontWeight: weight,
    fontStyle: italic ? "italic" : "normal",
    fontVariationSettings: otherAxes.length
      ? otherAxes
          .map(
            (axis) =>
              `"${axis.tag}" ${axisValues[axis.tag] ?? axis.defaultValue}`,
          )
          .join(", ")
      : undefined,
  };

  const toolbarDivider = (
    <mat-divider
      className="mat-divider toolbar__divider mat-divider-vertical"
      aria-orientation="vertical"
      role="separator"
    />
  );

  return (
    <gf-mini-playground>
      <div className="filter-row">
        <span className="filter-row__label gm3-type-body">
          Select preview text:
        </span>
        <gf-specimen-lang-filters>
          <div className="filters-container">
            <OutlineSelect
              ariaLabel="Writing system"
              value="Writing system"
              options={["Writing system"]}
              onChange={() => {}}
            />
            <OutlineSelect
              ariaLabel="Language"
              value="Language"
              options={["Language"]}
              onChange={() => {}}
            />
          </div>
        </gf-specimen-lang-filters>
      </div>
      <div className="playground__container">
        <gf-design-space-explorer className="sliders-wrapper">
          <div className="axis__reset-wrapper">
            <div className="axis__reset-title">
              <div className="gf-title-medium">Variable Axes</div>
            </div>
            <MatIconButton
              label="Reset all axes values"
              icon="refresh"
              iconClassName="axis__reset-icon"
              disabled={axisAtDefault}
              onClick={() => {
                setItalic(false);
                setWeight(defaultWeight);
                setAxisValues({});
              }}
            />
          </div>
          <div className="axis-wrapper">
            {hasItalic ? (
              <div className="axis-container">
                <div className="gf-title-medium axis__header">
                  <span>Italic</span>
                  <SlideToggle
                    ariaLabel="Toggle italic"
                    checked={italic}
                    onChange={setItalic}
                  />
                </div>
              </div>
            ) : null}
            <div className="axis-container">
              <div className="gf-title-medium axis__header">
                <span>Weight</span>
                <output className="axis__value">{weight}</output>
              </div>
              <gf-axis-slider>
                {wghtAxis ? (
                  <MatSlider
                    ariaLabel="Change weight axis"
                    min={wghtAxis.min}
                    max={wghtAxis.max}
                    step={1}
                    value={weight}
                    onChange={setWeight}
                  />
                ) : (
                  <MatSlider
                    ariaLabel="Change weight axis"
                    min={0}
                    max={Math.max(0, weights.length - 1)}
                    step={1}
                    value={Math.max(0, weights.indexOf(weight))}
                    displayValue={String(weight)}
                    onChange={(index) =>
                      setWeight(weights[index] ?? defaultWeight)
                    }
                  />
                )}
              </gf-axis-slider>
            </div>
            {otherAxes.map((axis) => (
              <div className="axis-container" key={axis.tag}>
                <div className="gf-title-medium axis__header">
                  <span>{axis.tag}</span>
                  <output className="axis__value">
                    {axisValues[axis.tag] ?? axis.defaultValue}
                  </output>
                </div>
                <gf-axis-slider>
                  <MatSlider
                    ariaLabel={`Change ${axis.tag} axis`}
                    min={axis.min}
                    max={axis.max}
                    step={1}
                    value={axisValues[axis.tag] ?? axis.defaultValue}
                    onChange={(value) =>
                      setAxisValues((current) => ({
                        ...current,
                        [axis.tag]: value,
                      }))
                    }
                  />
                </gf-axis-slider>
              </div>
            ))}
          </div>
        </gf-design-space-explorer>
        <div className="preview-wrapper">
          <div className="toolbar">
            <gf-type-style-dropdown>
              <GfSelect
                ariaLabel="Select type style"
                className="transparent"
                value={activeBlock?.label ?? "Heading 1"}
                options={TYPE_STYLES.map((style) => style.label)}
                onChange={(label) => {
                  const style = TYPE_STYLES.find(
                    (item) => item.label === label,
                  );
                  if (style) {
                    patchActive({ label: style.label, size: style.size });
                  }
                }}
              />
            </gf-type-style-dropdown>
            {toolbarDivider}
            <gf-font-size-modifier className="font-size--button-enabled">
              <div className="font-size__wrapper">
                <MatIconButton
                  label="Decrease font size"
                  icon="remove"
                  onClick={() =>
                    patchActive({
                      size: Math.max(8, (activeBlock?.size ?? 16) - 1),
                    })
                  }
                />
                <GfSelect
                  ariaLabel="Font size"
                  value={`${activeBlock?.size ?? 16}px`}
                  options={[
                    "12px",
                    "16px",
                    "18px",
                    "22px",
                    "28px",
                    "36px",
                    "48px",
                    "64px",
                  ]}
                  onChange={(value) =>
                    patchActive({ size: Number.parseInt(value, 10) || 16 })
                  }
                />
                <MatIconButton
                  label="Increase font size"
                  icon="add"
                  onClick={() =>
                    patchActive({
                      size: Math.min(300, (activeBlock?.size ?? 16) + 1),
                    })
                  }
                />
              </div>
            </gf-font-size-modifier>
            {toolbarDivider}
            <gf-color-picker>
              <MatIconButton
                label="Change text color"
                icon="format_color_text"
                onClick={() => patchActive({ color: !activeBlock?.color })}
              />
            </gf-color-picker>
            {toolbarDivider}
            <gf-color-picker>
              <MatIconButton
                label="Change highlight color"
                icon="format_color_fill"
                onClick={() =>
                  patchActive({ highlight: !activeBlock?.highlight })
                }
              />
            </gf-color-picker>
            {toolbarDivider}
            <div className="toolbar__alignments-and-line-spacing">
              {(["left", "center", "right", "justify"] as const).map(
                (align) => (
                  <MatIconButton
                    key={align}
                    label={`Format align ${align}`}
                    icon={`format_align_${align}`}
                    onClick={() =>
                      patchActive({
                        align: align === "left" ? "start" : align,
                      })
                    }
                  />
                ),
              )}
              {toolbarDivider}
              <gf-line-height-modifier>
                <MatIconButton
                  label="Line spacing"
                  icon="format_line_spacing"
                  onClick={() => {}}
                />
              </gf-line-height-modifier>
            </div>
          </div>
          {blocks.map((block, index) => (
            <div className="preview__content" key={index}>
              <gf-content-editable
                className={index === active ? "focused" : "inactive"}
              >
                <div
                  className="hide-focus"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  style={{
                    ...sampleStyle,
                    fontSize: `${block.size}px`,
                    textAlign: block.align,
                    color: block.color ? "var(--sys-primary)" : undefined,
                    backgroundColor: block.highlight
                      ? "var(--sys-primary-container)"
                      : undefined,
                  }}
                  onFocus={() => setActive(index)}
                >
                  {block.text}
                </div>
              </gf-content-editable>
              {index === 0 ? (
                <MatIconButton
                  label="Add new text area"
                  icon="add_circle"
                  onClick={() =>
                    setBlocks((current) => [
                      ...current,
                      ...testerBlocksFor([samples.tester[0]]).map((item) => ({
                        ...item,
                        label: "Body",
                        size: 16,
                      })),
                    ])
                  }
                />
              ) : null}
            </div>
          ))}
          <gf-select-expansion>
            <mat-accordion className="mat-accordion">
              <mat-expansion-panel className="mat-expansion-panel select-expansion__panel gmat-elevation-z0 mat-expanded mat-expansion-panel-spacing">
                <div className="select-expansion__header gm3-type-body">
                  Styles used above
                </div>
                <div className="select-expansion__content">
                  {blocks.map((block, index) => (
                    <code
                      key={index}
                      className={`select-expansion__row${
                        index === active ? " select-expansion__row--active" : ""
                      }`}
                    >
                      {`Size: ${block.size}  Italic: ${italic ? 1 : 0}  Width: 100  Weight: ${weight}  ${block.label}`}
                    </code>
                  ))}
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </gf-select-expansion>
        </div>
      </div>
    </gf-mini-playground>
  );
}

// ---------------------------------------------------------------------------
// Styles section

function StylesSection({ font }: { font: FamilyMetadata }) {
  const styleRows = useMemo(() => familyStyleRows(font), [font]);
  const [text, setText] = useState("");
  const [size, setSize] = useState(48);
  const placeholder = stylesSampleTextFor(font);

  useEffect(() => {
    setText("");
    setSize(48);
  }, [font]);

  return (
    <section className="specimen-section styles">
      <div className="responsive-headings">
        <h2 className="gm3-type-lg">Styles</h2>
      </div>
      <div className="styles__controls">
        <mat-form-field className="mat-mdc-form-field gmat-mdc-form-field styles__preview-input mat-mdc-form-field-type-mat-input mat-form-field-appearance-outline mat-primary">
          <div className="mat-mdc-text-field-wrapper mdc-text-field mdc-text-field--outlined mdc-text-field--no-label">
            <div className="mat-mdc-form-field-flex">
              <div className="mdc-notched-outline mdc-notched-outline--no-label">
                <div className="mat-mdc-notch-piece mdc-notched-outline__leading"></div>
                <div className="mat-mdc-notch-piece mdc-notched-outline__notch"></div>
                <div className="mat-mdc-notch-piece mdc-notched-outline__trailing"></div>
              </div>
              <div className="mat-mdc-form-field-infix">
                <input
                  className="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input"
                  aria-label="Type here to preview text"
                  placeholder="Type here to preview text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                />
              </div>
            </div>
          </div>
        </mat-form-field>
        <gf-font-size-modifier>
          <div className="font-size__wrapper has-slider">
            <GfSelect
              ariaLabel="Font size"
              value={`${size}px`}
              options={[
                "12px",
                "16px",
                "20px",
                "24px",
                "32px",
                "40px",
                "48px",
                "64px",
                "96px",
              ]}
              onChange={(value) => setSize(Number.parseInt(value, 10) || 48)}
            />
          </div>
          <MatSlider
            ariaLabel="Font size"
            className="font-size__slider"
            min={8}
            max={300}
            step={1}
            value={size}
            onChange={setSize}
          />
        </gf-font-size-modifier>
      </div>
      <div className="styles__list">
        {styleRows.map((row) => (
          <StyleRowItem
            key={row.key}
            font={font}
            row={row}
            text={text || placeholder}
            size={size}
          />
        ))}
      </div>
    </section>
  );
}

function StyleRowItem({
  font,
  row,
  text,
  size,
}: {
  font: FamilyMetadata;
  row: StyleRow;
  text: string;
  size: number;
}) {
  return (
    <gf-style-row className="style-row">
      <div className="style-row__header">
        <span className="style-row__label gf-label-large mat-text--secondary">
          {row.label}
        </span>
      </div>
      <div
        translate="no"
        className="style-row__sample"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        style={{
          ...familyStack(font),
          fontWeight: row.weight,
          fontStyle: row.italic ? "italic" : "normal",
          fontSize: `${size}px`,
          lineHeight: "normal",
        }}
      >
        {text}
      </div>
    </gf-style-row>
  );
}

// ---------------------------------------------------------------------------
// Type-scale preview section

function TextPreviewSection({
  font,
  script,
}: {
  font: FamilyMetadata;
  script: "latin" | "sc" | "tc" | "jp" | "kr";
}) {
  const styleRows = useMemo(() => familyStyleRows(font), [font]);
  const weights = useMemo(
    () => [...new Set(styleRows.map((row) => row.weight))],
    [styleRows],
  );
  const hasItalic = styleRows.some((row) => row.italic);
  const defaultWeight = weights.includes(400) ? 400 : (weights[0] ?? 400);
  const [weight, setWeight] = useState(defaultWeight);
  const [italic, setItalic] = useState(false);
  const samples = useMemo(
    () => sampleTextsFor(font, script, stylesSampleTextFor(font)),
    [font, script],
  );

  useEffect(() => {
    setWeight(defaultWeight);
    setItalic(false);
  }, [defaultWeight]);

  const weightLabel = (value: number) =>
    `${weightNames[String(value)] ?? value} ${value}`;
  const sampleStyle = (px: number): CSSProperties => ({
    ...familyStack(font),
    fontWeight: weight,
    fontStyle: italic ? "italic" : "normal",
    fontSize: `${px}px`,
  });

  return (
    <gf-specimen-text-preview>
      <section className="specimen-section text-preview">
        <div className="text-preview__controls">
          <GfSelect
            ariaLabel="Select weight"
            value={weightLabel(weight)}
            options={weights.map(weightLabel)}
            onChange={(label) => {
              const match = weights.find(
                (value) => weightLabel(value) === label,
              );
              if (match !== undefined) setWeight(match);
            }}
          />
          <MatCheckbox
            ariaLabel="Italic"
            label="Italic"
            checked={italic}
            disabled={!hasItalic}
            onChange={setItalic}
          />
        </div>
        <div className="text-preview__columns">
          <div className="text-preview__column text-preview__column--left">
            {([48, 36, 32] as const).map((px) => (
              <div className="text-preview__block" key={px}>
                <span className="text-preview__caption gf-label-medium mat-text--secondary">
                  {weightLabel(weight)} at {px}px
                </span>
                <div className="text-preview__sample" style={sampleStyle(px)}>
                  {samples.grid[px]}
                </div>
              </div>
            ))}
          </div>
          <div className="text-preview__column text-preview__column--right">
            {([21, 16] as const).map((px) => (
              <div className="text-preview__block" key={px}>
                <span className="text-preview__caption gf-label-medium mat-text--secondary">
                  {weightLabel(weight)} at {px}px
                </span>
                <div className="text-preview__sample" style={sampleStyle(px)}>
                  {samples.grid[px]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </gf-specimen-text-preview>
  );
}

// ---------------------------------------------------------------------------
// About tab

function AboutTab({ font }: { font: FamilyMetadata }) {
  const [detail, setDetail] = useState<FamilyDetailMetadata | null>(null);
  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    loadFamilyDetail(font.family)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [font.family]);

  const styleCount = Object.keys(font.fonts).length;

  return (
    <gf-about>
      <SpecimenHeader font={font} className="about__header" />
      <div className="about__columns two-cols">
        <div className="about__column--left">
          <article
            className="specimen-section"
            style={{ ["--autonym-family" as string]: font.family }}
          >
            <h2 className="gm3-type-lg" aria-label={`About ${font.family}`}>
              About
            </h2>
            <gf-html-view itemProp="description" className="font-article">
              {detail?.description ? (
                <div dangerouslySetInnerHTML={{ __html: detail.description }} />
              ) : (
                <div>
                  <p>
                    {font.displayName
                      ? `${font.displayName} (${font.family})`
                      : font.family}{" "}
                    is served through this font delivery service with
                    family metadata, the CSS API, and unicode-range sliced WOFF2
                    delivery.
                  </p>
                  {detail?.minisiteUrl ? (
                    <p>
                      To report issues or contribute, see{" "}
                      <a
                        href={detail.minisiteUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {detail.minisiteUrl.replace(/^https?:\/\//, "")}
                      </a>
                      .
                    </p>
                  ) : null}
                </div>
              )}
            </gf-html-view>
          </article>
          {detail?.designers.length ? (
            <section className="specimen-section">
              <h2 className="gm3-type-lg">Designers</h2>
              <gf-designers className="specimen__designers">
                {detail.designers.map((designer) => (
                  <gf-designer
                    key={designer.name}
                    className={designer.bio ? "designer-has-bio" : undefined}
                  >
                    <div
                      itemScope
                      itemProp="creator"
                      itemType="http://www.schema.org/Person"
                    >
                      <div className="designer-header">
                        {designer.imageUrl ? (
                          <img
                            alt="Avatar of the designer"
                            itemProp="image"
                            className="designer-header__avatar"
                            src={`${designer.imageUrl}=w80-h80`}
                          />
                        ) : null}
                        <div>
                          <p className="gm3-type-h4">
                            <a
                              href={`/?query=${encodeURIComponent(designer.name)}`}
                              onClick={(event) => {
                                event.preventDefault();
                                navigate(
                                  { page: "browse" },
                                  {
                                    query: `?query=${encodeURIComponent(designer.name)}`,
                                  },
                                );
                              }}
                            >
                              <span itemProp="name">{designer.name}</span>
                            </a>
                          </p>
                        </div>
                      </div>
                      {designer.bio ? (
                        <gf-html-view className="designer-bio">
                          <div
                            dangerouslySetInnerHTML={{ __html: designer.bio }}
                          />
                        </gf-html-view>
                      ) : null}
                    </div>
                  </gf-designer>
                ))}
              </gf-designers>
            </section>
          ) : null}
        </div>
        <aside className="about__column--right">
          <section className="specimen-section">
            <div className="about__views">
              <span className="gf-display-large">
                <span className="views__number">{styleCount}</span>
              </span>
              <span className="gm3-type-body">
                {styleCount === 1 ? "style" : "styles"}
              </span>
              <p className="views__description">
                {font.family} ships {styleCount}{" "}
                {styleCount === 1 ? "style" : "styles"}
                {font.axes.length
                  ? ` across ${font.axes.length} variable ${
                      font.axes.length === 1 ? "axis" : "axes"
                    }`
                  : ""}{" "}
                and is delivered with unicode-range sliced web font assets.
              </p>
            </div>
          </section>
        </aside>
      </div>
      <ChoosingType />
    </gf-about>
  );
}

// ---------------------------------------------------------------------------
// Glyphs tab

function GlyphsTab({ font }: { font: FamilyMetadata }) {
  const [detail, setDetail] = useState<FamilyDetailMetadata | null>(null);
  const [subset, setSubset] = useState<string | null>(null);
  const [limit, setLimit] = useState(289);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setSubset(null);
    setLimit(289);
    loadFamilyDetail(font.family)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [font.family]);

  const subsets = detail ? Object.keys(detail.coverage) : [];
  const activeSubset = subset ?? subsets[0] ?? null;
  const codepoints = useMemo(() => {
    if (!detail || !activeSubset) return [];
    return parseCoverage(detail.coverage[activeSubset] ?? "");
  }, [detail, activeSubset]);

  return (
    <gf-glyphs-page>
      <SpecimenHeader font={font} className="glyphs__header" />
      <section className="specimen-section glyphs">
        <div className="responsive-headings glyphs__heading">
          <h2 className="gm3-type-lg">Glyphs</h2>
        </div>
        <div className="glyphs__controls">
          {subsets.length > 1 ? (
            <OutlineSelect
              ariaLabel="Select subset"
              value={activeSubset ?? ""}
              options={subsets}
              onChange={(value) => {
                setSubset(value);
                setLimit(289);
              }}
            />
          ) : null}
          <span className="gm3-type-body mat-text--secondary glyphs__count">
            {codepoints.length.toLocaleString("en-US")} glyphs
          </span>
        </div>
        <div className="glyphs__grid">
          {codepoints.slice(0, limit).map((codepoint) => (
            <span
              key={codepoint}
              className="glyphs__cell"
              title={`U+${codepoint
                .toString(16)
                .toUpperCase()
                .padStart(4, "0")}`}
              style={familyStack(font)}
            >
              {String.fromCodePoint(codepoint)}
            </span>
          ))}
        </div>
        {codepoints.length > limit ? (
          <button
            mat-stroked-button=""
            className="mdc-button mat-mdc-button-base gmat-mdc-button rounded mdc-button--outlined mat-mdc-outlined-button mat-primary glyphs__more"
            type="button"
            onClick={() => setLimit((value) => value + 578)}
          >
            <span className="mdc-button__label">Show more glyphs</span>
          </button>
        ) : null}
      </section>
    </gf-glyphs-page>
  );
}

function parseCoverage(value: string): number[] {
  const out = new Set<number>();
  for (const part of value.split(",")) {
    const [startRaw, endRaw] = part.trim().split("-");
    const start = Number.parseInt(startRaw, 10);
    if (!Number.isFinite(start)) continue;
    const end = endRaw ? Number.parseInt(endRaw, 10) : start;
    for (
      let codepoint = start;
      codepoint <= Math.min(end, start + 4000) && out.size < 20000;
      codepoint += 1
    ) {
      if (codepoint >= 33 && codepoint !== 127) out.add(codepoint);
    }
  }
  return [...out];
}

export default SpecimenPage;
