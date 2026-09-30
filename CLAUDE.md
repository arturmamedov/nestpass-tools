# CLAUDE.md: nestpass-tools

The tools page at `https://nestpass.ai/` and the shared top bar (`<nest-nav>`) that every Nests Hostels
tool loads from it. Read `README.md` first: it holds the contract the tools rely on and the deploy steps.

## Commands

```sh
npm test        # Playwright, hermetic: tests/fixtures.ts serves web/ as https://nestpass.ai/ and tests/hosts/ as https://tools.test/
npm run fonts   # re-copy web/fonts/ from the pinned @fontsource packages
```

## Where things live

- `web/kit/nest-nav.js`: the `TOOLS` and `APPS` registries plus the `<nest-nav>` custom element.
  - It is one classic script with no build.
  - **It is the only list of tools.** `hub.js` draws the cards from `window.NestTools`, and every
    tool's bar draws from the same list.
  - `APPS` (Analytics, wSuite) are for other people: only the tools page lists them, in their own
    row. The bar never reads them.
- `web/previews/`: app screenshots. The tools page is public, so they must not show real figures.
- `web/index.html`, `hub.css`, `hub.js`: the tools page.
- `tests/hosts/*.html`: stand-ins for the tools' pages, each with hostile CSS:
  - Flyers' generic class names and variables;
  - QR's `*` reset and element rules;
  - Newsletter's `--nest-*` variables.

## Non-negotiables

- **The bar is sealed.** Everything lives in its shadow root, with literal values only:
  - no custom properties (the page's `--nest-*` / `--night` would reach in);
  - no `@font-face`: a second Montserrat face would merge into the Flyers page and could change the
    flyer export;
  - no document listeners except while the menu is open;
  - it never modifies its light-DOM children or host attributes, because React owns them in Flyers.
- **Inherited properties cross the shadow boundary,** so `.bar` pins every one a page might set.
  `:host` holds only `display`, `position` and `z-index`: any page rule beats `:host`.
- **The bar is 54 px high.** Every tool's `nest-nav:not(:defined)` fallback copies that number;
  change it only together with every tool.
- **Montserrat 500/600 only in the bar,** never 700: QR doesn't load 700, and Chrome would fake the
  bold.
- **Keep it a classic script,** not a module: a module loaded cross-origin from the QR subdomain
  would need CORS.
- `tool` stays an observed attribute. Never add a getter-only `tool` property: React assigns to it.
- **Colour:** bright teal `#53CED1` is never text on cream; text teal is `#0D6F82`. No orange: the
  website reserves it for Book Now.
- **`web/robots.txt` turns away every crawler, AI ones by name** (the owner's call, 2026-09-28: nothing
  here is for search engines or LLMs).
  - It is the only one that counts on nestpass.ai, so it covers `/activities/`, `/newsletter/` and
    `/vanity/` too.
  - The page stays noindex as a second layer.
  - The same file ships with Flyers, Newsletter and QR; keep the copies identical.
- **No `.htaccess` at the root of `web/`.**

## Working here

- The owner's rule is SOLID and DRY, with one source of truth per fact: the registry, the fonts
  (generated from the pinned packages; `tests/hub.spec.ts` checks them), and the bar height (the
  `BAR_HEIGHT` test constant, the kit's CSS, and the README).
- Comments explain *why*.
- Work on a feature branch. Commit only when asked, and never push unasked.
