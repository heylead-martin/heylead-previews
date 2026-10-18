# HomezyPro

Static Astro site (Cloudflare Pages) for sourced home-service directories. Singapore is the first
market. Ported from `roster/` (the reference implementation): see [docs/PORTING-PLAN.md](docs/PORTING-PLAN.md).

## Commands (from `homezypro/`, Node 20.19, see `.node-version`)

```sh
npm ci
npm run import:data      # verify + import the pinned r15.1 release (only when the data changes)
npm run build            # dist/ (948 HTML pages, sitemaps, llms.txt, _headers, _redirects)
npm test                 # HomezyPro tests + roster's ported unit tests (some read dist/: build first)
npm run check:site       # HomezyPro checks + roster's ported check-site, on dist/
npm run check:editorial  # our own copy + guide and blog page checks, on dist/
npm run dev | preview
```

`import:data` reads `companies-20261018-0125.json` and `logos-20261018-0059.tar.gz` from
`HOMEZYPRO_RELEASE_DIR` (default `/workspace/roster-release`, read only), checks both against their
`.sha256` files and the checksums pinned in `scripts/import-data.mjs`, applies roster's publication rules
(including the `needs-human-review` withhold) and writes `src/data/*.json` and `public/logos/`. It needs
Python 3 with Pillow for logos. The build itself needs only Node.

Dev scripts (never part of the build; outputs are committed):

| Script | What it does |
|---|---|
| `python3 scripts/brand/make-brand.py` | Logo, favicons, app icons, OG image (Playwright + /usr/bin/google-chrome, Pillow, fontTools). Preview sheet at `/tmp/hz-brand.png`. |
| `python3 scripts/dev/rasterize-svg-logos.py` | WebP copies of company SVG logos over 30 KB (Playwright + Chrome). |
| `node scripts/dev/serve-dist.mjs [port]` | Serves `dist/` applying `_headers` and `_redirects` like Cloudflare Pages. |
| `python3 scripts/dev/browser-smoke.py [port]` | Loads every page type in Chrome against that server: CSP violations, console errors, broken images, search, redirects. |
| `node scripts/dev/compare-roster.mjs` | Page counts per type and rendered output against roster's built pages. |
| `node scripts/dev/csp-scan.mjs` | Lists inline styles/scripts/handlers in `dist/` that the CSP would block. |
| `node scripts/dev/port-from-roster.mjs` | Re-copies roster modules and regenerates `scripts/check-site-roster.mjs`. |

## Brand

`public/brand/`: `logo.svg` (mark + wordmark, two colours), `logo-mono.svg` (one colour, `currentColor`),
`logo-mark.svg`, `logo-stacked.svg`, `logo.png` (1200 px wide), `logo-512.png` (Organization logo),
`og-default.png` (1200x630 share card). Site root: `favicon.ico` (16/32/48), `favicon.svg` (adapts to dark
tabs), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180), `icon-192.png`,
`icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `site.webmanifest`.

The mark is a house with a check knocked out (one colour, even-odd fill). The wordmark is Fraunces
(SIL Open Font License, the site's display face) at weight 600, converted to outlines. Colours: green
`#0e5e3f`, ink `#1b2120`, paper `#f3f0e9`. The header and footer inline the logo
(`src/lib/brand-logo.svg.txt`) and colour it from `public/assets/brand.css`.

## Site URL and indexing

One config: `src/config/site.mjs`.

- `SITE_URL` (default `https://homezypro.com`) drives canonicals, og:url, JSON-LD ids, sitemaps,
  llms.txt and robots.txt.
- Indexing is on only when `SITE_INDEXABLE=true` **and** `SITE_URL`'s host is `homezypro.com` **and**, on a
  Cloudflare build (`CF_PAGES=1`), `CF_PAGES_BRANCH` is the production branch (`HOMEZYPRO_PRODUCTION_BRANCH`,
  default `main`). Otherwise every page is `noindex, nofollow, noarchive` and `robots.txt` is
  `Disallow: /` with no sitemap line (the default).
- Production: `index, follow` (search, claim and logo-removal pages `noindex, follow`; the 404 and retired
  listings always `noindex, follow`), robots.txt `Allow: /` + `Sitemap: https://homezypro.com/sitemap.xml`.
