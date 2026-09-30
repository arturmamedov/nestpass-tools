# nestpass-tools

The Nests Hostels tools page at **https://nestpass.ai/**, and the top bar every tool shares.

- `web/` is exactly what is uploaded to the `nestpass.ai` domain root.
- `web/kit/nest-nav.js` is the single source of truth. It holds:
  - **the list of tools** (`TOOLS`), which the bar and the tools page both draw from;
  - **the list of apps** (`APPS`): the Nests apps beyond the staff tools, which only the tools page
    lists, in their own "More from Nests" row;
  - **the `<nest-nav>` element**: the bar, taken from the Flyers editor's top bar.
- Every tool loads that one file from here. Adding a tool, or moving one to a new address, is one
  edit in `TOOLS` and one upload. No tool has to be redeployed.

```
web/index.html, hub.css, hub.js   the tools page (public, noindex)
web/links.json                    the tools page's quick links and social links
web/kit/nest-nav.js               the registry + the bar
web/kit/nest-logo-white.png       the website's logo-full-white.png
web/kit/.htaccess                 Cache-Control for kit/ only
web/fonts/                        Montserrat 500/600/700 + Archivo Black, copied by `npm run fonts`
web/previews/                     screenshots for the apps' cards (public: no real figures)
tests/                            Playwright: the bar on hostile host pages, and the tools page
```

## The contract: putting the bar in a tool

1. **Load the script and add the element.**

   ```html
   <head>
     …
     <script async src="https://nestpass.ai/kit/nest-nav.js"></script>
   </head>
   <body>
     <nest-nav tool="flyers">
       <a slot="fallback" class="brand" href="./">Flyers</a>   <!-- only while the bar isn't defined -->
       <nav aria-label="Flyers">…the tool's own links and buttons…</nav>
     </nest-nav>
   ```

   - Use **`async`**, in `<head>`. A slow or unreachable nestpass.ai must never delay the tool.
     (`defer` would hold back DOMContentLoaded.)

2. **Set `tool` to a registry id:** `flyers`, `newsletter`, `qr`, or `vanity`.
   - That tool's link becomes the teal pill, with `aria-current="page"`.
   - Leave `tool` off, or give an unknown id, and nothing is highlighted. That is how the tools page
     uses it.

