# heylead-previews

Static client demos served at **https://previews.heylead.com** via GitHub Pages.
One folder per client. No WordPress - these are pre-sign-off previews; production
builds move to WordPress after the client approves.

| Path | Client |
|---|---|
| `/union/` | Union Locksmiths (Singapore) |
| `/arc/` | ARC Home Management Services (Michael Sweet) |
| `/1800/` | 1800 CLEANER site redesign |

## Adding a new client preview

1. Create a folder at the repo root (short, lowercase: `acme/`).
2. Drop in a self-contained static build: `index.html` + relative or
   `/acme/`-absolute asset paths. No server-side anything - GitHub Pages is
   static only (no PHP, no .htaccess, no custom headers).
3. Every HTML page must carry
   `<meta name="robots" content="noindex, nofollow, noarchive">` -
   Pages cannot send X-Robots-Tag headers, so the meta tag is the only noindex.
4. Add a card to the root `index.html` list.
5. Commit + push to `main` - Pages deploys automatically (~1 min).

## Notes

- Repo is **public** (GitHub free plan requires it for Pages). Never commit
  internal client notes, credentials, or anything not meant to be world-readable.
- DNS: `previews` CNAME -> `heylead-martin.github.io` (Cloudflare, DNS-only/grey
  cloud so GitHub can provision the TLS certificate).
- The Union build is generated from `~/Downloads/unionlocksmiths-recovery/`
  (`meta/make_staging.py /union`); ARC/1800 originated in the `heylead-theme`
  repo (`site-design/`, `clients/site-redesign/`).
