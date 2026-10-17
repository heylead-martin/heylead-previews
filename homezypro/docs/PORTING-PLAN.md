# HomezyPro porting plan (roster → Astro)

Source of truth: `roster/` on main 61c0b7e (read only). Target: `homezypro/`, an Astro 5.18.2 static site
(no adapter, Cloudflare Pages). Paths are roster's minus the `/roster` prefix. Brand is HomezyPro;
Singapore is the active market (`src/config/markets.mjs`, `us`/`au` are unbuilt placeholders).

## Approach

Roster is one generator (`build.mjs`, 1,500 lines) over ~40 small modules. Rather than rewrite them,
HomezyPro reuses them:

- `scripts/dev/port-from-roster.mjs` copies roster's `lib/`, `assets/*.mjs|js|css`, `content/`,
  reference data and unit tests into `src/lib/port/` and `public/assets/`, rewriting `/roster/` paths to
  root paths and "Roster" to "HomezyPro". Account/Supabase code is not copied.
- `src/lib/render.mjs` is roster's `build.mjs` turned into a module: same page renderers and guards, but
  `pageShell` returns a page object and `src/layouts/Base.astro` + `src/components/SeoHead.astro` render
  the document head, nav and footer. Astro routes call `homePage()`, `hubPage(trade)`, `companyPage(c)`.
- Rendered `<main>` output is byte-identical to roster for 734 of 742 comparable pages after the
  path/brand rewrite. The 8 differences: 6 profiles whose SVG logo roster rasterised by hand with
  Playwright (HomezyPro serves the sanitised SVG), and the two hubs that list them (index hash).

Once all route families are ported, `src/lib/port/` becomes HomezyPro's own code (the port script is
for the initial copy; re-running it overwrites ported files, except `lib/site-config.mjs`).

## Inventory of roster's built pages (955 `index.html`)

Counted from roster's built `index.html` files, classified by template.

| Page type | Roster URL pattern | Count | Template (roster) | HomezyPro route | Round |
|---|---|---:|---|---|---|
| Home | `/roster/` | 1 | `renderHome` + `lib/home-snapshot.mjs` (map, trade filters, price samples), `guideCards` | `src/pages/index.astro` → `/` | **1 (built)** |
| Trade hubs | `/roster/{aircon-servicing,plumbing,electrician,handyman,home-cleaning}/` | 5 | `renderCollection` (shortlist cards, compact list, filters, quick picks, licence lookups, best-of teaser, areas we serve, hub blog) | `src/pages/[hub]/index.astro` | **1 (built)** |
| Company profiles | `/roster/company/{slug}/` | 738 | `lib/expanded.mjs` `createProfileRenderer` (full and compact layouts) + related links | `src/pages/company/[slug]/index.astro` | **1 (built)** |
| Directory indexes (JSON) | `/roster/data/index/{all,aircon,…,chemical-wash,gas-top-up}.json` | 8 files | `encodeCatalogue` | `src/pages/data/index/[name].json.ts` | **1 (built)** |
| robots.txt | `/roster/robots.txt` | 1 file | build.mjs | `src/pages/robots.txt.ts` (switch-driven) | **1 (built)** |
| Search (all companies) | `/roster/search/` | 1 | `renderCollection` (`id: all`) | `src/pages/search/index.astro` | 2 |
| Aircon intent directories | `/roster/aircon-servicing/{chemical-wash,gas-top-up}/` | 2 | `renderCollection` + `renderSourcedRates` | `src/pages/aircon-servicing/[intent]/` | 2 |
| Editorial guides | `/roster/{trade}/guide/`, `/roster/{trade-or-topic}/{topic}/` (e.g. `/aircon/leaking-water/`) | 47 | `renderGuidePage` + `lib/editorial.mjs`, `content/guides/*.md`, aircon size matrix (units matrix hidden) | `src/pages/[...guide].astro` from `loadGuides` | 2 |
| How it works | `/roster/how-it-works/` | 1 | `renderHow` + `content/how-it-works.md` | `src/pages/how-it-works/` | 2 |
| Symptom finder | `/roster/what-service-do-i-need/` | 1 | `renderSymptomFinder` | `src/pages/what-service-do-i-need/` | 2 |
| Town (area) pages | `/roster/{trade-slug}/{town}/` | 109 | `renderAreaPage` + `lib/area-pages.mjs` selection rule | `src/pages/[hub]/[town]/` from `selectAreaPages` | 3 |
| Best-of rankings | `/roster/{trade-slug}/best/` | 5 | `renderBestOf` + `lib/best-of.mjs` (Google rating only; only pages allowed to say "best") | `src/pages/[hub]/best/` | 3 |
| Blog index | `/roster/blog/` | 1 | `renderBlogIndex` | `src/pages/blog/index.astro` | 3 |
| Blog posts | `/roster/blog/{slug}/` | 25 | `renderBlogPost` + `lib/blog.mjs`, `content/blog/*.md` | `src/pages/blog/[slug].astro` | 3 |
| Claim listing (demo) | `/roster/claim-listing/` | 1 | `lib/claim-page.mjs` + `assets/claim.js` (inert demo form) | `src/pages/claim-listing/` (no form submission) | 3 |
| Logo removal | `/roster/logo-removal/` | 1 | inline in build.mjs (inbox pending) | `src/pages/logo-removal/` | 3 |
| Retired listings | `/roster/company/{old-slug}/` (meta refresh to hub) | 9 | inline `retired` list in build.mjs (incl. HEDIRCOOL, withheld in r15.1) | `src/pages/company/[slug]` retired variant, or Cloudflare `_redirects` 301s | 3 |
| 404 | `/roster/404.html` | 1 file | inline in build.mjs | `src/pages/404.astro` | 3 |
| Sitemaps | `/roster/sitemap.xml` + `sitemap-{core,best,guides,towns,blog,companies}.xml` | 7 files | `lib/sitemaps.mjs` | `src/pages/sitemap*.xml.ts` (from `SITE_URL`) | 3 |
| llms.txt / llms-full.txt | `/roster/llms*.txt` | 2 files | `lib/llms.mjs` | `src/pages/llms*.txt.ts` | 3 |
| Parked account pages | `/roster/{sign-in,sign-up,forgot-password,reset-password,account,auth/callback,saved,matches}/` | 8 | "connection pending" shells | **Omitted** (no Supabase/auth in HomezyPro) | n/a |

