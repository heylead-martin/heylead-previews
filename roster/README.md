# Roster static site

Work on `roster-db-import` for this review. Do not push or publish until Martin approves. A push to `main` deploys the previews site.

## Import and build

From the repository root:

```sh
node roster/scripts/import-db.mjs && node roster/build.mjs
```

The importer reads `db-expanded/releases/LATEST` in the Roster Drive folder, then verifies the selected release against its adjacent `.sha256` file before writing site data. It never reads the mutable working `companies.json`.

To reproduce a specific release:

```sh
node roster/scripts/import-db.mjs "/absolute/path/to/companies-20261011-1509.json" "/absolute/path/to/logos-20261011-1458.tar.gz"
python3 roster/scripts/verify-map-pins.py
node roster/build.mjs
```

`ROSTER_DB_PATH` also accepts a release path. The checksum file must sit beside it as `<release>.sha256`. A missing checksum, mismatch or invalid LATEST filename stops the import.

The optional second argument, or `ROSTER_LOGO_BUNDLE`, supplies the matching logo bundle. `scripts/import-logos.py` checks each published logo against its release SHA256 before installing the batch under `assets/logos/`. Paths include the content hash for caching. Only published companies' assets are installed, archive links and unsafe paths are rejected, and static image content is validated. Subsequent imports can omit the bundle when every required local image already matches its hash. A missing or changed image stops the import before site data is written. Logo source URLs, original URLs and capture dates remain in `presentation.json`.

## Data ownership

- `data/curated/` is the protected baseline for the original 16 hand-written profiles. Edit those files when deliberately revising the original copy. Generated `companies.json`, `profiles.json` and `presentation.json` are overwritten by import.
- Original content takes precedence. Sourced release details fill missing values and add separate enrichment fields. Invalidated review sources are removed explicitly.
- Publication requires sourced company information, services, primary phone, address and an owned website. Blocking flags and rollbacks exclude a record. Original text is retained even if a flagged original page is withheld.
- `data/slug-registry.json` keeps URLs stable and reserves previous slugs. Keep it in version control across releases.
- `data/import-report.json` records release filename and checksum, publication counts, exclusion reasons and data caveats.
- `data/build-manifest.json` lists generated pages. The builder removes obsolete generated company pages from the previous manifest only.
- Do not edit generated HTML or index JSON directly. Edit `build.mjs`, `lib/expanded.mjs`, `assets/` or source data and rebuild.

## Presentation rules

Services and prices share expandable rows. Imported prices retain source wording, quantity, unit, promotion and GST details, including monthly session counts and hours per session. Inferred units are explicitly labelled. General cost guides are marked as references rather than company rates. Original curated service copy and prices stay intact.

Company pages start with Services & pricing, About the company and Location & contact. Reviews sit directly above FAQs. Extra sourced information appears only when present. Company-site answers and claims are attributed.

Company headers and directory cards feature the real average rating, total review count and number of sources. A single source supplies the average as-is; multiple independent sources are weighted by their review counts. Source links and dates remain visible. The reviews section also preserves the original Google Maps snapshot sentence and other source labels. No rating, review or offer structured data is emitted. Map iframes use verified building coordinates from `data/map-pins.json`; unresolved or stale addresses show no iframe. Unit numbers are removed from public map captions and directions. Read `ADDRESS-MAP-COLLECTION.md` before collecting or updating location evidence. Sourced alternate phone numbers appear as "Also listed" with their source label. The primary number remains the main call action.

All pages remain noindex. Account screens and quote requests are previews with no backend. The quote panel still sends and stores nothing. Shared preview authentication is unchanged.

Trade pages lead with up to eight full-bar profiles, ordered by evidence and then rating. Other companies use compact rows in batches of 12. A versioned per-trade JSON index supports search, filters, sorting and more compact results. Non-full-bar company pages carry a limited-details note and a smaller layout. Area filters refer to the published business address, not promised service coverage. The all-company search covers every published profile. Each company appears under its release `primary_trade`; trade counts do not overlap. Sourced fit notes and service-area excerpts are retained, while `self_description` metadata is never used as About text.

## Validation

```sh
node --test roster/scripts/import-db.test.mjs roster/scripts/presentation.test.mjs
python3 -m unittest discover -s roster/scripts -p 'test_import_logos.py'
node roster/scripts/check-site.mjs
```

The checks cover publication safeguards, checksum integrity, stable slugs, original content, offer conditions, map privacy, metadata, noindex, schema restrictions, every internal link and fragment, and the 300 KB HTML plus JSON budget per trade.

Also review desktop and mobile previews after template changes. Test filters, sorting, save controls, load more, and service/FAQ disclosures. Inspect 10 sampled company pages, including new and original profiles. See `IMPORT-REVIEW.md` for the current review results and caveats.

## Owner and review layout previews

The footer and each company sidebar link to `/roster/claim-listing/`. The claim page describes the proposed ownership checks and includes a local demo form. It does not send requests, save contact details or mark a listing as claimed. Its business name field suggests published companies, completes unique name matches and prepopulates from a company link. Ambiguous names are left for the user to choose. It uses a disabled fieldset until its local submit handler loads, then clears sample contact details after the preview.

Public summaries and imported About text use customer-facing third-person copy derived from sourced services and coverage. Original source excerpts remain in an expandable reference, and the 16 protected write-ups remain intact. `lib/profile-copy.mjs` controls this presentation so future imports keep the same tone. Original price wording remains available while clear `job | price` values are split for display.

Company cards and profiles reserve space for a logo. Existing artwork is used when present, otherwise the slot shows company initials. Broken artwork falls back to initials.

The importer maps release `ratings` into sourced, dated records and recalculates the combined score. Unknown review counts are never invented. Google widgets are treated as mirrors when a direct Google rating exists. Real release ratings replace the mockup on company pages, with source-method details available in disclosures. Full profiles without release rating records retain a clearly labelled mockup with 2-5 sources. `assets/review-model.mjs` holds sample fixtures and a review-count-weighted calculation. Sample scores never replace real sourced ratings, change directory sorting or enter structured data. The combined score is the sum of each rating multiplied by its count, divided by total reviews. Identified mirrors, incompatible scales and unusable counts are excluded. `lib/rating-summary.mjs` handles real records separately from the sample fixtures, with `assets/rating-display.mjs` shared by static and dynamically loaded cards. Directory filters and sorting use the real average. Cards pair this with main services and a labelled example service price when a specific published rate can be extracted. Before connecting a real data release, each source needs its platform, profile URL, capture date, rating, scale, count and any mirror relationship. Deduplication is not automatic.