3. **Put the tool's own actions in the default slot.**
   - They sit on the right of the bar.
   - They inherit the bar's font (Montserrat 600, 13 px) and its white text. They are styled by the
     tool's own CSS, because page rules do reach slotted children.
   - Keep them compact. Below 900 px the tool links fold into a `FLYERS ▾` menu. Below 720 px the
     logo also drops to 26 px.
   - At 900 px there is room for four tool links beside three actions (QR's Dashboard, "+ New QR
     code" and Sign out).
   - On a 360 px phone that leaves about 170 px for the actions: two of them, e.g. Flyers'
     "Library" + "New flyer" with a 12 px gap. Use short labels for a third.

4. **Children with `slot="fallback"` are the tool's own brand.**
   - They show only while the element is undefined: before the script has run, or when nestpass.ai
     can't be reached.
   - Style that state with `nest-nav:not(:defined)`: **54 px high**, night `#083344`,
     `box-sizing: border-box`.
   - At the same height the upgrade swaps content without moving the page.

   ```css
   nest-nav:not(:defined) { display: flex; align-items: center; box-sizing: border-box;
     height: 54px; padding: 0 20px; background: #083344; color: #fff; }
   ```

5. **The bar is sealed in a shadow root.**
   - It uses literal values: no custom properties and no `@font-face`.
   - It changes no document styles, no fonts, and none of the element's own children or attributes
     (`tests/nav.spec.ts` proves this).
   - It relies on the page having loaded Montserrat, which every tool does. Without Montserrat it
     falls back to the system UI font.

## Adding a tool

1. Add an entry to `TOOLS` in `web/kit/nest-nav.js`:
   - `id`, `name`, an absolute `https://` `href`, a one-line `blurb`, and a 24×24 stroke `icon`;
   - in bar order;
   - `bar: false` for a tool that only gets a card on the tools page and stays out of the bar
     (e.g. Occupancy, a dashboard people look at rather than a tool they switch between).
2. Run `npm test`. `tests/nav.spec.ts` lists the expected ids, so update it there too.
3. Upload `web/kit/nest-nav.js`. Within about five minutes every tool's bar and the tools page show
   the new tool.
4. In the new tool: follow the contract above.

When QR moves to `qr.nestpass.ai`, change its `href` and upload. That is the whole change.

## Adding an app

An app is a Nests product for other people or another job (Nests Analytics, the wSuite chatbot).
It gets a night card in the tools page's "More from Nests" row and stays out of the bar.

1. Add an entry to `APPS` in `web/kit/nest-nav.js`: the same fields as a tool.
2. Optionally, give it a preview:
   - Put a screenshot in `web/previews/`, e.g. `analytics.webp`, about 1200 px wide.
   - Set `preview: 'previews/analytics.webp'` on the entry.
   - The card shows the image's top-left corner, 180 px high.
   - Without a preview the card shows the app's icon on the teal gradient.
   - **The tools page is public.** A screenshot must show demo figures, or have them blurred.
3. Run `npm test`. `tests/hub.spec.ts` lists the expected app ids.
4. Upload `web/kit/nest-nav.js`, plus the preview if there is one.

## Adding a quick link

The "Quick links" section (the team's Drive folders and Notion dashboards) and the footer's social
links come from `web/links.json`. Only the tools page reads it, so it stays out of the kit.

1. Add `{ "name", "href", "note" }` to a group's `links`, or add a group (`id`, `name`, `links`).
   - `note` is optional: one line saying what's inside.
   - The icon and the "GOOGLE DRIVE" / "NOTION" label follow from the address. To pick another
     icon, set `"type"`: `drive`, `notion`, `docs`, `design` or `link` (the icons are in `hub.js`).
2. Upload `web/links.json`. No test changes: `tests/hub.spec.ts` reads the same file.

- **The tools page is public**, so anyone with its address sees these links. The Drive folders and
  `app.notion.com` pages still need a login; `*.notion.site` pages are published to the web and do
  not.
- Quick links and socials open in a new tab; the tool cards keep the tab.
- If `links.json` fails to load, the section and the social links stay hidden and the tools still
  show.

## Develop

```sh
npm install
npm test          # Playwright; no server, no network: tests/fixtures.ts answers the URLs from this checkout
npm run fonts     # after bumping an @fontsource version: re-copy web/fonts/
```

- **To look at it:** serve `web/` with any static server, e.g. `php -S 127.0.0.1:8090 -t web`, then
  open `http://127.0.0.1:8090/`.
  - The kit links its logo to the hub it was loaded from, so a local copy links to itself.
  - The tools themselves always point at production.
- **Before calling a change done:**
  - `npm test` green;
  - look at the page and a tool's bar in Chrome at 1440 px and 375 px.

## Deploy (IONOS, the nestpass.ai web space)

**Before the first upload:**
- `nestpass.ai` needs a working SSL certificate (IONOS → Domains & SSL). QR is served over https, so
  it can only load the kit from an `https://` address. Check that
  `https://nestpass.ai/activities/` and `https://nestpass.ai/newsletter/` open.
- Look at the domain's root folder over SFTP. Today it holds `activities/` and `newsletter/`; if
  there is already an `index.html` or a `.htaccess`, keep a copy before replacing anything.
- The tools page is public. Every tool it links to must already be behind its own lock
  (Flyers: the Basic-auth rule in its `docs/deploy.md`).

**Upload:**
1. Copy the **contents** of `web/` into the domain root: `index.html`, `hub.css`, `hub.js`,
   `robots.txt`, `kit/`, `fonts/`, and `previews/` once it exists.
   - `robots.txt` asks every crawler, search and AI alike, to stay off the whole of nestpass.ai.
     That includes `/activities/`, `/newsletter/` and `/vanity/`: crawlers read robots.txt only at
     a domain's root.
2. **Never add a `.htaccess` to the domain root.** Its `Header`/`Options`/rewrite lines would apply
   to `/activities/` and `/newsletter/` too. Only `kit/.htaccess` belongs here.
3. **Never put `kit/` behind a password.** The QR tool, on another origin, can't load it through one.

**Check:**

```sh
curl -I https://nestpass.ai/                  # 200
curl https://nestpass.ai/robots.txt           # User-agent: * / Disallow: /
curl -I https://nestpass.ai/kit/nest-nav.js   # 200, JavaScript, Cache-Control: max-age=300, stale-while-revalidate=86400
curl -I https://nestpass.ai/activities/       # unchanged: the same headers as before the upload
```

Then open each tool and follow the bar's links from one to another.

## Why it is built this way

- **One hosted file rather than a copy in each repo.**
  - One upload updates every tool; copies would drift.
  - An npm package can't reach the two tools that have no build step.
- **The cost:** the kit runs with full script access inside every tool's page, including QR's
  signed-in session.
  - Pinning it with Subresource Integrity would undo "one upload updates all", so it isn't pinned.
  - What protects it is the IONOS SFTP account: keep those credentials to the owner.
- **`robots.txt` turns every crawler away, and the pages still say noindex.**
  - Staying unread wins over the one thing a Disallow costs: a crawler that obeys it never sees the
    noindex. A search engine may then list a bare address it found linked elsewhere, with no
    content.
  - robots.txt is a request, not a lock. Crawlers that ignore it are stopped only by each tool's
    own login.
