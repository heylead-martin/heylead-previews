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
node roster/scripts/import-db.mjs "/absolute/path/to/companies-20261011-1204.json" && node roster/build.mjs
```

`ROSTER_DB_PATH` also accepts a release path. The checksum file must sit beside it as `<release>.sha256`. A missing checksum, mismatch or invalid LATEST filename stops the import.

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

Google Maps ratings are linked, dated sentences based on stored snapshots. Other rating sources retain their own labels. No rating, review or offer structured data is emitted. Unit numbers are removed from map embeds and directions. Sourced alternate phone numbers appear as "Also listed" with their source label. The primary number remains the main call action.

All pages remain noindex. Account screens and quote requests are previews with no backend. The quote panel still sends and stores nothing. Shared preview authentication is unchanged.

Trade pages render 12 cards initially and load a separate per-trade JSON index for search, filters, sorting and load more. Area filters refer to the published business address, not promised service coverage. The all-company search covers every published profile. Each company appears under its release `primary_trade`; trade counts do not overlap. Sourced fit notes and service-area excerpts are retained, while `self_description` metadata is never used as About text.

## Validation

```sh
node --test roster/scripts/import-db.test.mjs
node roster/scripts/check-site.mjs
```

The checks cover publication safeguards, checksum integrity, stable slugs, original content, offer conditions, map privacy, metadata, noindex, schema restrictions, every internal link and fragment, and the 300 KB HTML plus JSON budget per trade.

Also review desktop and mobile previews after template changes. Test filters, sorting, save controls, load more, and service/FAQ disclosures. Inspect 10 sampled company pages, including new and original profiles. See `IMPORT-REVIEW.md` for the current review results and caveats.
