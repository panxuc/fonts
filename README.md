# Fonts

A Google Fonts-compatible font service on Cloudflare Workers + R2, with a
catalog site that mirrors fonts.google.com.

- **Google families are proxied live.** Any of the ~1,900 Google Fonts
  families work through `/css2`, `/css`, `/metadata/fonts`, and
  `/webfonts/v1/webfonts` with `fonts.gstatic.com` URLs rewritten to this
  service's static host. No per-family configuration needed.
- **Custom families are built like Google builds theirs.** Fonts listed in
  `fonts.catalog.yaml` are downloaded from their upstreams, sliced with
  Google's real unicode-range slicing tables (the ~100-slice strategy Google
  uses for Noto Sans SC/TC/JP/KR, plus the named latin/cyrillic/… subsets),
  subset to WOFF2 with fontTools, and served from R2. The CSS API output is
  format-identical to Google's.
- **The site is a faithful clone of fonts.google.com**: same DOM structure
  and the real app's CSS (harvested and de-scoped), with browse (filters,
  search, sort, list/grid), specimen pages (tester, styles, about, license,
  glyphs), selection and embed-code pages, light/dark themes.

## Project layout

```txt
src/worker.ts                    # Cloudflare Worker: routing for site/api/static hosts
src/css-api.ts                   # /css and /css2 generation (Google-format output)
src/catalog.ts                   # custom catalog -> Google-shaped metadata
src/generated/catalog-data.*     # generated from fonts.catalog.yaml (custom fonts only)
scripts/build-catalog.mjs        # YAML -> generated catalog
scripts/build-custom-assets.mjs  # download, slice, subset, upload custom fonts
scripts/data/catalog-shards.json # materialized shard metadata kept in git
scripts/data/cjk-slices.json     # Google's real CJK slice tables (sc/tc/jp/kr)
scripts/data/named-subsets.json  # Google's named subset unicode-ranges
site/                            # React clone of fonts.google.com (Vite)
site/src/gf.css                  # CSS harvested from the live fonts.google.com app
site/public/data/tags.json       # filter tag taxonomy (from google/fonts repo)
wrangler.toml                    # Worker config: routes, assets, R2 binding
```

## Commands

```bash
pnpm install
pnpm setup:python          # venv with fontTools/brotli for subsetting
pnpm build                 # catalog + site + worker dry-run
pnpm dev                   # wrangler dev on :8787 (serves built site + APIs)
pnpm dev:site              # vite dev server on :5173, proxying APIs to :8787
```

Custom font assets:

```bash
pnpm build:catalog                                   # YAML -> src/generated
CUSTOM_FONT_FILTER=lxgw-wenkai pnpm materialize:custom-assets   # build WOFF2 locally
pnpm sync:local-assets                               # copy into dist/site for local dev
FONT_ASSETS_BUCKET=fonts-assets pnpm deploy:fonts    # build + upload to R2
```

Materializing reads each source font's cmap, intersects it with Google's
slice tables (`scripts/data/cjk-slices.json` for zh-Hans/zh-Hant/ja/ko,
`named-subsets.json` otherwise), writes the shard list into
`scripts/data/catalog-shards.json` and the generated catalog, and subsets one
WOFF2 per shard named
`s/<id>/v<version>/<id>-<style>-<weight>.<shard>.woff2` — the same key the
worker's CSS output references. TTC/OTC collections are unpacked first and
the member is picked by family name.

Font asset builds are intentionally separate from normal app builds because
subsetting and uploading CJK fonts can exceed short CI timeouts. The
`.github/workflows/font-assets.yml` workflow runs on catalog/slice changes and
can also be started manually with an optional `custom_font_filter` input for
one or more font ids. It uploads WOFF2 assets to R2 and commits updated shard
metadata back to `scripts/data/catalog-shards.json`.

Some upstream hosts publish incomplete TLS chains; downloads fall back to
`curl --insecure` only for hosts in `FONT_DOWNLOAD_INSECURE_HOSTS`
(default `tsanger.cn,www.tsanger.cn`).

## Local development

`wrangler dev` reads `.dev.vars` (gitignored), which points all hosts at
`http://127.0.0.1:8787` so CSS references resolve locally:

```ini
SITE_HOST=127.0.0.1:8787
API_HOST=127.0.0.1:8787
STATIC_HOST=127.0.0.1:8787
STATIC_BASE_URL=http://127.0.0.1:8787
```

Build the site and sync any materialized fonts first:
`pnpm build:site && pnpm sync:local-assets`, then `pnpm dev`.

## Cloudflare deployment

```bash
pnpm exec wrangler r2 bucket create fonts-assets
pnpm exec wrangler secret put GOOGLE_FONTS_API_KEY   # optional, for /webfonts/v1
pnpm deploy   # build catalog + site + wrangler deploy
```

When font sources or versions change, publish font assets separately with the
Font assets GitHub Actions workflow, or run `pnpm deploy:fonts` locally with
Cloudflare credentials configured.

Three custom domains point at the same Worker (see `wrangler.toml`): the
site host (catalog UI), the API host (`/css2`, `/metadata/...`), and the
static host (`/s/...` custom WOFF2 from R2, `/gstatic/...` proxied Google
binaries). All API paths also work on the site host, which is what the SPA
uses.

## License

Repository code is MIT licensed. Font assets remain under their upstream
font licenses; Google Fonts assets are proxied at request time and are not
stored in this repository.
