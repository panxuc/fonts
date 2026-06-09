// Google Symbols icons, loaded exactly like fonts.google.com does:
//   /css2?family=Google Symbols&directory=3&display=block&icon_names=a,b,c
import type { CSSProperties } from "react";

// Every icon name used across the app, batched into one stylesheet request.
const ICON_NAMES = [
  "accessibility_new",
  "add",
  "add_circle",
  "apparel",
  "arrow_back",
  "arrow_downward",
  "arrow_drop_down",
  "arrow_forward_ios",
  "arrow_outward",
  "arrow_upward",
  "article",
  "close",
  "code",
  "content_copy",
  "custom_typography",
  "dark_mode",
  "delete",
  "feedback",
  "file_download",
  "font_download",
  "format_align_center",
  "format_align_justify",
  "format_align_left",
  "format_align_right",
  "format_color_fill",
  "format_color_text",
  "format_line_spacing",
  "glyphs",
  "help",
  "info",
  "interests",
  "language",
  "light_mode",
  "lightbulb",
  "linear_scale",
  "link",
  "list",
  "material_design",
  "open_in_new",
  "refresh",
  "remove",
  "school",
  "script",
  "search",
  "sentiment_satisfied",
  "serif",
  "share",
  "shopping_bag",
  "translate",
  "tune",
  "view_list",
  "view_module",
  "warning",
];

let injected = false;

export function ensureIconFont() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `/css2?family=${encodeURIComponent("Google Symbols")}&directory=3&display=block&icon_names=${encodeURIComponent(ICON_NAMES.join(","))}`;
  document.head.append(link);
}

export function Icon({
  name,
  size = 24,
  className = "",
  style,
}: {
  name: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <mat-icon
      role="img"
      fontset="google-symbols-subset"
      className={`mat-icon notranslate icon google-symbols-subset mat-icon-no-color ${className}`.trim()}
      aria-hidden="true"
      data-mat-icon-type="font"
      data-mat-icon-namespace="google-symbols-subset"
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
    >
      {name}
    </mat-icon>
  );
}
