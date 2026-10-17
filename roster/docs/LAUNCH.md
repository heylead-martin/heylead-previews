# Roster launch switches

Status: **preview, not launched.** Every page carries `noindex, nofollow, noarchive` and
`roster/robots.txt` says `Disallow: /roster/`. Nothing below is switched on. Flip the switches only
after Martin approves launch.

## 1. Where the site lives: `lib/site-config.mjs`

| Setting | Default | Used by |
|---|---|---|
| `SITE_ORIGIN` | `https://previews.heylead.com` | canonical links, `og:url`, JSON-LD `@id`/`url`, Organization logo, sitemaps, `llms.txt` |
| `SITE_BASE` | `/roster` | the path prefix of those absolute URLs |
| `LAUNCH` | `false` | robots meta, auth script tags, launch robots file (below) |

A production domain is one change, at build time or in the file:

```
SITE_ORIGIN=https://www.example.sg node build.mjs
```

Internal links in the pages stay root-relative under `/roster/` (for example `/roster/plumbing/`).
Serve the site under `/roster/` on the final domain, or plan a separate pass to rewrite internal links
before changing `SITE_BASE`. Then update the hard-coded preview host in the two checks
(`scripts/check-site.mjs`, `scripts/check-editorial.mjs`), which assert the preview URLs today.

## 2. What `LAUNCH=true` does

```
LAUNCH=true SITE_ORIGIN=https://www.example.sg node build.mjs
```

- Content pages get `index, follow` (home, hubs, guides, town pages, Best-of pages, blog,
  symptom finder, how-it-works and the company pages).
- `noindex, follow` stays on `/search/`, `/claim-listing/` (and every `?company=` link), `/logo-removal/`,
  the account and saved-companies pages, and job matching (`UTILITY_PATHS` in `lib/site-config.mjs`).
- Filter URLs (`?area=`, `?reviews=`, `?price=`, `?rating=`, `?q=` and similar) already canonicalise to
  their hub. GitHub Pages serves the same file for every query string, so a small head script sets
  `noindex, follow` when the URL has one of those parameters.
- The `/auth-config.js` and `/auth.js` script tags are left out of every page.
- The build writes `roster/launch/robots.txt`:

  ```
  User-agent: *
  Allow: /
  Disallow: /roster/data/
  Sitemap: <SITE_ORIGIN>/roster/sitemap.xml
  ```

  **robots.txt only works at the root of the final domain.** Copy this file there by hand. The build
  never writes outside `roster/`, and `roster/robots.txt` keeps its preview `Disallow` until the domain
  root file is in place.

Not switched by the flag: the AI-crawler policy (strategy section 5.5) is Martin's call. Add any
`User-agent` blocks for AI crawlers to the root robots.txt when copying it.

## 3. Security: the access gate (Martin to handle; not changed by this branch)

- The preview gate is **client-side only** (`/auth.js` at the repo root). Every HTML page and
  `/roster/data/*.json` (companies, logos, coordinates) can be fetched without JavaScript.
- **The repo is public.** `/auth-config.js` at the repo root serves **two user email addresses and
  64-character password hashes** to anyone who requests it. Treat those passwords as exposed:
  rotate them, and remove the file from the public site before launch.
- For any private preview after launch, use real access control (Cloudflare Access or similar),
  not a script in the page.
- This branch does not touch `/auth.js`, `/auth-config.js`, the root `robots.txt` or `.github`.

## 4. Sitemaps and llms files (built every time)

- `roster/sitemap.xml` is a sitemap index. Its children are `sitemap-core.xml` (home, method, hubs, the
  chemical-wash and gas-top-up pages, symptom finder), `sitemap-best.xml`, `sitemap-guides.xml`,
  `sitemap-towns.xml`, `sitemap-blog.xml` and `sitemap-companies.xml`.
- `<lastmod>` comes from guide and blog dates, the how-it-works date, the data release date, and for
  each company its newest dated fact (rating check, listing check, prices).
- Utilities, query URLs and retired listings are never listed.
- `roster/llms.txt` (short index) and `roster/llms-full.txt` (guide summaries and method) follow
  `SITE_ORIGIN`. They carry no company contact data. For crawlers that look at the domain root,
  copy or link them there at launch.

## 5. Launch checklist (in order)

1. Martin approves launch and picks the domain.
2. Rotate the preview passwords and remove `/auth-config.js` and `/auth.js` from the public host.
3. Build with `LAUNCH=true SITE_ORIGIN=<domain>`. Update the preview host in the two checks, then run
   all four checks.
4. Copy `roster/launch/robots.txt` to the domain root. Add the AI-crawler policy.
5. Submit `<domain>/roster/sitemap.xml` in Search Console and Bing Webmaster Tools.
