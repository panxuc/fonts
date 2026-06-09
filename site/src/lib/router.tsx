// Minimal history router covering the fonts.google.com routes we replicate:
//   /                                browse catalog
//   /specimen/<Family>[/tab]         specimen (tab: tester|about|license|glyphs)
//   /selection                       selected families overview
//   /selection/embed                 embed code
import { useEffect, useState } from "react";

export type SpecimenTab =
  | "specimen"
  | "tester"
  | "about"
  | "license"
  | "glyphs";

export type Route =
  | { page: "browse" }
  | { page: "specimen"; family: string; tab: SpecimenTab }
  | { page: "selection" }
  | { page: "embed" };

export function parseRoute(pathname: string): Route {
  if (pathname === "/selection/embed") return { page: "embed" };
  if (pathname === "/selection") return { page: "selection" };
  const specimen = pathname.match(/^\/specimen\/([^/]+)(?:\/([a-z]+))?$/);
  if (specimen) {
    const tabs: SpecimenTab[] = ["tester", "about", "license", "glyphs"];
    const tab = tabs.includes(specimen[2] as SpecimenTab)
      ? (specimen[2] as SpecimenTab)
      : "specimen";
    return {
      page: "specimen",
      family: decodeURIComponent(specimen[1]).replaceAll("+", " "),
      tab,
    };
  }
  return { page: "browse" };
}

export function routePath(route: Route): string {
  switch (route.page) {
    case "browse":
      return "/";
    case "specimen": {
      const family = encodeURIComponent(route.family).replaceAll("%20", "+");
      return route.tab === "specimen"
        ? `/specimen/${family}`
        : `/specimen/${family}/${route.tab}`;
    }
    case "selection":
      return "/selection";
    case "embed":
      return "/selection/embed";
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function navigate(route: Route, options?: { query?: string }) {
  if (typeof window === "undefined") return;
  const query = options?.query ?? "";
  window.history.pushState(null, "", `${routePath(route)}${query}`);
  for (const listener of listeners) listener();
  window.scrollTo(0, 0);
}

export function replaceQuery(updates: Record<string, string | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function readQueryParam(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    parseRoute(typeof window === "undefined" ? "/" : window.location.pathname),
  );
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", update);
    listeners.add(update);
    return () => {
      window.removeEventListener("popstate", update);
      listeners.delete(update);
    };
  }, []);
  return route;
}
