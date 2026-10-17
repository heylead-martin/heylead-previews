# HomezyPro

Static Astro site (Cloudflare Pages) for sourced home-service directories. Singapore is the first
market. Ported from `roster/` (the reference implementation): see [docs/PORTING-PLAN.md](docs/PORTING-PLAN.md).

## Commands (from `homezypro/`, Node 20.3+)

```sh
npm ci
npm run import:data      # verify + import the pinned r15.1 release (only when the data changes)
npm run build            # dist/
npm test                 # HomezyPro tests + roster's ported unit tests
npm run check:site       # checks dist/ (run after build)
npm run check:editorial  # checks our own copy (and built guide pages, once ported)
npm run dev | preview
```

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
