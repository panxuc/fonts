// Site footer, mirroring the gf-footer markup from the harvested
// fonts.google.com snapshot (.cache/research/ref/*.html).
import { footerArt } from "./specimen/footer-art";

type FooterItem = {
  href: string;
  heading: string;
  description: string;
  art: string;
  github?: boolean;
};

const FOOTER_COLUMNS: FooterItem[][] = [
  [
    {
      href: "/",
      heading: "About Fonts",
      description:
        "A fast font catalog and delivery service for open-source typefaces",
      art: footerArt.aboutUs,
    },
    {
      href: "https://github.com/panxuc/fonts",
      heading: "Source",
      description: "Review source projects and upstream font repositories",
      art: footerArt.github,
      github: true,
    },
    {
      href: "/selection",
      heading: "Selection",
      description: "Collect families and generate embed code for your site",
      art: footerArt.blog,
    },
  ],
  [
    {
      href: "/",
      heading: "Catalog",
      description: "Browse available families, scripts, weights, and styles",
      art: footerArt.blog,
    },
    {
      href: "/",
      heading: "Typography",
      description: "Preview type, compare styles, and inspect glyph coverage",
      art: footerArt.materialDesign,
    },
    {
      href: "/selection/embed",
      heading: "Developer API",
      description: "Use CSS endpoints compatible with familiar web font embeds",
      art: footerArt.googleDesign,
    },
  ],
];

export function GfFooter() {
  return (
    <gf-footer>
      <footer id="footer" className="footer-container">
        <div className="footer__content">
          <div className="left_side">
            <div aria-label="Fonts" className="logo footer__title">
              <gf-thumbnail
                className="gf-lockup__brand"
              >
                <span className="footer-brand-text">Fonts</span>
              </gf-thumbnail>
            </div>
          </div>
          <div className="footer__description">
            <div className="footer__text gm3-type-body">
              Fonts makes it easy to bring personality and performance to your
              websites and products. Browse open-source families, preview
              styles, and generate embed code for fast web font delivery.
            </div>
          </div>
        </div>
        <div className="footer__nav-container">
          <div className="footer__nav">
            {FOOTER_COLUMNS.map((column, index) => (
              <ul className="footer__nav-list" key={index}>
                {column.map((item) => (
                  <li key={item.heading}>
                    <gf-footer-item>
                      <a className="footer__item" href={item.href}>
                        <div className="item__container">
                          {item.github ? (
                            <gf-thumbnail className="item__thumbnail">
                              <span
                                className="github"
                                dangerouslySetInnerHTML={{ __html: item.art }}
                              />
                            </gf-thumbnail>
                          ) : (
                            <gf-thumbnail
                              className="item__thumbnail"
                              dangerouslySetInnerHTML={{ __html: item.art }}
                            />
                          )}
                          <div className="item__content">
                            <p className="item__heading mat-text--title gf-title-medium">
                              {item.heading}
                            </p>
                            <p className="item__description mat-text--secondary gm3-type-text">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </a>
                    </gf-footer-item>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
        <div className="footer__logo-and-privacy">
          <div className="footer__content footer--center">
            <gf-thumbnail
              className="centered footer__logo"
            >
              <span className="footer-mini-logo">F</span>
            </gf-thumbnail>
            <div>
              <a className="footer__link gf-body-medium" href="/">
                Privacy
              </a>
              <a className="footer__link gf-body-medium" href="/">
                Terms of service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </gf-footer>
  );
}
