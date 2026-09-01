# heylead-previews

Static client demos served at **https://previews.heylead.com** via GitHub Pages.
One folder per client. No WordPress - these are pre-sign-off previews; production
builds move to WordPress after the client approves.

| Path | Client |
|---|---|
| `/union/` | Union Locksmiths (Singapore) |
| `/arc/` | ARC Home Management Services (Michael Sweet) |
| `/1800/` | 1800 CLEANER site redesign |
| `/speakscore/` | Internal lab - SpeakScore, English speaking duel app, fully client-side. Mic-pass race on one phone or between two phones over WebRTC (vendored PeerJS + free PeerJS-cloud signaling). Transcription: Web Speech API live, with free on-device Whisper fallback (transformers.js from jsDelivr - vendoring it trips GitHub push protection on a false-positive key pattern; whisper-tiny.en from HF hub, ~40 MB cached after first use) |
| `/svatba/` | Personal - wedding invitation for Мартин и Йоана (Bulgarian, single-file, front-end only RSVP for now) |
| `/vistarates/` | Vistarates - US personal finance comparison staging build (Astro static). Source: private `heylead-martin/vistarates`. Production target: vistarates.com |
| `/biasdrop/` | BiasDrop - K-pop superfan hub concept (idols, merch drops, photocards, light sticks, toys/gadgets, bias quiz). Neon dark entertainment demo for review. |
| `/imoti-bg/` | Имоти BG - Bulgarian real-estate market intelligence (cities, quarters, rates charts). Source: `~/imoti-bg`. Domain TBD. |
| `/avto-bg/` | Avto BG - Bulgarian used-car market intelligence (MVR fleet, first registrations, price checker, VIN). Source: `~/avto-bg`. Brand and domain TBD. |
| `/applylab/` | ApplyLab - personal remote-job co-pilot (semi-auto apply, AI tailor). API: `~/applylab-api` Cloudflare Worker. |
| `/karlaglow/` | KarlaGlow - product page + checkout testing Econt without the WooCommerce plugin. Uses delivery.econt.com customer_info form (shop pairing id) and live offices API. Preview orders stay in the browser until a backend write is added. |

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


## Password gate (client-side)

GitHub Pages is **static** - there is no real server authentication.

This repo uses a lightweight login at `/login.html` for casual privacy
(email `martin@heylead.com` + password). It is **not** strong security:
the repo is public, hashes are in `auth-config.js`, and anyone can open
raw HTML if they try hard enough.

### Reset password from terminal (no "forgot password" email needed)

```bash
node scripts/set-password.js 'YourNewPassword'
git add auth-config.js
git commit -m "chore: rotate previews password"
git push
```

Plain password is written only to `.password-local.txt` (gitignored).

### Real lock (recommended for secrets)

Use **Cloudflare Access** (Zero Trust) on `previews.heylead.com` with
one-time email PIN to `martin@heylead.com`. That is real auth at the edge.
Static "forgot password" is unnecessary if you reset from the terminal / GitHub.
