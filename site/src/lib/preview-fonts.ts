// Per-family preview font loading, mirroring fonts.google.com:
//   /css2?family=Roboto:wght@400&directory=3&display=block&text=<deduped>
// Each unique (family, axes, text) request becomes one <link rel=stylesheet>.

import type { FamilyMetadata } from "./metadata";

const loaded = new Map<string, HTMLLinkElement>();

export function dedupeText(text: string) {
  return [...new Set([...text])]
    .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
    .join("");
}

function previewSpec(font: FamilyMetadata) {
  // The catalog UI always previews the default style: ital 0, wght 400 (or
  // the nearest available weight), plus default values for other axes so
  // variable fonts resolve their default instance.
  const weights = Object.keys(font.fonts)
    .filter((key) => !key.endsWith("i"))
    .map(Number)
    .filter(Number.isFinite);
  const weight = weights.includes(400)
    ? 400
    : (weights.sort((a, b) => a - b)[0] ?? 400);
  return `${font.family}:wght@${weight}`;
}

export function previewCssUrl(font: FamilyMetadata, text: string) {
  const family = encodeURIComponent(previewSpec(font));
  const encoded = encodeURIComponent(dedupeText(text));
  return `/css2?family=${family}&directory=3&display=block&text=${encoded}`;
}

export function ensurePreviewFont(font: FamilyMetadata, text: string) {
  if (typeof document === "undefined") return;
  const url = previewCssUrl(font, text);
  if (loaded.has(url)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-gf-preview", font.family);
  document.head.append(link);
  loaded.set(url, link);
}

// Specimen pages load full families (all styles, no text subsetting).
const familyCss = new Map<string, HTMLLinkElement>();

export function ensureFullFamily(font: FamilyMetadata) {
  if (typeof document === "undefined") return;
  const url = fullFamilyCssUrl(font);
  if (familyCss.has(url)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-gf-family", font.family);
  document.head.append(link);
  familyCss.set(url, link);
}

export function fullFamilyCssUrl(font: FamilyMetadata) {
  // Like Google, keep the axis spec (:,;@..) literal; only spaces become +.
  return `/css2?family=${familyAxisSpec(font).replaceAll(" ", "+")}&display=swap`;
}

// Build the css2 axis spec covering every style of the family, e.g.
// "Roboto:ital,wght@0,100..900;1,100..900" or "LXGW WenKai:wght@300;400;500".
export function familyAxisSpec(font: FamilyMetadata) {
  const wght = font.axes.find((axis) => axis.tag === "wght");
  const hasItalic = Object.keys(font.fonts).some((key) => key.endsWith("i"));
  const weights = [
    ...new Set(
      Object.keys(font.fonts).map((key) =>
        Number(key.endsWith("i") ? key.slice(0, -1) : key),
      ),
    ),
  ].sort((a, b) => a - b);
  const weightSpec = wght ? `${wght.min}..${wght.max}` : weights.join(";");
  if (!hasItalic) {
    return `${font.family}:wght@${weightSpec}`;
  }
  const tuple = (ital: number) =>
    wght
      ? `${ital},${wght.min}..${wght.max}`
      : weights.map((weight) => `${ital},${weight}`).join(";");
  return `${font.family}:ital,wght@${tuple(0)};${tuple(1)}`;
}
