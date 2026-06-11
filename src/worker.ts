import {
  appendCustomFamilyMetadata,
  findCustomFamily,
  mergeCustomWebfonts,
  toFamilyDetailMetadata,
  toMetadataFontsResponse,
  toWebfontsResponse,
} from "./catalog.ts";
import {
  generateCustomCss,
  googleCssUrl,
  parseCssApiRequest,
  rewriteGstaticUrls,
} from "./css-api.ts";
import type {
  CssFamilyRequest,
  FontCatalogEntry,
  MetadataFontsResponse,
  WebfontsResponse,
} from "./types.ts";

export type FontsEnv = {
  API_HOST?: string;
  STATIC_HOST?: string;
  STATIC_BASE_URL?: string;
  SITE_HOST?: string;
  GOOGLE_FONTS_API_KEY?: string;
  FONT_ASSETS?: {
    get(key: string): Promise<Response | R2ObjectLike | null>;
  };
  ASSETS?: {
    fetch(request: Request): Promise<Response>;
  };
};

type R2ObjectLike = {
  body: ReadableStream<Uint8Array> | null;
  httpMetadata?: { contentType?: string };
};

const defaultUserAgent =
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
let catalogCache: Promise<FontCatalogEntry[]> | null = null;

export default {
  async fetch(request: Request, env: FontsEnv): Promise<Response> {
    const url = new URL(request.url);
    const host = url.host;
    if (isApiPath(url.pathname)) {
      return handleApiRequest(request, env);
    }
    if (isStaticPath(url.pathname)) {
      return handleStaticRequest(request, env);
    }
    if (host === env.API_HOST) return handleApiRequest(request, env);
    if (host === env.STATIC_HOST) return handleStaticRequest(request, env);
    return handleSiteRequest(request, env);
  },
};

async function handleApiRequest(request: Request, env: FontsEnv) {
  const url = new URL(request.url);
  const fontCatalog = await loadCustomCatalog(env);
  if (url.pathname === "/css" || url.pathname === "/css2") {
    return handleCssRequest(request, env, fontCatalog);
  }
  if (url.pathname === "/webfonts/v1/webfonts") {
    return handleWebfontsRequest(request, env, fontCatalog);
  }
  if (url.pathname === "/metadata/fonts") {
    return handleMetadataFontsRequest(fontCatalog);
  }
  if (url.pathname.startsWith("/metadata/fonts/")) {
    return handleMetadataFamilyRequest(url, fontCatalog);
  }
  return new Response("Not found", { status: 404 });
}

// ---------------------------------------------------------------------------
// CSS API (/css and /css2)