Check: 1 + 5 + 738 + 1 + 2 + 47 + 1 + 1 + 109 + 5 + 1 + 25 + 1 + 1 + 9 + 8 = 955.

Current HomezyPro build: 744 HTML pages (1 home, 5 hubs, 738 profiles) + 8 index JSON + robots.txt.
Links from built pages into not-yet-ported families are reported by `npm run check:site` as
"pending route families"; any broken link to a built family (company, hub, asset, logo) fails the check.

## Features and rules carried over (and where they live)

- Publication: roster's `import-db.mjs` unchanged (`src/lib/port/scripts/import-db.mjs`): blocking flags
  incl. `needs-human-review`, sourced phone/address/services/about/website required, slug registry.
  `scripts/import-data.mjs` adds pinned checksums and explicit needs-human-review guards.
- Ratings: Google-only headline (`assets/catalogue-card.mjs` `cardRating`, `lib/rating-summary.mjs`);
  other sources as separate sentences; no rating/review/offer schema (`forbidSchema`, pageShell guard,
  check-site, tests).
- Prices: card label "Example service price"; indicative lines never shown as company prices
  (`companyPrices` in render.mjs, `exampleLine` guard); condenser-cleaning excluded from general/chemical
  wash (`lib/sourced-rates.mjs` `eligible`); aircon units matrix hidden (`SHOW_UNITS_MATRIX = false`).
- Names: title-case display names (`lib/display-name.mjs`), source name kept as `sourceName`.
- Cards: ART OF CLEANING standard (`assets/editorial.css` card section, `catalogue-card.mjs`).
- No visible capture dates (`lib/no-dates.mjs`, applied in pageShell); dates stay in data/JSON-LD.
- "best" only on the five best-of pages (check-editorial on our copy, check-site on titles/H1s).
- Company JSON-LD: `HVACBusiness` / `Plumber` / `Electrician` / `HomeAndConstructionBusiness` /
  `LocalBusiness` (all LocalBusiness subtypes), name, telephone, url, address, sameAs, logo, UEN
  identifier, openingHours, areaServed. No FAQPage on company pages.
- Map pins: verified building pins only (`data/map-pins.json`, address hash check).

## Differences from roster (deliberate)

- Brand HomezyPro, new mark (`public/assets/favicon.svg`, `scripts/make-brand-images.py`); design
  tokens unchanged, brand layer in `public/assets/brand.css`.
- One config for URL and indexing (`src/config/site.mjs`): `SITE_URL` (default https://homezypro.com);
  indexable only when `SITE_INDEXABLE=true` and the host is homezypro.com. Otherwise every page is
  `noindex, nofollow, noarchive` and robots.txt is `Disallow: /`. Production robots: `Allow: /` +
  `Sitemap: https://homezypro.com/sitemap.xml` (the sitemap itself lands in round 3).
- No account, saved-list, quote or matching code (parked in roster; omitted here, not hidden).
- Release summaries are directory-generated sentences; "Roster found…" becomes "HomezyPro found…"
  at import (305 rows). Company excerpts are never edited.
- Logos are processed at import, not at build: WebP <= 256 px, <= 30 KB in `public/logos/` (499), and 20
  sanitised SVGs served as-is. Roster had rasterised 6 large SVGs with a one-off Playwright script;
  that step is not ported (see open items).
- Imported data lives in `src/data/`; originals of the logo bundle are not kept in the repo (the
  checksummed release bundle is the record).

## Open items

1. Six large SVG logos (largest 477 KB) are served as SVG; roster served Playwright-rasterised WebP.
   Options: port `rasterize-svg-logos.py` (needs Chromium) or rasterise with `resvg`.
2. Hub/footer/profile links into guides, towns, best-of, blog, search, how-it-works etc. resolve only
   once rounds 2–3 land (tracked by check-site as pending).
3. "About the business ·" leaves a trailing separator after the capture date is stripped (same on roster).
4. Retired-listing URLs: decide between meta-refresh pages (roster) and Cloudflare `_redirects` 301s.
