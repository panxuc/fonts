import { useEffect } from "react";
import { GfFooter } from "./components/Footer";
import { GfHeader } from "./components/Header";
import { LeftDrawer } from "./components/LeftDrawer";
import { NavRail } from "./components/NavRail";
import { BrowsePage } from "./pages/BrowsePage";
import { EmbedPage } from "./pages/EmbedPage";
import { SelectionPage } from "./pages/SelectionPage";
import { SpecimenPage } from "./pages/SpecimenPage";
import { AppStateProvider, useAppState } from "./lib/app-state";
import { ensureIconFont } from "./lib/icons";
import { useRoute } from "./lib/router";

export function App() {
  useEffect(() => {
    ensureIconFont();
  }, []);
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}

// Shell structure mirrors fonts.google.com:
//   gf-root > div.has-secondary-nav > (gf-nav-rail, mat-sidenav-container)
//   mat-sidenav-container > mat-sidenav (left drawer) + mat-sidenav-content
//   mat-sidenav-content > gf-google-header + .gf-full-page > main + gf-footer
function Shell() {
  const route = useRoute();
  const { drawerOpen } = useAppState();
  const isBrowse = route.page === "browse";
  const drawerVisible = isBrowse && drawerOpen;
  const hasSecondaryNav = route.page === "browse" || route.page === "specimen";

  useEffect(() => {
    if (route.page === "specimen") {
      document.title = `${route.family} - Fonts`;
    } else if (route.page === "selection") {
      document.title = "Selection - Fonts";
    } else if (route.page === "embed") {
      document.title = "Embed code - Fonts";
    } else {
      document.title = "Browse Fonts - Fonts";
    }
  }, [route]);

  return (
    <gf-root className="gf-body-large">
      <a className="skip-to-content-link gf-title-small" href="#main-content">
        Skip to main content
      </a>
      <div className={hasSecondaryNav ? "has-secondary-nav" : undefined}>
        <NavRail route={route} />
        <mat-sidenav-container className="mat-drawer-container mat-sidenav-container drawer-container mat-drawer-transition">
          {isBrowse ? (
            <mat-sidenav
              aria-label="Left drawer"
              position="start"
              role="dialog"
              className={`mat-drawer mat-sidenav drawer mat-drawer-side mat-sidenav-fixed${
                drawerVisible ? " mat-drawer-opened" : ""
              }`}
              style={{
                top: 0,
                bottom: 0,
                ...(drawerVisible
                  ? {}
                  : { visibility: "hidden", transform: "translateX(-100%)" }),
              }}
            >
              <div className="mat-drawer-inner-container">
                <LeftDrawer />
              </div>
            </mat-sidenav>
          ) : null}
          <mat-sidenav-content
            className={`mat-drawer-content mat-sidenav-content drawer-content${
              drawerVisible ? " has-left-drawer-opened" : ""
            }`}
            style={drawerVisible ? { marginLeft: 320 } : undefined}
          >
            <GfHeader route={route} />
            <div className="gf-full-page gf-content">
              <main id="main-content">
                <div className="router-outlet-container">
                  <div>
                    {route.page === "browse" ? <BrowsePage /> : null}
                    {route.page === "specimen" ? (
                      <SpecimenPage family={route.family} tab={route.tab} />
                    ) : null}
                    {route.page === "selection" ? <SelectionPage /> : null}
                    {route.page === "embed" ? <EmbedPage /> : null}
                  </div>
                </div>
              </main>
              <GfFooter />
            </div>
          </mat-sidenav-content>
        </mat-sidenav-container>
      </div>
    </gf-root>
  );
}

export default App;
