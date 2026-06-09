import { useMemo, useState } from "react";
import {
  KnowledgeSection,
  MatIconButton,
  TileVariantLabel,
  familyStack,
  useDocumentTitle,
} from "../components/specimen/common";
import {
  developInWebCards,
  developInWebDescription,
  developInWebHref,
  webPerformanceCards,
  webPerformanceDescription,
} from "../components/specimen/knowledge-data";
import { useAppState } from "../lib/app-state";
import { Icon } from "../lib/icons";
import { stylesSampleTextFor, type FamilyMetadata } from "../lib/metadata";
import { ensureFullFamily, familyAxisSpec } from "../lib/preview-fonts";
import { navigate } from "../lib/router";
import { removeFamily, useSelectedFamilies } from "../lib/selection";

const TABS = ["Web", "Android", "iOS", "Flutter"] as const;
type Tab = (typeof TABS)[number];

export function EmbedPage() {
  const { familyByName, loading } = useAppState();
  const selected = useSelectedFamilies();
  const fonts = useMemo(
    () =>
      selected
        .map((family) => familyByName.get(family))
        .filter((font): font is FamilyMetadata => Boolean(font)),
    [selected, familyByName],
  );
  const [tab, setTab] = useState<Tab>("Web");
  const [mode, setMode] = useState<"link" | "import">("link");
  useDocumentTitle("Embed code - Fonts");

  if (!loading && fonts.length === 0) {
    navigate({ page: "selection" });
    return null;
  }

  const cssUrl = `${originBase()}/css2?${fonts
    .map(
      // Google leaves :,;@.. literal in the query string; only spaces become +.
      (font) => `family=${familyAxisSpec(font).replaceAll(" ", "+")}`,
    )
    .join("&")}&display=swap`;

  return (
    <gf-checkout-embed>
      <div className="fonts-page--checkout-embed">
        <div className="header">
          <MatIconButton
            label="Back to selection"
            icon="arrow_back"
            onClick={() => navigate({ page: "selection" })}
          />
          <h1 className="gm3-type-lg">Embed code</h1>
        </div>
        <div className="checkout-embed__content">
          <gf-checkout-tiles>
            {fonts.map((font) => (
              <EmbedTile key={font.family} font={font} />
            ))}
          </gf-checkout-tiles>
          <gf-checkout-tabs>
            <div className="tabs">
              <mat-tab-group
                gmat-tabs=""
                appearance="secondary"
                className="mat-mdc-tab-group tabs__group mat-primary mat-mdc-tab-group-stretch-tabs gmat-mdc-tabs-secondary"
              >
                <mat-tab-header className="mat-mdc-tab-header">
                  <div className="mat-mdc-tab-label-container">
                    <div
                      role="tablist"
                      className="mat-mdc-tab-list"
                      aria-label="Get embed code"
                    >
                      <div className="mat-mdc-tab-labels">
                        {TABS.map((label, index) => (
                          <div
                            key={label}
                            role="tab"
                            className={`mdc-tab mat-mdc-tab mat-focus-indicator${
                              tab === label
                                ? " mdc-tab--active mdc-tab-indicator--active"
                                : ""
                            }`}
                            tabIndex={tab === label ? 0 : -1}
                            aria-posinset={String(index + 1)}
                            aria-setsize={String(TABS.length)}
                            aria-selected={tab === label ? "true" : "false"}
                            onClick={() => setTab(label)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setTab(label);
                              }
                            }}
                          >
                            <span className="mdc-tab__ripple"></span>
                            <span className="mdc-tab__content">
                              <span className="mdc-tab__text-label">
                                <span className="tab__label gf-title-medium">
                                  {label}
                                </span>
                              </span>
                            </span>
                            <span className="mdc-tab-indicator">
                              <span className="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </mat-tab-header>
                <div className="mat-mdc-tab-body-wrapper">
                  <mat-tab-body
                    role="tabpanel"
                    className="mat-mdc-tab-body mat-mdc-tab-body-active"
                  >
                    <div className="mat-mdc-tab-body-content">
                      <div className="tab__wrapper">
                        {tab === "Web" ? (
                          <WebPanel
                            fonts={fonts}
                            cssUrl={cssUrl}
                            mode={mode}
                            onMode={setMode}
                          />
                        ) : (
                          <OtherPlatformPanel tab={tab} fonts={fonts} />
                        )}
                      </div>
                    </div>
                  </mat-tab-body>
                </div>
              </mat-tab-group>
            </div>
          </gf-checkout-tabs>
        </div>
        <div className="checkout-embed__module">
          <gf-resource-module className="with-gradient--cyan">
            <KnowledgeSection
              title="Develop in web"
              viewAllHref={developInWebHref}
              viewAllLabel="View all articles"
              description={developInWebDescription}
              cards={developInWebCards}
            />
          </gf-resource-module>
          <gf-resource-module className="with-gradient--green">
            <KnowledgeSection
              title="Web performance"
              description={webPerformanceDescription}
              cards={webPerformanceCards}
            />
          </gf-resource-module>
        </div>
      </div>
    </gf-checkout-embed>
  );
}

function originBase() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

function EmbedTile({ font }: { font: FamilyMetadata }) {
  ensureFullFamily(font);
  return (
    <gf-checkout-tile className="tile">
      <div className="tile">
        <div className="tile__top">
          <div className="top__header">
            <div className="header__title mat-text--title gf-title-medium">
              {font.family}
            </div>
            <div className="header__subheader">
              <TileVariantLabel font={font} />
            </div>
            <div className="header__actions">
              <MatIconButton
                label={`Remove font ${font.family} from collection`}
                icon="delete"
                size={20}
                className="actions__delete-button"
                onClick={() => removeFamily(font.family)}
              />
            </div>
          </div>
          <gf-feathering
            dir="auto"
            translate="no"
            className="header__preview ltr"
            style={{
              fontSize: 40,
              textAlign: "start",
              ...familyStack(font),
              fontWeight: 400,
              fontStyle: "normal",
              opacity: 1,
              lineHeight: "initial",
            }}
          >
            {" "}
            {stylesSampleTextFor(font)}{" "}
          </gf-feathering>
        </div>
        <div className="tile__content">
          <gf-style-selector>
            <div className="selector__top">
              <span className="gf-label-large mat-text--secondary">
                {Object.keys(font.fonts).length}{" "}
                {Object.keys(font.fonts).length === 1 ? "style" : "styles"}
                {font.axes.length
                  ? `: ${font.axes
                      .map(
                        (axis) =>
                          `${axis.tag === "wght" ? "Weight" : axis.tag} ${axis.min}-${axis.max}`,
                      )
                      .join("  ")}`
                  : ""}
              </span>
            </div>
          </gf-style-selector>
        </div>
      </div>
    </gf-checkout-tile>
  );
}

function WebPanel({
  fonts,
  cssUrl,
  mode,
  onMode,
}: {
  fonts: FamilyMetadata[];
  cssUrl: string;
  mode: "link" | "import";
  onMode: (mode: "link" | "import") => void;
}) {
  const linkCode = [
    `<link rel="preconnect" href="${originBase()}">`,
    `<link rel="preconnect" href="${originBase()}" crossorigin>`,
    `<link href="${cssUrl}" rel="stylesheet">`,
  ].join("\n");
  const importCode = ["<style>", `@import url('${cssUrl}');`, "</style>"].join(
    "\n",
  );
  const first = fonts[0];
  const className = first
    ? first.family.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")
    : "font";
  const sampleCss = first
    ? [
        `.${className}-<uniquifier> {`,
        `  font-family: "${first.family}", ${
          first.category === "Serif"
            ? "serif"
            : first.category === "Monospace"
              ? "monospace"
              : "sans-serif"
        };`,
        ...(first.axes.length ? ["  font-optical-sizing: auto;"] : []),
        "  font-weight: <weight>;",
        "  font-style: normal;",
        "}",
      ].join("\n")
    : "";

  return (
    <div className="tab__content tab__content--web">
      <gf-checkout-panel>
        <div className="panel-section__radio-buttons">
          <mat-radio-group
            role="radiogroup"
            color="primary"
            aria-label="Select a platform mode"
            className="mat-mdc-radio-group gf-label-large"
          >
            <RadioButton
              label="<link>"
              checked={mode === "link"}
              onSelect={() => onMode("link")}
            />
            <RadioButton
              label="@import"
              checked={mode === "import"}
              onSelect={() => onMode("import")}
            />
          </mat-radio-group>
        </div>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <p className="gf-body-large info-text">
              Embed code in the &lt;head&gt; of your html
            </p>
          </gf-checkout-panel-section>
        </div>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <CodeSnippet
              code={mode === "link" ? linkCode : importCode}
              copyLabel="Copy embed code to clipboard"
            />
          </gf-checkout-panel-section>
        </div>
        {first ? (
          <div className="panel-section__wrapper">
            <gf-checkout-panel-section>
              <p className="gf-body-large info-text">
                {first.family}: CSS{" "}
                {first.axes.length ? "class for a variable style" : "classes"}
              </p>
              <CodeSnippet
                comments={[
                  "// <weight>: Use a value from 100 to 900",
                  "// <uniquifier>: Use a unique and descriptive class name",
                ].join("\n")}
                code={sampleCss}
                copyLabel={`Copy ${first.family} sample CSS to clipboard`}
              />
            </gf-checkout-panel-section>
          </div>
        ) : null}
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <a
              color="primary"
              className="link link--link"
              href="/"
            >
              Legacy browser support for variable fonts
            </a>
          </gf-checkout-panel-section>
        </div>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <a
              color="primary"
              className="link link--link"
              href="/"
            >
              Read our FAQ
            </a>
          </gf-checkout-panel-section>
        </div>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <a
              mat-stroked-button=""
              color="primary"
              className="mdc-button mat-mdc-button-base gmat-mdc-button link link--button emphasized mdc-button--outlined mat-mdc-outlined-button gmat-mdc-button-with-prefix mat-primary"
              href="/"
            >
              <span className="mdc-button__label">
                <span className="link__content--button">
                  <gf-icon
                    name="open_in_new"
                    role="presentation"
                    aria-hidden="true"
                    style={{ width: 18, height: 18 }}
                  >
                    <Icon name="open_in_new" size={18} />
                  </gf-icon>{" "}
                  API Docs
                </span>
              </span>
            </a>
          </gf-checkout-panel-section>
        </div>
      </gf-checkout-panel>
    </div>
  );
}

function OtherPlatformPanel({
  tab,
  fonts,
}: {
  tab: Tab;
  fonts: FamilyMetadata[];
}) {
  const list = fonts.map((font) => font.family).join(", ");
  const docs: Record<Exclude<Tab, "Web">, { href: string; text: string }> = {
    Android: {
      href: "https://developer.android.com/develop/ui/views/text-and-emoji/downloadable-fonts",
      text: "Use downloadable fonts or bundle the font files in your app resources.",
    },
    iOS: {
      href: "https://developer.apple.com/documentation/uikit/adding-a-custom-font-to-your-app",
      text: "Add the font files to your Xcode project and register them in Info.plist.",
    },
    Flutter: {
      href: "https://pub.dev/packages/google_fonts",
      text: "Use the google_fonts package, or bundle the font files as assets.",
    },
  };
  const info = docs[tab as Exclude<Tab, "Web">];
  return (
    <div className="tab__content">
      <gf-checkout-panel>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <p className="gf-body-large info-text">
              Download {list} from the Web tab, then follow the {tab}{" "}
              integration guide. {info.text}
            </p>
          </gf-checkout-panel-section>
        </div>
        <div className="panel-section__wrapper">
          <gf-checkout-panel-section>
            <a
              color="primary"
              className="link link--link"
              href={info.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tab} documentation
            </a>
          </gf-checkout-panel-section>
        </div>
      </gf-checkout-panel>
    </div>
  );
}

function RadioButton({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <mat-radio-button
      className={`mat-mdc-radio-button gmat-mdc-radio mat-primary${
        checked ? " mat-mdc-radio-checked" : ""
      }`}
    >
      <div
        mat-internal-form-field=""
        className="mdc-form-field mat-internal-form-field"
      >
        <div className="mdc-radio">
          <div aria-hidden="true" className="mat-mdc-radio-touch-target"></div>
          <input
            type="radio"
            className="mdc-radio__native-control"
            checked={checked}
            aria-label={`${label} option`}
            onChange={onSelect}
          />
          <div aria-hidden="true" className="mdc-radio__background">
            <div className="mdc-radio__outer-circle"></div>
            <div className="mdc-radio__inner-circle"></div>
          </div>
        </div>
        <label className="mdc-label" onClick={onSelect}>
          {" "}
          {label}{" "}
        </label>
      </div>
    </mat-radio-button>
  );
}

function CodeSnippet({
  code,
  comments,
  copyLabel,
}: {
  code: string;
  comments?: string;
  copyLabel: string;
}) {
  return (
    <gf-code-snippet>
      <div className="gf-body-small code-snippet__wrapper">
        <div translate="no" className="code-snippet__content">
          <div className="code-snippet__comments">{comments ?? ""}</div>
          <div className="style">{code}</div>
        </div>
        <div className="code-snippet__copy-button">
          <copy-button>
            <button
              mat-button=""
              color="secondary"
              className="mdc-button mat-mdc-button-base gmat-mdc-button copy-button__button mat-mdc-button gmat-mdc-button-with-prefix mat-secondary"
              aria-label={copyLabel}
              type="button"
              onClick={() => void navigator.clipboard?.writeText(code)}
            >
              <span className="mdc-button__label">
                <gf-icon
                  className="copy-button__icon"
                  role="presentation"
                  aria-hidden="true"
                  style={{ width: 20, height: 20 }}
                >
                  <Icon name="content_copy" size={20} />
                </gf-icon>
                <span className="gf-body-medium copy-button__label">
                  Copy code
                </span>
              </span>
            </button>
          </copy-button>
        </div>
      </div>
    </gf-code-snippet>
  );
}

export default EmbedPage;
