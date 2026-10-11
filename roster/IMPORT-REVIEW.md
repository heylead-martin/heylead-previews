# Roster import review

Updated 11 October 2026 on `roster-db-import`. Local review only. Nothing pushed or published. Publishing remains a separate step after Martin reviews the preview.

## Pinned release

- File: `companies-20261011-1337.json`
- SHA256: `388f7b4803c2bc2ed186ed9074a3870c2b6ecf7d41e6218482acfa04f4723de7`
- Source rows: 5,444
- Rows marked as profiles: 624
- Included company pages: 534
- Excluded source rows: 4,910
- Generated site pages: 548

The initial 1204 release had 597 profile records. During the final default-import check, LATEST advanced to the 1337 release with 624 profile records. This review is pinned to the checksum above so later Drive updates do not silently change these results.

Of the 624 profile records, 67 lack sourced About content and another 29 fail other publication rules. Another six records outside the profiled segment have all required sourced fields. The resulting site includes 534 company pages. Metadata in `self_description` is never substituted for missing About text. All exclusions are logged in `data/import-report.json`.

| Primary trade | Included | Excluded |
| --- | ---: | ---: |
| Aircon | 185 | 1714 |
| Plumbing | 68 | 371 |
| Electrician | 84 | 2026 |
| Handyman | 76 | 308 |
| Home cleaning | 121 | 491 |

Each record is counted under its primary trade, so totals do not overlap.

## Changes

- Imported the checksum-verified release with stable company URLs.
- Trade pages, homepage counts and search category filters use `primary_trade`.
- Sourced alternate numbers appear as "Also listed" with a source label, such as BCA register. The primary phone remains the main call action. There are 50 included profiles with alternate numbers.
- Price details retain monthly session counts, hours per session, quantity, GST and promotions. Inferred units are explicitly labelled. 124 included profiles have an inferred unit.
- Sourced best-for and poor-fit notes fill empty sections while original curated copy takes precedence. Service-area excerpts are displayed with their sources.
- Current coverage: 528 summaries, 190 sourced FAQ sets, 341 best-for records, 32 poor-fit records and 316 service-area records.
- Noindex, existing preview authentication and unsent account/quote previews remain in place.

## Original profiles

All 16 hand-written profile objects match the protected baseline. Fifteen currently have pages. Billy Aircon remains withheld under `no-sg-postal-code`; its write-up is retained. The invalidated property.co review excerpt for 338 Aircon remains omitted.

## Remaining source-data limits

- 79 included profiles trigger the pricing review rule for long extracted text or "as printed" units. This is a review queue, not a finding that all 79 are incorrect. Source wording is available in disclosures, and long fields display "See source details" rather than invented short prices.
- Specific earlier concerns remain: MCAAS has a carpet-cleaning excerpt assigned to the mattress job. City Cooling retains repeated page-title pricing references and a quantity label not established by its excerpt. These should be corrected in the database before calling the release fully clean.
- 8 profiles have general or indicative pricing, labelled separately from company rates.
- 153 profiles have alternate-address records. Only primary addresses are displayed. Map embeds and directions omit unit numbers.
- The four Google snapshots the supplied 10 October spot-check could not re-find remain dated 10 October: IJ Handyman, Commercial Engineering, DW Deep Cleaning and Doctor Cool. This build has not independently verified them.
- The available 1204 release notes state that units and coverage use text extraction and were not hand-verified row by row. Inferred-unit labels retain that distinction. No separate 1337 release-notes file was present during review.
- The separate Drive summary and the filename quoted in the Claude prompt lag LATEST. The verified release JSON is the build's source of truth.

## Validation

- 16 importer/data-rule tests passed, covering primary trades, alternate contact sources, package scope and exclusion of metadata-only About content.
- All 548 pages passed local links/fragments, unique metadata, noindex, schema restrictions, section order and map privacy checks.
- All 16 original write-ups match their baseline.
- A repeated import and build from the pinned 1337 release produced byte-identical generated data and pages.
- Ten deterministic random profiles and ten newly eligible profiles rendered without empty sections, invalid placeholders or horizontal overflow.
- Browser checks passed for alternate phone labels, sourced fit notes, monthly package details, primary-trade filtering and empty results. Body text was 16px at a measured 325px mobile viewport. Desktop checks passed at 1280px. Temporary viewport overrides were reset.
- HTML plus JSON: Aircon 229.5 KB, Plumbing 108.5 KB, Electrician 123.4 KB, Handyman 114.0 KB, Home cleaning 159.4 KB. All below 300 KB.

## Local review links

- Homepage: http://127.0.0.1:8880/roster/
- AFRA, alternate phone labels: http://127.0.0.1:8880/roster/company/afra-engineering/
- Superb Cleaning, monthly package scope: http://127.0.0.1:8880/roster/company/superb-cleaning-pte-ltd/
- Cool Aircon, preserved original write-up: http://127.0.0.1:8880/roster/company/cool-aircon/

The local server uses a local authentication stub without modifying deployed authentication files. See `README.md` for future import commands and `data/import-report.json` for complete exclusions and warnings.
