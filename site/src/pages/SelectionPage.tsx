import { useMemo, useState } from "react";
import {
  FilterChips,
  MatIconButton,
  TileVariantLabel,
  familyStack,
  useDocumentTitle,
} from "../components/specimen/common";
import {
  howToUseChips,
  howToUseTiles,
} from "../components/specimen/knowledge-data";
import { useAppState } from "../lib/app-state";
import { Icon } from "../lib/icons";
import { sampleTextFor, type FamilyMetadata } from "../lib/metadata";
import {
  ensureFullFamily,
  familyAxisSpec,
  fullFamilyCssUrl,
} from "../lib/preview-fonts";
import { navigate } from "../lib/router";
import {
  clearFamilies,
  removeFamily,
  useSelectedFamilies,
} from "../lib/selection";

export function SelectionPage() {
  const { familyByName, loading } = useAppState();
  const selected = useSelectedFamilies();
  const fonts = useMemo(
    () =>
      selected
        .map((family) => familyByName.get(family))
        .filter((font): font is FamilyMetadata => Boolean(font)),
    [selected, familyByName],
  );
  useDocumentTitle("Selection - Fonts");

  if (!loading && fonts.length === 0) {
    return <EmptySelection />;
  }

  return (
    <gf-checkout-overview>
      <div>
        <h1 className="gm3-type-lg header__title">
          {fonts.length} font {fonts.length === 1 ? "family" : "families"}{" "}
          selected
        </h1>
        <div className="content">
          <div className="content__ctas">
            <a
              mat-flat-button=""
              color="primary"
              className="mdc-button mat-mdc-button-base gmat-mdc-button cta ctas__embed emphasized mdc-button--unelevated mat-mdc-unelevated-button gmat-mdc-button-with-prefix mat-primary"
              href="/selection/embed"
              onClick={(event) => {
                event.preventDefault();
                navigate({ page: "embed" });
              }}
            >
              <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
              <span className="mdc-button__label">
                <gf-icon
                  className="embed__icon"
                  role="presentation"
                  aria-hidden="true"
                  style={{ width: 20, height: 20 }}
                >
                  <Icon name="code" size={20} />
                </gf-icon>{" "}
                Get embed code
              </span>
              <span className="mat-focus-indicator"></span>
              <span className="mat-mdc-button-touch-target"></span>
            </a>
            <gf-download-button className="cta ctas__download emphasized">
              <a
                mat-flat-button=""
                color="primary"
                className="mdc-button mat-mdc-button-base gmat-mdc-button mdc-button--unelevated mat-mdc-unelevated-button rounded mat-primary"
                aria-label={`Download ${fonts.length} selected ${
                  fonts.length === 1 ? "family" : "families"
                }`}
                href={fonts.length ? fullFamilyCssUrl(fonts[0]) : "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
                <span className="mdc-button__label">
                  <span className="wrapper">
                    <gf-icon
                      name="file_download"
                      className="centered"
                      role="presentation"
                      aria-hidden="true"
                      style={{ width: 20, height: 20 }}
                    >
                      <Icon name="file_download" size={20} />
                    </gf-icon>
                    <span className="footer__button-text">
                      {" "}
                      Download all ({fonts.length}){" "}
                    </span>
                  </span>
                </span>
                <span className="mat-focus-indicator"></span>
                <span className="mat-mdc-button-touch-target"></span>
              </a>
            </gf-download-button>
            <a
              mat-button=""
              color="primary"
              className="mdc-button mat-mdc-button-base gmat-mdc-button how-to-use mat-mdc-button mat-primary"
              href="#how-to-use"
            >
              <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
              <span className="mdc-button__label">
                <span className="how-to-use__label">See how to use</span>
              </span>
              <span className="mat-focus-indicator"></span>
              <span className="mat-mdc-button-touch-target"></span>
            </a>
          </div>
          <div className="content__tiles">
            <div className="tiles__actions">
              <gf-share-popup>
                <button
                  mat-button=""
                  color="secondary--gray"
                  aria-label="Share a direct link to the selected font families"
                  className="mdc-button mat-mdc-button-base gmat-mdc-button share-button mat-mdc-button gmat-mdc-button-with-prefix mat-secondary--gray"
                  type="button"
                  onClick={() => {
                    const url = new URL("/selection", window.location.origin);
                    url.searchParams.set(
                      "selection.family",
                      fonts
                        .map((font) => font.family.replaceAll(" ", "+"))
                        .join("|"),
                    );
                    void navigator.clipboard?.writeText(String(url));
                  }}
                >
                  <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
                  <span className="mdc-button__label">
                    <div className="share-button__label-wrapper">
                      <gf-icon
                        name="share"
                        className="share-button__icon"
                        role="presentation"
                        aria-hidden="true"
                        style={{ width: 24, height: 24 }}
                      >
                        <Icon name="share" />
                      </gf-icon>{" "}
                      Share
                    </div>
                  </span>
                  <span className="mat-focus-indicator"></span>
                  <span className="mat-mdc-button-touch-target"></span>
                </button>
              </gf-share-popup>
              <div className="actions__remove-all">
                <button
                  mat-button=""
                  color="secondary--gray"
                  aria-label="Remove all fonts"
                  className="mdc-button mat-mdc-button-base gmat-mdc-button mat-mdc-button gmat-mdc-button-with-prefix mat-secondary--gray"
                  type="button"
                  onClick={clearFamilies}
                >
                  <span className="mat-mdc-button-persistent-ripple mdc-button__ripple"></span>
                  <span className="mdc-button__label">
                    <div className="remove-all__content">
                      <gf-icon
                        name="delete"
                        className="remove-all__icon"
                        role="presentation"
                        aria-hidden="true"
                        style={{ width: 24, height: 24 }}
                      >
                        <Icon name="delete" />
                      </gf-icon>{" "}
                      Remove all
                    </div>
                  </span>
                  <span className="mat-focus-indicator"></span>
                  <span className="mat-mdc-button-touch-target"></span>
                </button>
              </div>
            </div>
            <gf-font-tiles className="layout--row">
              <div
                aria-label="List of font families"
                className="gf-grid-layout tiles-container"
                style={{ paddingTop: 0 }}
              >
                {fonts.map((font, index) => (
                  <SelectionTile
                    key={font.family}
                    font={font}
                    position={index + 1}
                    total={fonts.length}
                  />
                ))}
              </div>
            </gf-font-tiles>
          </div>
        </div>
        <HowToUse />
      </div>
    </gf-checkout-overview>
  );
}

function SelectionTile({
  font,
  position,
  total,
}: {
  font: FamilyMetadata;
  position: number;
  total: number;
}) {
  ensureFullFamily(font);
  return (
    <gf-tile aria-setsize={String(total)} aria-posinset={String(position)}>
      <div className="tile__header">
        <a
          className="gf-block-anchor"
          href={`/specimen/${encodeURIComponent(font.family).replaceAll("%20", "+")}`}
          aria-label={font.family}
          onClick={(event) => {
            event.preventDefault();
            navigate({
              page: "specimen",
              family: font.family,
              tab: "specimen",
            });
          }}
        >
          <div className="tile__header--title mat-text--title gf-title-medium">
            <span className="gf-block-anchor__text"> {font.family} </span>
          </div>
        </a>
        <div tile-subheader="">
          <TileVariantLabel font={font} />
        </div>
        <div tile-actions="">
          <gf-tile-actions>
            <MatIconButton
              label={`Remove ${font.family}`}
              icon="delete"
              onClick={() => removeFamily(font.family)}
            />
            <a
              mat-icon-button=""
              className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button gmat-mdc-button-with-prefix mat-secondary--gray"
              aria-label={`Download ${font.family}`}
              href={fullFamilyCssUrl(font)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span>
              <gf-icon role="presentation" aria-hidden="true">
                <Icon name="file_download" />
              </gf-icon>
              <span className="mat-focus-indicator"></span>
              <span className="mat-mdc-button-touch-target"></span>
            </a>
          </gf-tile-actions>
        </div>
      </div>
      <div className="tile__content">
        <div
          translate="no"
          className="tile__sample-text"
          style={{ ...familyStack(font), fontSize: 40, lineHeight: "normal" }}
        >
          {sampleTextFor(font)}
        </div>
      </div>
    </gf-tile>
  );
}

function EmptySelection() {
  return (
    <gf-checkout-overview>
      <gf-error>
        <div role="img" aria-hidden="true" className="error-kaomoji">
          {" "}
          (˚Δ˚)b{" "}
        </div>
        <div className="error-text gf-title-medium">
          <div>You don't have any fonts yet. Choose a font to get started.</div>
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
// "How to use" resources section

function HowToUse() {
  const [chip, setChip] = useState("All");
  const tiles = howToUseTiles.filter(
    (tile) => chip === "All" || tile.categories.includes(chip),
  );
  return (
    <gf-how-to-use id="how-to-use">
      <div className="how-to-use__header responsive-headings">
        <h2 className="gm3-type-lg">How to use</h2>
      </div>
      <FilterChips
        ariaLabel="Filter resources by platform"
        chips={howToUseChips.map((label) => ({
          label,
          selected: label === chip,
        }))}
        onToggle={setChip}
      />
      <div className="how-to-use__tiles">
        {tiles.map((tile) => (
          <gf-resource-tile key={tile.title}>
            <a
              className="gf-block-anchor resource-tile"
              href={tile.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tile.title}
            >
              {tile.imageUrl ? (
                <img
                  className="resource-tile__image"
                  alt=""
                  src={tile.imageUrl}
                  loading="lazy"
                />
              ) : null}
              <div className="resource-tile__content">
                <p className="gm3-type-h4 resource-tile__title">{tile.title}</p>
                {tile.description ? (
                  <p className="gm3-type-body resource-tile__description">
                    {tile.description}
                  </p>
                ) : null}
              </div>
            </a>
          </gf-resource-tile>
        ))}
      </div>
    </gf-how-to-use>
  );
}

export default SelectionPage;
