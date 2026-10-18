# HomezyPro

Static Astro site (Cloudflare Pages) for sourced home-service directories. Singapore is the first
market. Ported from `roster/` (the reference implementation): see [docs/PORTING-PLAN.md](docs/PORTING-PLAN.md).

## Commands (from `homezypro/`, Node 20.3+)

```sh
npm ci
npm run import:data      # verify + import the pinned r15.1 release (only when the data changes)
npm run build            # dist/ (948 HTML pages, sitemaps, llms.txt, _redirects)
npm test                 # HomezyPro tests + roster's ported unit tests (some read dist/: build first)
npm run check:site       # HomezyPro checks + roster's ported check-site, on dist/
npm run check:editorial  # our own copy + guide and blog page checks, on dist/
npm run dev | preview
```

Dev scripts (not part of the build): `python3 scripts/dev/rasterize-svg-logos.py` renders SVG logos
over 30 KB to WebP with Python Playwright and /usr/bin/google-chrome (commit `public/logos/` and
`src/data/svg-rasters.json`); `node scripts/dev/compare-roster.mjs` compares page counts and output
with roster's built pages; `node scripts/dev/port-from-roster.mjs` re-copies roster modules and
regenerates `scripts/check-site-roster.mjs`.

Retired listings are 301s in `dist/_redirects` (Cloudflare Pages), with noindex HTML fallbacks.

`import:data` reads `companies-20261018-0125.json` and `logos-20261018-0059.tar.gz` from
`HOMEZYPRO_RELEASE_DIR` (default `/workspace/roster-release`, read only), checks both against their
`.sha256` files and the checksums pinned in `scripts/import-data.mjs`, applies roster's publication rules
(including the `needs-human-review` withhold) and writes `src/data/*.json` and `public/logos/`. It needs
Python 3 with Pillow for logos. The build itself needs only Node.

## Site URL and indexing

One config: `src/config/site.mjs`.

- `SITE_URL` (default `https://homezypro.com`) drives canonicals, og:url, JSON-LD ids and robots.txt.
- Indexing is on only when `SITE_INDEXABLE=true` **and** `SITE_URL` is on `homezypro.com`. Otherwise
  every page is `noindex, nofollow, noarchive` and `robots.txt` disallows everything (the default).
- Production (`SITE_INDEXABLE=true`): `index, follow` (utility pages `noindex, follow`), and robots.txt
  `Allow: /` with `Sitemap: https://homezypro.com/sitemap.xml`.

## Layout

- `src/config/` site and market config (`markets.mjs`: `sg` active; `us`, `au` placeholders, not built).
- `src/lib/render.mjs` page renderers (ported from roster `build.mjs`); `src/lib/port/` roster's modules,
  content and reference data. `src/layouts/Base.astro`, `src/components/SeoHead.astro` document shell.
- `src/pages/` routes; `src/data/` imported release data (generated, committed); `public/assets/` CSS,
  client JS, brand and hero images; `public/logos/` served logos (generated, committed).

## Content rules

Facts only from sources. Google-only headline ratings and no rating/review/offer structured data.
"Best" only on the five best-of pages. No visible capture dates. Indicative prices are never shown as a
company's price; condenser cleaning is not general servicing or a chemical wash; the aircon units matrix
stays hidden. Accounts, saved lists and quote requests (parked in roster) are not part of HomezyPro.
