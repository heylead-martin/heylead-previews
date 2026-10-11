# Roster import review

Updated 11 October 2026 on `roster-db-import`. Local review only. Nothing pushed or published. Publishing remains a separate step after Martin reviews the preview.

## Verified release

- File: `companies-20261011-1204.json`
- SHA256: `cd2dbdcbafdc27f85c47a2ca5f4f80afd3e3e966dcb0f43ef8e744531ffebca2`
- Source rows: 5,444
- Rows marked as profiles in the release: 597
- Company pages included: 513
- Source rows excluded: 4,931
- Total generated pages: 527

The 597 source profiles do not all meet the website's full-profile rules. Of those records, 64 lack sourced About content and 26 are excluded by other publication rules. Another six records outside the release's profiled segment have the required sourced fields, producing 513 eligible company pages. The old preview had 577; the 64-page reduction follows removal of metadata from About content. `self_description` is never substituted for missing About text.

| Primary trade | Included | Excluded |
| --- | ---: | ---: |
| Aircon | 176 | 1723 |
| Plumbing | 68 | 371 |
| Electrician | 84 | 2026 |
| Handyman | 76 | 308 |
| Home cleaning | 109 | 503 |

Each record is counted under its `primary_trade`. Totals no longer overlap.

## Changes in this update

- Re-imported the new checksum-verified release. The same reusable command remains available in `README.md`.
- Trade pages, homepage counts and search category filters now use the primary trade.
- Sourced alternate numbers appear as "Also listed" with a short source label, such as BCA register. The primary phone remains the main call action. 47 included profiles have these alternate contact numbers.
- Prices retain monthly session counts, hours per session, quantity, GST and promotional details. Inferred units are explicitly identified. 123 included profiles have at least one inferred unit.
- Sourced best-for and poor-fit notes fill empty sections while original curated copy takes precedence. Service-area excerpts are displayed with their sources.
- The update includes 507 summaries, 186 sourced FAQ sets, 334 best-for records, 30 poor-fit records and 312 service-area records.
- All pages remain noindex. The existing preview authentication and unsent account/quote previews are unchanged.

## Preserved originals

All 16 hand-written profile objects still match the protected baseline exactly. Fifteen have generated pages. Billy Aircon remains withheld under the release's `no-sg-postal-code` flag; its write-up is retained for restoration once the source record is verified. The invalidated property.co review excerpt for 338 Aircon remains omitted.

## Remaining data limits

- 77 included profiles trigger the pricing review rule because they retain long extracted text or "as printed" units. This is a review queue, not a finding that all 77 are wrong. Original wording is available in disclosures and long fields are shown as "See source details" rather than invented short prices.
- Specific earlier concerns remain in the release: MCAAS has a carpet-cleaning excerpt assigned to the mattress job, and City Cooling retains repeated page-title pricing references plus a quantity label that is not established by its excerpt. These need correction in the database before calling the release fully clean.
- 8 profiles have general or indicative pricing, which stays labelled separately from company rates.
- 135 profiles retain alternate-address records. Only the primary address is displayed; map embeds and directions omit unit numbers.
- The four Google snapshots that the supplied 10 October spot-check could not re-find are still dated 10 October in this release: IJ Handyman, Commercial Engineering, DW Deep Cleaning and Doctor Cool. This build has not independently verified those ratings.
- The release notes say units and coverage were extracted using text rules and were not hand-verified row by row. Displayed sources and inferred-unit labels preserve that distinction.
- The separate Drive `summary.json` still reports an older generation time. This build uses the verified JSON release and its release notes.

## Validation

- 16 importer and data-rule tests passed, including primary-trade totals, source-labelled alternate numbers, monthly package scope and the rule against using metadata as About text.
- All 527 generated pages passed local links/fragments, unique metadata, noindex, schema restrictions, section order and map privacy checks.
- Original content matches all 16 protected baseline objects.
- Ten deterministic random profiles rendered with populated sections, no invalid data placeholders and no horizontal overflow.
- Browser checks covered alternate phone labels, sourced fit notes, monthly pricing details, primary-trade filtering and empty results. Mobile body text is 16px, with no overflow at a measured 325px viewport. The desktop profile and search checks passed at 1280px.
- HTML plus JSON: Aircon 220.4 KB, Plumbing 108.5 KB, Electrician 123.4 KB, Handyman 114.0 KB, Home cleaning 148.2 KB. All below 300 KB.

Sampled profiles: Hygieneman Services, ESP Cleaning Services, IFC Air-Cond Engineering, EMSS Engineering, Decom Air Con, AFRA Engineering, ACNCSG, EverShine Cleaning, HomeUnited Repair and Ace Plumbing.

## Local review

The local server remains on port 8880. It serves a local authentication stub without modifying deployed authentication files.

- Homepage: http://127.0.0.1:8880/roster/
- AFRA, alternate phone and source label: http://127.0.0.1:8880/roster/company/afra-engineering/
- Superb Cleaning, monthly package scope: http://127.0.0.1:8880/roster/company/superb-cleaning-pte-ltd/
- Cool Aircon, original write-up: http://127.0.0.1:8880/roster/company/cool-aircon/

The complete exclusion list and warning queue are in `data/import-report.json`. Keep publication separate from this local import and review.
