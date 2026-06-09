import { useEffect, useState } from "react";
import { SpecimenHeader } from "./common";
import { oflSections } from "./license-text";
import {
  loadFamilyDetail,
  type FamilyDetailMetadata,
  type FamilyMetadata,
} from "../../lib/metadata";
import { Icon } from "../../lib/icons";

const licenseNames: Record<string, { name: string; url: string }> = {
  ofl: {
    name: "SIL Open Font License, Version 1.1",
    url: "https://openfontlicense.org/open-font-license-official-text/",
  },
  apache2: {
    name: "Apache License, Version 2.0",
    url: "https://www.apache.org/licenses/LICENSE-2.0",
  },
  gpl: {
    name: "GNU General Public License",
    url: "https://www.gnu.org/licenses/gpl-3.0.html",
  },
  ipa: {
    name: "IPA Font License Agreement v1.0",
    url: "https://opensource.org/license/ipa",
  },
  mit: {
    name: "MIT License",
    url: "https://opensource.org/license/mit",
  },
};

export function LicenseTab({ font }: { font: FamilyMetadata }) {
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

  const slug = detail?.license ?? "ofl";
  const license = licenseNames[slug] ?? {
    name: slug.toUpperCase(),
    url: detail?.minisiteUrl ?? "#",
  };

  return (
    <gf-license>
      <SpecimenHeader font={font} className="license__header" />
      <div className="license__columns">
        <div className="license__column--left">
          <h2 className="gm3-type-lg license__title">License</h2>
          <gf-html-view itemProp="description" className="font-article spaced">
            <div>
              <p>
                This Font Software is licensed under the{" "}
                <a href={license.url} target="_blank" rel="noreferrer">
                  {license.name}
                </a>
                {slug === "ofl" ? (
                  <>
                    . This license is copied below, and is also available with a
                    FAQ at:{" "}
                    <a
                      href="https://openfontlicense.org"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://openfontlicense.org
                    </a>
                  </>
                ) : (
                  "."
                )}
              </p>
              {slug === "ofl" ? (
                <>
                  <p>
                    <a
                      href="https://openfontlicense.org/open-font-license-official-text/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      SIL OPEN FONT LICENSE Version 1.1
                    </a>{" "}
                    - 26 February 2007
                  </p>
                  {oflSections.map((section) => (
                    <div key={section.id}>
                      <h3 id={section.id}>
                        <span className="nobreak">
                          {section.heading}
                          <button
                            mat-icon-button=""
                            aria-label="Copy link to this section"
                            title="Copy link to this section"
                            className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button gmat-mdc-button-with-prefix mat-secondary--gray"
                            type="button"
                            onClick={() => {
                              const url = new URL(window.location.href);
                              url.hash = section.id;
                              void navigator.clipboard?.writeText(String(url));
                            }}
                          >
                            <span className="mat-mdc-button-persistent-ripple mdc-icon-button__ripple"></span>
                            <gf-icon
                              name="link"
                              role="presentation"
                              aria-hidden="true"
                              style={{ width: 24, height: 24 }}
                            >
                              <Icon name="link" />
                            </gf-icon>
                            <span className="mat-focus-indicator"></span>
                            <span className="mat-mdc-button-touch-target"></span>
                          </button>
                        </span>
                      </h3>
                      {section.blocks.map((block, index) =>
                        block.type === "p" ? (
                          <p key={index}>{block.text}</p>
                        ) : (
                          <ul key={index}>
                            {block.items.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ),
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <p>
                  See the full license text at{" "}
                  <a href={license.url} target="_blank" rel="noreferrer">
                    {license.url}
                  </a>
                  .
                </p>
              )}
            </div>
          </gf-html-view>
        </div>
      </div>
    </gf-license>
  );
}
