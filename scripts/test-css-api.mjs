// Tests for the CSS API emulation (src/css-api.ts) and the worker routes that
// serve it. Run with:
//
//   node --experimental-strip-types scripts/test-css-api.mjs
//
// The golden expectations mirror fonts.googleapis.com behavior for sliced CJK
// fonts: per (style, weight) group the numbered slices come first (ascending,
// no comment), then the named subsets in catalog order with `/* name */`
// comments; the groups follow the requested order.

import assert from "node:assert/strict";
import {
  generateCustomCss,
  googleCssUrl,
  parseCssApiRequest,
  rewriteGstaticUrls,
} from "../src/css-api.ts";
import { assetUrl, findCustomFamily } from "../src/catalog.ts";
import worker from "../src/worker.ts";

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// ---------------------------------------------------------------------------
// Fixtures

function makeFont(overrides = {}) {
  return {
    id: "test-sans-sc",
    family: "Test Sans SC",
    displayName: null,
    language: "zh-Hans",
    script: "sc",
    category: "Sans Serif",
    subsets: ["menu", "chinese-simplified", "latin", "latin-ext"],
    shards: [],
    weights: ["400"],
    styles: ["normal"],
    axes: [],
    version: "7",
    lastModified: "2026-06-10",
    dateAdded: "2026-06-10",
    designers: [],
    description: null,
    license: { type: "OFL-1.1" },
    source: { kind: "custom", type: "webRelease" },
    ...overrides,
  };
}

// Numbered slices intentionally scrambled in the array (the generator must
// sort them numerically); named subsets in catalog order, which is
// deliberately not alphabetical (an alphabetical sort would reorder them).
function cjkShards(weight, style = "normal") {
  return [
    { id: "21", unicodeRange: "U+9F83-9F85", weight, style },
    { id: "4", unicodeRange: "U+1F21A, U+1F232", weight, style },
    { id: "119", unicodeRange: "U+4E00-9FFF", weight, style },
    { id: "5", unicodeRange: "U+FF03-FF04", weight, style },
    { id: "cyrillic", unicodeRange: "U+0400-045F", weight, style },
    {
      id: "vietnamese",
      unicodeRange: "U+0102-0103, U+1EA0-1EF9",
      weight,
      style,
    },
    { id: "latin-ext", unicodeRange: "U+0100-02BA", weight, style },
    { id: "latin", unicodeRange: "U+0000-00FF", weight, style },
  ];
}

const orderedIds = [
  "4",
  "5",
  "21",
  "119",
  "cyrillic",
  "vietnamese",
  "latin-ext",
  "latin",
];

function css2Request(query) {
  return parseCssApiRequest(new URL(`https://fonts-api.example/css2?${query}`));
}

function generate(font, familyRequest, options = {}) {
  return generateCustomCss(familyRequest, font, {
    display: "swap",
    staticBaseUrl: "https://static.example",
    text: null,
    ...options,
  });
}

function shardIds(css) {
  return [...css.matchAll(/\.([A-Za-z0-9-]+)\.woff2\)/g)].map(
    (match) => match[1],
  );
}

