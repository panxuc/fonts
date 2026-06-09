// Left navigation rail, mirroring gf-nav-rail on fonts.google.com.
import { useAppState } from "../lib/app-state";
import { navigate, type Route } from "../lib/router";
import { ButtonSpans, GfIcon, IconButtonRipple, withAttrs } from "./mat";

const railLinks = [
  { label: "Fonts", icon: "font_download", href: "/" },
  { label: "GitHub", icon: "code", href: "https://github.com/panxuc/fonts" },
];

export function NavRail({ route }: { route: Route }) {
  const { dark, toggleDark } = useAppState();
  return (
    <gf-nav-rail role="navigation" aria-label="Nav bar" behavior="rail">
      {railLinks.map((link) => {
        const active = link.label === "Fonts" && route.page === "browse";
        return (
          <a
            key={link.label}
            role="link"
            className={`nav-rail__link${active ? " active" : ""}`}
            aria-label={link.label}
            aria-current={active}
            href={link.href}
            onClick={
              link.label === "Fonts"
                ? (event) => {
                    event.preventDefault();
                    navigate({ page: "browse" });
                  }
                : undefined
            }
          >
            <span className="nav-rail__icon">
              <GfIcon name={link.icon} filled={active} animated />
            </span>
            <span className="nav-rail__label gf-label-medium">
              {link.label}
            </span>
          </a>
        );
      })}
      <div className="bottom-aligned">
        <gf-theme-toggle>
          <button
            {...withAttrs({ color: "secondary--gray", "mat-icon-button": "" })}
            className="mdc-icon-button mat-mdc-icon-button mat-mdc-button-base gmat-mdc-button mat-mdc-tooltip-trigger theme-toggle gmat-mdc-button-with-prefix mat-secondary--gray"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            onClick={toggleDark}
          >
            <IconButtonRipple />
            <GfIcon name={dark ? "light_mode" : "dark_mode"} />
            <ButtonSpans />
          </button>
        </gf-theme-toggle>
      </div>
    </gf-nav-rail>
  );
}
