# HomezyPro porting plan (roster → Astro)

Source of truth: `roster/` on main 61c0b7e (read only). Target: `homezypro/`, an Astro 5.18.2 static site
(no adapter, Cloudflare Pages). Paths are roster's minus the `/roster` prefix. Brand is HomezyPro;
Singapore is the active market (`src/config/markets.mjs`, `us`/`au` are unbuilt placeholders).

Status after round 2: every public roster page family is built. The only roster pages not built are the
8 parked account pages (omitted: no Supabase/auth in HomezyPro).

## Approach

Roster is one generator (`build.mjs`, 1,500 lines) over ~40 small modules. Rather than rewrite them,
HomezyPro reuses them:

- `scripts/dev/port-from-roster.mjs` copies roster's `lib/`, `assets/*.mjs|js|css`, `content/`,
  reference data and unit tests into `src/lib/port/` and `public/assets/`, rewriting `/roster/` paths to
  root paths and "Roster" to "HomezyPro". It also generates `scripts/check-site-roster.mjs` from
  roster's `scripts/check-site.mjs`. Account/Supabase code is not copied.
- `src/lib/render.mjs` is roster's `build.mjs` turned into a module: same page renderers and guards, but
  `pageShell` returns a page object and `src/layouts/Base.astro` + `src/components/SeoHead.astro` render
  the document head, nav and footer.
- HomezyPro-owned files that a re-port never overwrites: `lib/site-config.mjs` (shim over
  `src/config/site.mjs`), `lib/no-dates.mjs` (separator fix), and all of `content/` once copied (two
  guide titles/descriptions were shortened after the rebrand). `render.mjs` is seeded once.
- `scripts/dev/compare-roster.mjs` diffs page counts per type and rendered `<main>` against roster.

### Parity with roster (round 2)

`<main>` is byte-identical to roster (after the path/brand rewrite) for 195 pages. Every other
difference is intended:

| Difference | Pages |
|---|---|
| "About the business ·" no longer leaves a stray separator after the date is stripped | 738 profiles |
| Directory index hashes (the 6 rasterised SVG logos now come from HomezyPro's own import) | 5 hubs, search, 2 intents |
| Heading anchors follow the brand (`#el-06-comparing-electricians-on-homezypro`) | 4 guides incl. how it works |
| Claim page is a static explanation (no demo form); logo-removal copy says "contact route" | 2 |

## Routes

| Page type | URL pattern | Roster | HomezyPro | Route |
|---|---|---:|---:|---|
| Home | `/` | 1 | 1 | `src/pages/index.astro` |
| Trade hubs | `/{aircon-servicing,plumbing,electrician,handyman,home-cleaning}/` | 5 | 5 | `src/pages/[hub]/index.astro` |
| Company profiles | `/company/{slug}/` | 738 (r15.1) | 745 (r15.2) | `src/pages/company/[slug]/index.astro` |
| Search (all companies, client JSON, trade-aware ranking) | `/search/` | 1 | 1 | `src/pages/[...path].astro` |
| Aircon intent directories | `/aircon-servicing/{chemical-wash,gas-top-up}/` | 2 | 2 | `[...path]` |
| Editorial guides (sourced rate tables, BTU matrix; units matrix hidden) | `/{trade}/guide/`, `/{topic}/{guide}/` | 47 | 47 | `[...path]` |
| How it works | `/how-it-works/` | 1 | 1 | `[...path]` |
| Symptom finder | `/what-service-do-i-need/` | 1 | 1 | `[...path]` |
| Town pages (URA adjacency for nearby towns) | `/{hub}/{town}/` | 109 | 111 (r15.2) | `[...path]` |
| Best-of rankings (formula, method box, ItemList + FAQPage) | `/{hub}/best/` | 5 | 5 | `[...path]` |
| Blog index + posts | `/blog/`, `/blog/{slug}/` | 26 | 26 | `[...path]` |
| Claim listing (static, no form) | `/claim-listing/` | 1 | 1 | `[...path]` |
| Logo removal (static, contact route pending) | `/logo-removal/` | 1 | 1 | `[...path]` |
| Retired listings | `/company/{old-slug}/` | 9 | 8 (city-cleaning is a plain 404 since r15.2) | 301 in `dist/_redirects` + noindex fallback via `[...path]` |
| 404 | `/404.html` | 1 file | 1 file | `src/pages/404.astro` (noindex, no canonical) |
| Directory indexes | `/data/index/{all,trade,intent}.json` | 8 | 8 | `src/pages/data/index/[name].json.ts` |
| Launch manifest | `/data/seo-launch-pages.json` | 1 | 1 | `src/pages/data/seo-launch-pages.json.ts` |
| Sitemaps | `/sitemap.xml` + `sitemap-{core,best,guides,towns,blog,companies}.xml` | 7 | 7 | `src/pages/sitemap*.xml.ts` |
| llms.txt / llms-full.txt | `/llms*.txt` | 2 | 2 | `src/pages/llms*.txt.ts` |
| robots.txt | `/robots.txt` | 1 | 1 | `src/pages/robots.txt.ts` (switch-driven) |
| Parked account pages | sign-in, sign-up, forgot/reset password, account, auth/callback, saved, matches | 8 | 0 | **Omitted** |

Totals: roster 955 `index.html` (r15.1); HomezyPro 955 `index.html` + `404.html` = 956 HTML pages (r15.2).

r15.2 (`companies-20261018-1004.json`): 745 published (aircon 231, plumbing 101, electrician 116, handyman 100,
home-cleaning 197). Billy Aircon passes the full bar but stays retired (`KEEP_RETIRED`, reason `kept-retired`).
201823211K stays withheld (needs-human-review); its slugs `city-cleaning` and `direct-painters-plastering` are
reserved, never published, and 404 with no stub page or redirect (`NEVER_PUBLISH_SLUGS`). The new
`lead-gen-network-site` flag is informational; those six rows stay withheld by `no-sg-postal-code`.
`address.kind` is carried through the import: an ACRA registered address (`registered`, 6 profiles) is
labelled "Registered address" with no visiting wording, map or look-up link, and is left out of the
PostalAddress/hasMap structured data; `premises` addresses render as before.

One catch-all route serves every family except home, hubs and profiles, because guides and town pages
share the `/{hub}/{x}/` shape; `otherPages` in `render.mjs` maps each path to its renderer.

## Checks

- `npm test`: HomezyPro tests (`tests/`) + 13 of roster's unit test files (`src/lib/port/scripts/`).
  Not ported: account-*, quote-contact, job-match (parked features), pages-artifact (GitHub Pages);
  roster's built-page description test moved into check-site. Some ported tests read `dist/`, so
  run `npm run build` first.
- `npm run check:site`: `scripts/check-site.mjs` (switch, brand, per-type counts vs roster, redirects,
  links, cards, schema, logos) and `scripts/check-site-roster.mjs` (roster's full page-family checks:
  rate tables vs release, area page rule and nearby links, best-of ranking and method box, matrices,
  sitemaps, llms, fragments, profiles, indexes and budgets).
- `npm run check:editorial`: own-copy rules plus roster's guide and blog page checks.

## Decisions carried out

- SVG logos over 30 KB: `scripts/dev/rasterize-svg-logos.py` (Python Playwright + /usr/bin/google-chrome)
  renders WebP copies; `src/data/svg-rasters.json` records each SVG's sha256 and the import keeps the
  raster only while that matches. Same 6 logos as roster.
- Stray separator fixed in `lib/no-dates.mjs`; check-site fails on any `· </p>`-style leftover.
- Company contact emails are shown exactly where roster shows them publicly (profile contact facts).
- Retired listings: Cloudflare `_redirects` 301s (both `/company/x/` and `/company/x`), with a noindex,
  meta-refresh HTML fallback for hosts without redirect support. Not in the sitemap.

## Round 3: brand, SEO/AEO and Cloudflare

- New brand (house + check mark, Fraunces wordmark as outlines) replaces roster's mark; assets and
  generator documented in the README. Header and footer inline the logo.
- JSON-LD additions over roster: WebSite SearchAction, BreadcrumbList + WebPage on claim-listing and
  logo-removal (roster had none there). check-site now validates JSON-LD structure per page type.
- Image sitemap (`sitemap-images.xml`) added to the index.
- Indexing switch also requires the production branch on Cloudflare builds; `_headers` noindexes
  `*.pages.dev`. `_headers` carries security headers, a strict CSP (verified in Chrome with
  `scripts/dev/browser-smoke.py`) and cache rules; `_redirects` adds `/roster/*` → `/:splat`.

## Open items

1. The ported `check-site-roster.mjs` is regenerated from roster; if HomezyPro's templates diverge on
   purpose, move the affected assertions into `scripts/check-site.mjs` and stop regenerating it.
2. Logo removal and claims have no contact route yet (by design; no inbox or mailto).