function comments(css) {
  return [...css.matchAll(/\/\* ([^*]+) \*\//g)].map((match) => match[1]);
}

function fontWeights(css) {
  return [...css.matchAll(/font-weight: ([^;]+);/g)].map((match) => match[1]);
}

// ---------------------------------------------------------------------------
// parseCssApiRequest

test("parses css2 families, axis tuples, display and text", () => {
  const request = parseCssApiRequest(
    new URL(
      "https://fonts-api.example/css2?family=LXGW+WenKai:wght@300;400;700" +
        "&family=Noto+Serif+SC:ital,wght@0,400;1,600&display=swap&text=%E4%BD%A0%E5%A5%BD",
    ),
  );
  assert.equal(request.endpoint, "/css2");
  assert.equal(request.display, "swap");
  assert.equal(request.text, "你好");
  assert.deepEqual(request.families, [
    {
      raw: "LXGW WenKai:wght@300;400;700",
      family: "LXGW WenKai",
      axes: ["wght"],
      tuples: [["300"], ["400"], ["700"]],
      legacyVariants: [],
    },
    {
      raw: "Noto Serif SC:ital,wght@0,400;1,600",
      family: "Noto Serif SC",
      axes: ["ital", "wght"],
      tuples: [
        ["0", "400"],
        ["1", "600"],
      ],
      legacyVariants: [],
    },
  ]);
});

test("parses a plain css2 family and rejects invalid display values", () => {
  const request = css2Request("family=Test+Sans+SC&display=banana");
  assert.equal(request.display, null);
  assert.equal(request.text, null);
  assert.deepEqual(request.families, [
    {
      raw: "Test Sans SC",
      family: "Test Sans SC",
      axes: [],
      tuples: [],
      legacyVariants: [],
    },
  ]);
});

test("parses css (v1) pipe-separated families with legacy variants", () => {
  const request = parseCssApiRequest(
    new URL(
      "https://fonts-api.example/css?family=LXGW+WenKai:400,700italic|WQY+Microhei&subset=chinese-simplified",
    ),
  );
  assert.equal(request.endpoint, "/css");
  assert.deepEqual(request.families, [
    {
      raw: "LXGW WenKai:400,700italic",
      family: "LXGW WenKai",
      axes: [],
      tuples: [],
      legacyVariants: ["400", "700italic"],
    },
    {
      raw: "WQY Microhei",
      family: "WQY Microhei",
      axes: [],
      tuples: [],
      legacyVariants: [],
    },
  ]);
});

// ---------------------------------------------------------------------------
// generateCustomCss: Google CJK ordering

test("orders each weight group as numbered slices ascending then named subsets in catalog order", () => {
  const font = makeFont({
    weights: ["400", "700"],
    shards: [...cjkShards("400"), ...cjkShards("700")],
  });
  const [familyRequest] = css2Request(
    "family=Test+Sans+SC:wght@400;700",
  ).families;
  const css = generate(font, familyRequest);

  assert.deepEqual(shardIds(css), [...orderedIds, ...orderedIds]);
  assert.deepEqual(fontWeights(css), [
    ...Array(8).fill("400"),
    ...Array(8).fill("700"),
  ]);
  // Only named subsets carry comments, in catalog order, once per group.
  assert.deepEqual(comments(css), [
    "cyrillic",
    "vietnamese",
    "latin-ext",
    "latin",
    "cyrillic",
    "vietnamese",
    "latin-ext",
    "latin",
  ]);
});

test("emits weight groups in requested order", () => {
  const font = makeFont({
    weights: ["400", "700"],
    shards: [...cjkShards("400"), ...cjkShards("700")],
  });
  const [familyRequest] = css2Request(
    "family=Test+Sans+SC:wght@700;400",
  ).families;
  const css = generate(font, familyRequest);
  assert.deepEqual(fontWeights(css), [
    ...Array(8).fill("700"),
    ...Array(8).fill("400"),
  ]);
  assert.deepEqual(shardIds(css), [...orderedIds, ...orderedIds]);
});

test("interleaves italic tuples in requested order", () => {
  const font = makeFont({
    weights: ["400"],
    styles: ["normal", "italic"],
    shards: [...cjkShards("400", "normal"), ...cjkShards("400", "italic")],
  });
  const [familyRequest] = css2Request(
    "family=Test+Sans+SC:ital,wght@0,400;1,400",
  ).families;
  const css = generate(font, familyRequest);
  const styles = [...css.matchAll(/font-style: (\w+);/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(styles, [
    ...Array(8).fill("normal"),
    ...Array(8).fill("italic"),
  ]);
  assert.deepEqual(shardIds(css), [...orderedIds, ...orderedIds]);
});

test("matches Google's block format exactly (golden)", () => {
  const font = makeFont({
    shards: [
      {
        id: "4",
        unicodeRange: "U+1F21A, U+1F232",
        weight: "400",
        style: "normal",
      },
      {
        id: "latin",
        unicodeRange: "U+0000-00FF",
        weight: "400",
        style: "normal",
      },
    ],
  });
  const request = css2Request("family=Test+Sans+SC&display=swap");
  const css = generate(font, request.families[0], { display: request.display });
  assert.equal(
    css,
    [
      "@font-face {",
      "  font-family: 'Test Sans SC';",
      "  font-style: normal;",
      "  font-weight: 400;",
      "  font-display: swap;",
      "  src: url(https://static.example/s/test-sans-sc/v7/test-sans-sc-normal-400.4.woff2) format('woff2');",
      "  unicode-range: U+1F21A, U+1F232;",
      "}",
      "/* latin */",
      "@font-face {",
      "  font-family: 'Test Sans SC';",
      "  font-style: normal;",
      "  font-weight: 400;",
      "  font-display: swap;",
      "  src: url(https://static.example/s/test-sans-sc/v7/test-sans-sc-normal-400.latin.woff2) format('woff2');",
      "  unicode-range: U+0000-00FF;",
      "}",
    ].join("\n"),
  );
});

test("omits the font-display line when no display parameter is given", () => {
  const font = makeFont({ shards: cjkShards("400") });
  const [familyRequest] = css2Request("family=Test+Sans+SC").families;
  const css = generate(font, familyRequest, { display: null });
  assert.ok(!css.includes("font-display"));
  assert.equal(css.match(/@font-face \{/g).length, 8);
});

// ---------------------------------------------------------------------------
// generateCustomCss: variant resolution

test("defaults to weight 400 normal when no axes are requested", () => {
  const font = makeFont({
    weights: ["300", "400", "500"],
    shards: [...cjkShards("300"), ...cjkShards("400"), ...cjkShards("500")],
  });
  const [familyRequest] = css2Request("family=Test+Sans+SC").families;
  const css = generate(font, familyRequest);
  assert.deepEqual(fontWeights(css), Array(8).fill("400"));
});

test("falls back to the closest available weight", () => {
  const font = makeFont({
    weights: ["300", "400", "500"],
    shards: [...cjkShards("300"), ...cjkShards("400"), ...cjkShards("500")],
  });
  const [familyRequest] = css2Request("family=Test+Sans+SC:wght@700").families;
  const css = generate(font, familyRequest);
  assert.deepEqual(fontWeights(css), Array(8).fill("500"));
});

test("deduplicates tuples that resolve to the same variant", () => {
  const font = makeFont({ shards: cjkShards("400") });
  const [familyRequest] = css2Request(
    "family=Test+Sans+SC:ital,wght@0,400;1,400",
  ).families;
  const css = generate(font, familyRequest);
  // The italic tuple falls back to the only style (normal) and collapses
  // into the already-emitted normal/400 group.
  assert.equal(css.match(/@font-face \{/g).length, 8);
  assert.ok(!css.includes("font-style: italic;"));
});

test("resolves css (v1) legacy variants", () => {
  const font = makeFont({
    weights: ["300", "400", "700"],
    styles: ["normal", "italic"],
    shards: [
      ...cjkShards("300"),
      ...cjkShards("400"),
      ...cjkShards("700"),
      ...cjkShards("700", "italic"),
    ],
  });
  const request = parseCssApiRequest(
    new URL(
      "https://fonts-api.example/css?family=Test+Sans+SC:300,700italic,bold",
    ),
  );
  const css = generate(font, request.families[0]);
  const groups = [
    ...css.matchAll(/font-style: (\w+);\n {2}font-weight: (\d+);/g),
  ].map((match) => `${match[2]} ${match[1]}`);
  assert.deepEqual(
    groups.filter((value, i) => i % 8 === 0),
    ["300 normal", "700 italic", "700 normal"],
  );
});

test("serves variable weight ranges and discrete weights within them", () => {
  const font = makeFont({
    weights: ["100..900"],
    shards: [
      {
        id: "4",
        unicodeRange: "U+1F21A",
        weight: "100..900",
        style: "normal",
      },
      {
        id: "latin",
        unicodeRange: "U+0000-00FF",
        weight: "100..900",
        style: "normal",
      },
    ],
  });

  const range = generate(
    font,
    css2Request("family=Test+Sans+SC:wght@100..900").families[0],
  );
  assert.deepEqual(fontWeights(range), ["100 900", "100 900"]);
  assert.ok(
    range.includes("/s/test-sans-sc/v7/test-sans-sc-normal-100..900.4.woff2"),
  );

  const discrete = generate(
    font,
    css2Request("family=Test+Sans+SC:wght@250").families[0],
  );
  assert.deepEqual(fontWeights(discrete), ["250", "250"]);
  assert.ok(
    discrete.includes(
      "/s/test-sans-sc/v7/test-sans-sc-normal-100..900.latin.woff2",
    ),
  );
});

test("returns no css for fonts whose shards are not materialized yet", () => {
  const font = makeFont({ shards: [] });
  const [familyRequest] = css2Request("family=Test+Sans+SC").families;
  assert.equal(generate(font, familyRequest), "");
});

// ---------------------------------------------------------------------------
// text= narrowing

test("narrows unicode ranges to the requested text and drops unused shards", () => {
  const font = makeFont({ shards: cjkShards("400") });
  const [familyRequest] = css2Request("family=Test+Sans+SC").families;
  const css = generate(font, familyRequest, { text: "BA你" });
  assert.deepEqual(shardIds(css), ["119", "latin"]);
  assert.ok(css.includes("unicode-range: U+4F60;"));
  assert.ok(css.includes("unicode-range: U+41, U+42;"));
});

// ---------------------------------------------------------------------------
// Upstream helpers

test("rewrites gstatic urls to the static host", () => {
  const css =
    "src: url(https://fonts.gstatic.com/s/roboto/v49/abc.woff2) format('woff2');";
  assert.equal(
    rewriteGstaticUrls(css, "https://fonts-static.example"),
    "src: url(https://fonts-static.example/gstatic/s/roboto/v49/abc.woff2) format('woff2');",
  );
});

test("builds upstream Google css urls preserving shared parameters", () => {
  const source = new URL(
    "https://fonts-api.example/css2?family=Roboto:wght@400;700&family=Lato&display=swap&text=hi&subset=latin&effect=shadow",
  );
  const [roboto] = parseCssApiRequest(source).families;
  assert.equal(
    googleCssUrl("/css2", roboto, source),
    "https://fonts.googleapis.com/css2?family=Roboto%3Awght%40400%3B700&display=swap&text=hi&subset=latin&effect=shadow",
  );
});

// ---------------------------------------------------------------------------
// Worker end-to-end (uses the real generated catalog, no network)

const workerEnv = {
  API_HOST: "fonts-api.example",
  STATIC_HOST: "fonts-static.example",
  STATIC_BASE_URL: "https://fonts-static.example",
};

test("serves Google-shaped css2 for a materialized catalog family", async () => {
  const font = findCustomFamily("LXGW WenKai Screen");
  assert.ok(font, "expected LXGW WenKai Screen in the generated catalog");
  assert.ok(font.shards.length > 0, "expected materialized shards");

  const response = await worker.fetch(
    new Request(
      "https://fonts-api.example/css2?family=LXGW+WenKai+Screen&display=swap",
    ),
    workerEnv,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/css/);

  const css = await response.text();
  assert.equal(css.match(/@font-face \{/g).length, font.shards.length);
  // First block is a numbered slice: no leading comment.
  assert.ok(css.startsWith("@font-face {"));
  assert.ok(
    css.includes(
      "url(https://fonts-static.example/s/lxgw-wenkai-screen/vlatest/lxgw-wenkai-screen-normal-400.4.woff2)",
    ),
  );

  // Numbered slices ascend; named subsets follow in catalog order, then the
  // overflow chunks.
  const ids = shardIds(css);
  const numbered = ids.filter((id) => /^\d+$/.test(id)).map(Number);
  assert.deepEqual(
    numbered,
    [...numbered].sort((a, b) => a - b),
  );
  assert.equal(ids.length, font.shards.length);
  const tail = ids.slice(numbered.length);
  assert.deepEqual(tail.slice(0, 4), [
    "cyrillic",
    "vietnamese",
    "latin-ext",
    "latin",
  ]);
  assert.ok(tail.slice(4).every((id) => id.startsWith("ext-")));

  // Every src points at our static host with the assetUrl() addressing.
  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((match) => match[1]);
  assert.equal(urls.length, font.shards.length);
  for (const url of urls) {
    assert.ok(
      url.startsWith(
        "https://fonts-static.example/s/lxgw-wenkai-screen/vlatest/",
      ),
      `unexpected asset url: ${url}`,
    );
  }
  assert.ok(
    urls.includes(assetUrl(font, font.shards[0], workerEnv.STATIC_BASE_URL)),
  );
});

test("serves empty css for a catalog family without materialized shards", async () => {
  const response = await worker.fetch(
    new Request("https://fonts-api.example/css2?family=LXGW+WenKai"),
    workerEnv,
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/css/);
  assert.equal(await response.text(), "");
});

test("serves )]}'-prefixed detail metadata for custom families", async () => {
  const response = await worker.fetch(
    new Request(
      "https://fonts-api.example/metadata/fonts/LXGW%20WenKai%20Screen",
    ),
    workerEnv,
  );
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(body.startsWith(")]}'\n"));
  const payload = JSON.parse(body.slice(5));
  assert.equal(payload.family, "LXGW WenKai Screen");
  assert.equal(payload.primaryScript, "Hans");
});

test("rejects css requests without any family", async () => {
  const response = await worker.fetch(
    new Request("https://fonts-api.example/css2"),
    workerEnv,
  );
  assert.equal(response.status, 400);
  assert.match(response.headers.get("content-type"), /text\/html/);
});

// ---------------------------------------------------------------------------

let failures = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(error);
  }
}

if (failures) {
  console.error(`\n${failures}/${tests.length} tests failed.`);
  process.exit(1);
}
console.log(`\nAll ${tests.length} tests passed.`);