async function handleCssRequest(
  request: Request,
  env: FontsEnv,
  fontCatalog: FontCatalogEntry[],
) {
  const url = new URL(request.url);
  const cssRequest = parseCssApiRequest(url);
  if (!cssRequest.families.length) {
    return googleStyleError(url.searchParams.get("family") ?? "");
  }

  const blocks: string[] = [];
  for (const familyRequest of cssRequest.families) {
    const font = findCustomFamily(fontCatalog, familyRequest.family);

    if (font) {
      blocks.push(
        generateCustomCss(familyRequest, font, {
          display: cssRequest.display,
          staticBaseUrl: staticBaseUrl(env, request),
          text: cssRequest.text,
        }),
      );
    } else {
      const css = await fetchGoogleCssBlock(
        cssRequest.endpoint,
        familyRequest,
        url,
        request,
        env,
      );
      if (css === null) return googleStyleError(familyRequest.family);
      blocks.push(css.trim());
    }
  }

  return text(blocks.filter(Boolean).join("\n"), "text/css; charset=utf-8", {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "private, max-age=86400",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
}

async function fetchGoogleCssBlock(
  endpoint: "/css" | "/css2",
  familyRequest: CssFamilyRequest,
  url: URL,
  request: Request,
  env: FontsEnv,
) {
  const upstreamUrl = googleCssUrl(endpoint, familyRequest, url);
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: {
        "User-Agent": request.headers.get("User-Agent") || defaultUserAgent,
        Accept: "text/css,*/*;q=0.1",
      },
    });
    const contentType =
      upstream.headers.get("content-type")?.toLocaleLowerCase() ?? "";
    if (!upstream.ok || contentType.includes("text/html")) {
      return null;
    }
    return rewriteGstaticUrls(
      await upstream.text(),
      staticBaseUrl(env, request),
    );
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Metadata API (fonts.google.com/metadata/*)

async function handleMetadataFontsRequest(fontCatalog: FontCatalogEntry[]) {
  const official = await fetchOfficialMetadataFonts();
  if (official) return json(appendCustomFamilyMetadata(official, fontCatalog));
  return json(toMetadataFontsResponse(fontCatalog));
}

async function handleMetadataFamilyRequest(
  url: URL,
  fontCatalog: FontCatalogEntry[],
) {
  const family = decodeURIComponent(
    url.pathname.replace("/metadata/fonts/", ""),
  );
  const font = findCustomFamily(fontCatalog, family);
  if (font) {
    return text(
      `)]}'\n${JSON.stringify(toFamilyDetailMetadata(font), null, 2)}`,
      "application/json; charset=utf-8",
      {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "private, max-age=86400",
      },
    );
  }

  const official = await fetchOfficialMetadataFamily(family);
  if (official) return withCors(official);
  return googleStyleError(family);
}

async function fetchOfficialMetadataFonts() {
  try {
    const response = await fetch("https://fonts.google.com/metadata/fonts", {
      headers: {
        Accept: "application/json",
        "User-Agent": defaultUserAgent,
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as MetadataFontsResponse;
  } catch {
    return null;
  }
}

async function fetchOfficialMetadataFamily(family: string) {
  try {
    const response = await fetch(
      `https://fonts.google.com/metadata/fonts/${encodeURIComponent(family)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": defaultUserAgent,
        },
      },
    );
    if (!response.ok) return null;
    return response;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Developer API (webfonts/v1/webfonts)

async function handleWebfontsRequest(
  request: Request,
  env: FontsEnv,
  fontCatalog: FontCatalogEntry[],
) {
  const url = new URL(request.url);
  const staticBase = staticBaseUrl(env, request);
  if (env.GOOGLE_FONTS_API_KEY) {
    const official = await fetchOfficialWebfonts(url, env);
    if (official) {
      return json(mergeCustomWebfonts(official, fontCatalog, staticBase));
    }
  }
  return json(toWebfontsResponse(fontCatalog, staticBase));
}

async function fetchOfficialWebfonts(url: URL, env: FontsEnv) {
  const params = new URLSearchParams(url.searchParams);
  params.set("key", env.GOOGLE_FONTS_API_KEY ?? "");
  try {
    const response = await fetch(
      `https://www.googleapis.com/webfonts/v1/webfonts?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": defaultUserAgent,
        },
      },
    );
    if (!response.ok) return null;
    return (await response.json()) as WebfontsResponse;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Custom catalog data

async function loadCustomCatalog(env: FontsEnv): Promise<FontCatalogEntry[]> {
  catalogCache ??= readCustomCatalog(env);
  return catalogCache;
}

async function readCustomCatalog(env: FontsEnv): Promise<FontCatalogEntry[]> {
  if (!env.ASSETS) {
    throw new Error("ASSETS binding is required to load the custom catalog");
  }
  const response = await env.ASSETS.fetch(
    new Request("https://assets.local/data/catalog-data.json"),
  );
  if (!response.ok) {
    throw new Error(`Unable to load custom catalog: ${response.status}`);
  }
  return (await response.json()) as FontCatalogEntry[];
}

// ---------------------------------------------------------------------------
// Static font assets

async function handleStaticRequest(request: Request, env: FontsEnv) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/gstatic/")) {
    const target = `https://fonts.gstatic.com/${url.pathname.slice("/gstatic/".length)}${url.search}`;
    const response = await fetch(target, {
      headers: {
        "User-Agent": request.headers.get("User-Agent") || defaultUserAgent,
      },
    });
    return withCors(response);
  }

  if (url.pathname.startsWith("/s/")) {
    const key = decodeURIComponent(url.pathname.replace(/^\//, ""));
    const object = await env.FONT_ASSETS?.get(key);
    if (!object) return handleStaticAssetFallback(request, env);
    if (object instanceof Response) return withCors(object);
    return new Response(object.body, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": object.httpMetadata?.contentType ?? "font/woff2",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}

async function handleStaticAssetFallback(request: Request, env: FontsEnv) {
  if (!env.ASSETS) {
    return new Response("Font asset not found", { status: 404 });
  }

  const response = await env.ASSETS.fetch(request);
  if (response.status === 404) {
    return new Response("Font asset not found", { status: 404 });
  }

  return withCors(response);
}

async function handleSiteRequest(request: Request, env: FontsEnv) {
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return text(
    '<!doctype html><title>Fonts</title><div id="root"></div><script type="module" src="/src/main.tsx"></script>',
    "text/html; charset=utf-8",
  );
}

// ---------------------------------------------------------------------------
// Routing and host helpers

function isApiPath(pathname: string) {
  return (
    pathname === "/css" ||
    pathname === "/css2" ||
    pathname === "/metadata/fonts" ||
    pathname.startsWith("/metadata/fonts/") ||
    pathname === "/webfonts/v1/webfonts"
  );
}

function isStaticPath(pathname: string) {
  return pathname.startsWith("/gstatic/") || pathname.startsWith("/s/");
}

function staticHost(env: FontsEnv) {
  return env.STATIC_HOST
    ? hostFromValue(env.STATIC_HOST)
    : "fonts-static.example";
}

function staticBaseUrl(env: FontsEnv, request?: Request) {
  if (env.STATIC_BASE_URL) return trimTrailingSlash(env.STATIC_BASE_URL);
  if (!env.STATIC_HOST && request) {
    const requestUrl = new URL(request.url);
    const requestHost = request.headers.get("host") ?? requestUrl.host;
    if (isLocalHost(requestHost)) return "";
  }

  const host = staticHost(env);
  const requestProtocol = request ? new URL(request.url).protocol : "https:";
  const protocol = isLocalHost(host) ? requestProtocol : "https:";
  return `${protocol}//${host}`;
}

function hostFromValue(value: string) {
  if (/^https?:\/\//i.test(value)) return new URL(value).host;
  return value.replace(/\/.*$/, "");
}

function isLocalHost(host: string) {
  const hostname = host.startsWith("[")
    ? host.slice(1, host.indexOf("]"))
    : host.split(":")[0];
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "::1"
  );
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

// ---------------------------------------------------------------------------
// Response helpers

function text(
  body: string,
  contentType: string,
  headers: Record<string, string> = {},
) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      ...headers,
    },
  });
}

function json(body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function googleStyleError(family: string) {
  return new Response(
    [
      "<!doctype html>",
      '<html lang="en">',
      '<head><meta charset="utf-8"><title>400: Font family not found</title></head>',
      "<body>",
      "<h1>Fonts</h1>",
      "<p><b>400:</b>&nbsp;<ins>Missing font family</ins></p>",
      `<p>The requested font families are not available.</p><p>Requested: ${escapeHtml(family)}</p>`,
      "</body></html>",
    ].join(""),
    {
      status: 400,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
