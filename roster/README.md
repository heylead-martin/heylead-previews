# Roster static site

Work on `service-areas-1253` for this review. Do not push or publish until Martin approves. A push to `main` deploys the previews site.

## Import and build

From the repository root:

```sh
npm --prefix roster ci --ignore-scripts
node roster/scripts/import-db.mjs && node roster/build.mjs
```

Install dependencies once per checkout and after lockfile changes. The site build bundles the official Supabase client and separately generates ignored public runtime configuration from `.env.local`. Complete the Supabase setup below first, or explicitly use `ROSTER_ACCOUNT_PREVIEW=1` for a disconnected design preview with empty public values.

## Supabase setup

Roster uses static JavaScript ES modules, npm and Node 22 or later. No SSR package or TypeScript generation is needed. Copy `roster/.env.example` to `roster/.env.local` if it does not already exist and set `ROSTER_PUBLIC_SUPABASE_URL` and `ROSTER_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep Google disabled until the owner configures it. No server secret key is needed.

From `roster/`:

```sh
npm run supabase -- login
npm run supabase:link
npm run check:supabase
npm run build
```

The CLI is initialized locally. Complete login and any database-password prompt in your own terminal. Review [the migration](supabase/migrations/202610120001_saved_companies.sql), which creates private saved-company rows with RLS, and get Martin's approval before `npm run supabase -- db push`. Future schema changes belong in `supabase/migrations/`. After applying the migration, run `npm run check:supabase -- --schema`.

Local env files, link state and generated `accounts.public.json` stay out of git. The committed bundle contains no project key. GitHub Pages must include the generated public JSON through an environment-backed deployment artifact before accounts can be published. Auth settings, OAuth providers and the Free plan remain unchanged. See [ACCOUNTS-SETUP.md](ACCOUNTS-SETUP.md) for exact setup, deployment requirements, validation and future type-generation guidance.

## Database releases

The importer reads `db-expanded/releases/LATEST` in the Roster Drive folder, then verifies the selected release against its adjacent `.sha256` file before writing site data. It never reads the mutable working `companies.json`.

To reproduce a specific release:

```sh
node roster/scripts/import-db.mjs "/absolute/path/to/companies-20261012-1253.json" "/absolute/path/to/logos-20261012-1253.tar.gz"
python3 roster/scripts/verify-map-pins.py
node roster/build.mjs
```

`ROSTER_DB_PATH` also accepts a release path. The checksum file must sit beside it as `<release>.sha256`. A missing checksum, mismatch or invalid LATEST filename stops the import.

The optional second argument, or `ROSTER_LOGO_BUNDLE`, supplies the matching logo bundle. `scripts/import-logos.py` checks each published logo against its release SHA256 before installing the batch under `assets/logos/`. Paths include the content hash for caching. Only published companies' assets are installed, archive links and unsafe paths are rejected, and static image content is validated, including GIF and ICO logos. Animated GIFs are rejected. Subsequent imports can omit the bundle when every required local image already matches its hash. A missing or changed image stops the import before site data is written. Logo source URLs, original URLs and capture dates remain in `presentation.json`.

A release logo marked `logo_unsure: true` or `display: initials` is withheld from cards and profiles, which show company initials instead. Its reason and audit date remain in `presentation.json` and the import report. A photo fallback cannot restore the uncertain logo. The business itself remains eligible when its company data passes the publication checks.

## Data ownership

- `data/curated/` is the protected baseline for the original 16 hand-written profiles. Edit those files when deliberately revising the original copy. Generated `companies.json`, `profiles.json` and `presentation.json` are overwritten by import.
- Original content takes precedence. Sourced release details fill missing values and add separate enrichment fields. Invalidated review sources are removed explicitly. A sourced postal code may fill a missing original postal only when the building address matches; the original write-up and address wording remain intact.
- Publication requires sourced company information, services, primary phone, address and an owned website. Blocking flags and rollbacks exclude a record. Original text is retained even if a flagged original page is withheld.
- `data/slug-registry.json` keeps URLs stable and reserves previous slugs. Keep it in version control across releases.
- `data/import-report.json` records release filename and checksum, publication counts, exclusion reasons and data caveats.
- `data/build-manifest.json` lists generated pages. The builder removes obsolete generated company pages from the previous manifest only.
- Do not edit generated HTML or index JSON directly. Edit `build.mjs`, `lib/expanded.mjs`, `assets/` or source data and rebuild.

## Presentation rules

Services and prices share expandable rows. Imported prices retain source wording, quantity, unit, promotion and GST details, including monthly session counts and hours per session. Where the release supplies a calculated per-unit amount and minimum quantity, both are labelled alongside the original total. Inferred units are explicitly labelled. General cost guides are marked as references rather than company rates. Original curated service copy and prices stay intact.

Company pages start with Services & pricing, Areas served when stated, About the company and Location & contact. Reviews sit directly above FAQs. Extra sourced information appears only when present. Company-site answers and claims are attributed.

Company headers and directory cards feature the real average rating, total review count and number of sources. A single source supplies the average as-is; multiple independent sources are weighted by their review counts. Source links and dates remain visible. The reviews section also preserves the original Google Maps snapshot sentence and other source labels. No rating, review or offer structured data is emitted. Map iframes use verified building coordinates from `data/map-pins.json`; unresolved or stale addresses show no iframe. Unit numbers are removed from public map captions and directions. Read `ADDRESS-MAP-COLLECTION.md` before collecting or updating location evidence. Sourced alternate phone numbers appear as "Also listed" with their source label. The primary number remains the main call action.

All pages remain noindex. Account screens use Supabase for email/password, recovery and private saved companies. Public project configuration is now supplied locally; the hosted migration and owner-managed Auth setup still need completion. Google stays disabled until the owner enables it. Follow [ACCOUNTS-SETUP.md](ACCOUNTS-SETUP.md) to activate and verify real accounts. The quote and claim previews still send and store nothing. Shared preview authentication is unchanged.

Trade pages lead with up to eight full-bar profiles, ordered by evidence and then rating. Other companies use compact rows in batches of 12. A versioned per-trade JSON index supports search, filters, sorting and more compact results. `assets/catalogue-data.mjs` losslessly encodes repeated field names as column indexes and repeated service-area names in a shared dictionary and decodes them in the browser, keeping larger directories within the payload budget. Non-full-bar company pages carry a limited-details note and a smaller layout. Area filters use sourced `service_locations`, never office addresses. A selected town ranks explicit town matches first, followed by region matches and islandwide coverage. Companies without stated areas are excluded unless the user enables the optional toggle. The selected area and other filters persist in URL query parameters. The all-company search covers every published profile. Each company appears under its release `primary_trade`; trade counts do not overlap. Sourced fit notes and service-area excerpts are retained, while `self_description` metadata is never used as About text.

## Validation

```sh
node --test roster/scripts/*.test.mjs
python3 -m unittest discover -s roster/scripts -p 'test_*.py'
node roster/scripts/check-site.mjs
```

The checks cover publication safeguards, checksum integrity, stable slugs, original content, offer conditions, map privacy, metadata, noindex, schema restrictions, every internal link and fragment, and the 300 KB HTML plus JSON budget per trade.

Also review desktop and mobile previews after template changes. Test filters, sorting, save controls, load more, and service/FAQ disclosures. Inspect 10 sampled company pages, including new and original profiles. See `SERVICE-AREAS-REVIEW.md` for this update and `IMPORT-REVIEW.md` for earlier import review results.

## Owner and review layout previews

The footer and each company sidebar link to `/roster/claim-listing/`. The claim page describes the proposed ownership checks and includes a local demo form. It does not send requests, save contact details or mark a listing as claimed. Its business name field suggests published companies, completes unique name matches and prepopulates from a company link. Ambiguous names are left for the user to choose. It uses a disabled fieldset until its local submit handler loads, then clears sample contact details after the preview.

Public summaries and imported About text use customer-facing third-person copy derived from sourced services and coverage. Original source excerpts remain in an expandable reference, and the 16 protected write-ups remain intact. `lib/profile-copy.mjs` controls this presentation so future imports keep the same tone. Original price wording remains available while clear `job | price` values are split for display.

Company cards and profiles reserve space for a logo. Existing artwork is used when present, otherwise the slot shows company initials. Broken artwork falls back to initials. The build runs `scripts/fit-logos.py` (Python 3 with Pillow 12 or later) to measure transparent and plain-white margins and generate `assets/logo-fit.css`. CSS centers the complete artwork with proportional scaling, wider tiles for long wordmarks, and a dark background for predominantly white transparent logos. Original image bytes and checksums stay unchanged. SVGs retain their original viewBox and use the same larger default fit. New imported raster logos are measured automatically on rebuild.

The importer maps release `ratings` into sourced, dated records and recalculates the combined score. Unknown review counts are never invented. Company-site widgets and self-reported scores are excluded, including a legacy curated score explicitly moved to `self_reported_rating` by a release. Trustpilot TrustScores are displayed separately and do not enter the average. Profiles without an eligible rating say "No rating yet". Sample score fixtures remain for development but are not rendered on company pages.

The combined score is the sum of each eligible rating multiplied by its count, divided by total reviews. A single eligible source supplies its score directly. Identified mirrors, incompatible scales and unusable counts are excluded. `lib/rating-summary.mjs` handles real records, with `assets/rating-display.mjs` shared by static and dynamically loaded cards. Directory filters and sorting use the real average. Cards pair this with main services and a labelled example service price when a specific published rate can be extracted. Each source needs its platform, profile URL, capture date, rating, scale, count and any mirror relationship. Deduplication is not automatic.

## Homepage map and comparisons

The homepage is built from the current published company data. Trade filters update the map, counts, average company rating and browse link without network requests. Only verified building pins with matching address hashes appear. Dots show business locations, not service coverage; they contain no unit numbers or personal location data.

`data/singapore-outline.json` is a simplified derivative of the Singapore Land Authority National Map Polygon dataset, under the Singapore Open Data Licence. The source and licence links are recorded in the file, and attribution is visible below the map. To refresh the outline from a downloaded source GeoJSON:

```sh
python3 roster/scripts/prepare-home-map.py /path/to/NationalMapPolygon.geojson
```

`lib/home-snapshot.mjs` calculates one equal-weight company average from eligible combined ratings. Common-job prices average the lowest eligible advertised starting rate per company, with at least three companies required. It compares a named job and unit, excluding identifiable promotions, annual packages and indicative cost guides. Minimum bookings and price conditions remain visible; expandable source lists show every included company. These are directory samples, not market-wide prices or quotes. Future imports update the counts, map dots and price samples on rebuild. `assets/home.css` and `assets/home.js` load only on the homepage.

## Service coverage

`lib/service-areas.mjs` accepts supported, dated company-site coverage statements with their excerpts and source URLs. Missing evidence produces no Areas served section or navigation link. Town tags are alphabetized within their regions when there are more than eight towns; lists longer than twelve expand on demand. Source URLs, excerpts and capture dates remain in the data, but the source rows are not displayed in the Areas served card.

`assets/service-areas.mjs` maps all 55 planning areas to their official URA 2019 regions. Its source and Singapore Open Data Licence links are recorded in that file. `assets/area-picker.mjs` provides typed filtering, grouped options, keyboard selection and clearing. Coverage matching and facet counts run before pagination. When an area is selected, a single compact results list preserves town-first ordering across full and limited profiles and across all sort choices.

## Hero search and job shortlist beta

The homepage moves search from the header into a hero with Quick search and AI search tabs. Quick search opens the existing directory. AI search is clearly labelled as an unconnected beta: full sentences are interpreted by local service and town keyword rules, using only published company records. It makes no AI, availability, timing, suitability or budget claims.

`lib/job-search.mjs` renders the hero and `/roster/matches/`. `assets/job-match.mjs` supplies the pure parser, matcher and selection validation. `assets/job-search.js` handles the hero tabs and `assets/job-results.js` handles the dedicated shortlist, loading the existing versioned all-company index. The additional CSS loads only on these two pages.

A shortlist starts with five companies and can expand to ten. Named jobs must match listed offerings. A chosen town uses stated service coverage, with town before region before islandwide, never office addresses. Unstated coverage is excluded for a chosen area. An ambiguous trade or area asks the visitor to refine the brief. Real average ratings and published prices retain their details and sources. Prices are examples or named service rates, not quotes for the visitor's entire job.

Every fresh shortlist selects all visible companies. Switching between five and ten selects the new visible set; clicking the already-active size keeps manual choices. Visitors can untick individual companies, clear the selection or select all again. Editing the brief clears stale results and selections until the next search. The prominent Request a quote button sits at the top of the desktop sidebar and above the mobile results, and still opens only a preview. Logo tiles keep fitted artwork proportions and centered initials without the extra LOGO label. Selection checkboxes are 32 pixels within a 44-pixel touch target. The dialog shows the exact brief and selected companies. Finish preview sends nothing and does not collect personal contact details. Preview forms stay disabled until their local handler loads. Descriptions are carried in URL fragments rather than HTTP query parameters; selections stay in memory. There is no AI service, quote API, new database or change to the existing quote panel.

See `AI-SEARCH-PREVIEW.md` for validation and local review links. Publication still requires Martin's approval.


The quote sidebar beta now accepts a job description and region, then shows a WhatsApp/email contact preview with explicit recipient permission. Nothing is sent or persisted. Contact details are cleared when the dialog closes. See [AI-SEARCH-PREVIEW.md](AI-SEARCH-PREVIEW.md) for matching, delivery boundaries and verification. Publishing still requires Martin's approval.


## SEO and AEO content

The 20 core editorial pages are defined in `content/guides/catalogue.mjs`, with Markdown copy in `content/guides/`. Five enrich existing directories and 15 are standalone guides. `content/how-it-works.md` supplies the methodology page. Edit these source files and rebuild instead of editing generated HTML.

`lib/editorial.mjs` renders the supported Markdown subset into readable sections, comparison tables, a contents panel, related links and matching FAQ data. `assets/editorial.css` controls the responsive reading layout. The homepage and shared footer link to the guides.

Run `npm run check:editorial` from `roster/` after building. It verifies the 1,000-word minimum, generated content, metadata, FAQs, contents anchors and preview indexing safeguards, then writes `data/editorial-audit.json`. The current 20 core pages contain over 1,200 editorial words each. Shared navigation and company cards do not count toward this minimum.

All pages remain noindex. `sitemap.xml` is empty during preview, and `data/seo-launch-pages.json` records candidate public pages for an approved future launch. Confirm the production domain and indexing scope before generating a public sitemap. Read [SEO-AEO-REVIEW.md](SEO-AEO-REVIEW.md) for the page inventory, word counts, evidence decisions and validation.