- Independently of the build, `_headers` sends `X-Robots-Tag: noindex, nofollow` on every `*.pages.dev`
  and `*.*.pages.dev` host, so preview and branch URLs stay out of search even if misconfigured.

## Cloudflare Pages

Do these in the Cloudflare dashboard (Workers & Pages → Create → Pages → Connect to Git). Nothing here
creates the project or deploys.

| Setting | Value |
|---|---|
| Repository / production branch | this repository; production branch `main` (or set `HOMEZYPRO_PRODUCTION_BRANCH` to yours) |
| Framework preset | Astro |
| Root directory (advanced) | `homezypro` |
| Build command | `npm run build` (Pages runs `npm ci` itself because `package-lock.json` exists; `npm ci && npm run build` also works) |
| Build output directory | `dist` |
| Node version | `.node-version` (20.19.2) is read automatically; or set `NODE_VERSION=20.19.2` |

Environment variables (Settings → Variables and Secrets), per environment:

| Variable | Production | Preview |
|---|---|---|
| `SITE_URL` | `https://homezypro.com` | `https://homezypro.com` (canonicals point to production; previews stay noindex) |
| `SITE_INDEXABLE` | `true` | unset (or `false`) |
| `NODE_VERSION` | `20.19.2` (optional, `.node-version` covers it) | same |
| `HOMEZYPRO_PRODUCTION_BRANCH` | only if production is not `main` | same value |

No secrets are needed. `_headers` (security headers, strict CSP, cache rules, pages.dev noindex) and
`_redirects` (`/roster/*` → `/:splat` 301 and retired listings) are part of `dist/`.

Custom domain `homezypro.com`:

1. Pages project → Custom domains → Set up a custom domain → `homezypro.com`. If the zone is on Cloudflare,
   it adds the DNS record; otherwise add the CNAME it shows (`homezypro.com` → `<project>.pages.dev`) at
   your DNS host (an apex CNAME needs CNAME flattening or ALIAS support).
2. Add `www.homezypro.com` too, then redirect it to the apex with a Bulk Redirect or Redirect Rule
   (`_redirects` cannot redirect between hostnames).
3. Wait for the certificate to be active, then trigger a production deployment with `SITE_INDEXABLE=true`.
4. Check: `https://homezypro.com/robots.txt` shows `Allow: /` and the sitemap line; a page source shows
   `<meta name="robots" content="index, follow">`; `https://<project>.pages.dev/` responds with
   `X-Robots-Tag: noindex, nofollow`. Submit `https://homezypro.com/sitemap.xml` in Search Console.

## SEO and structured data

- JSON-LD: Organization (`/#organization`, PNG logo 512 px) and WebSite (`/#website`, SearchAction
  `/search/?q={search_term_string}`) on the home page, referenced by @id from every WebPage;
  BreadcrumbList wherever a breadcrumb trail is visible; a LocalBusiness subtype per company (HVACBusiness,
  Plumber, Electrician, HomeAndConstructionBusiness, LocalBusiness) with no ratings, reviews or offers;
  FAQPage only for HomezyPro's own visible FAQs (best-of, guides, blog, town pages, directories), never on
  company pages; Article on guides and blog posts.
- Sitemaps: `/sitemap.xml` index with lastmod → `sitemap-{core,best,guides,towns,blog,companies,images}.xml`.
  The image sitemap lists company logos and the hero photos. Utilities and retired listings are excluded.
- `/llms.txt`, `/llms-full.txt` from the same data and `SITE_URL`.

## Layout

- `src/config/` site, market (`markets.mjs`: `sg` active; `us`, `au` placeholders, not built) and
  retired-listing config.
- `src/lib/render.mjs` page renderers (ported from roster `build.mjs`); `src/lib/port/` roster's modules,
  content and reference data. `src/layouts/Base.astro`, `src/components/SeoHead.astro` document shell.
- `src/pages/` routes; `src/data/` imported release data (generated, committed); `public/assets/` CSS,
  client JS and hero images; `public/brand/` and the root icons; `public/logos/` company logos.

## Content rules

Facts only from sources. Google-only headline ratings and no rating/review/offer structured data.
"Best" only on the five best-of pages. No visible capture dates. Indicative prices are never shown as a
company's price; condenser cleaning is not general servicing or a chemical wash; the aircon units matrix
stays hidden. Accounts, saved lists and quote requests (parked in roster) are not part of HomezyPro.
