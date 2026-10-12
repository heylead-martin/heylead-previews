# Service areas review - 12 October 2026

Branch: `service-areas-1253`. Local review only. Do not merge, push or deploy without Martin's approval.

## Imported release

- Companies: `companies-20261012-1253.json`
- Verified SHA256: `3850fc0b4891afd5a2940f5efaaa9a958d88014af24b7fd454e70d5190cff352`
- Logos: `logos-20261012-1253.tar.gz`
- Verified SHA256: `d6c7cdd1d02919ab4e1539ba0c737741b353376acf2738716f64456b05e81013`
- Release notes read before importing. Existing publication checks remain in force.

The release describes 794 publishable records. The site's existing stricter evidence checks accept 719, unchanged from the preceding release: 225 aircon, 92 plumbing, 113 electrician, 97 handyman and 192 cleaning profiles. Of these, 390 have sourced service coverage and 329 have none. No service-location entries were dropped from accepted profiles. Exclusions remain recorded in `data/import-report.json`.

All 16 original write-ups remain unchanged. Logos retain their release checksums and existing withheld-logo handling. Pages remain noindex, rating schema is absent, and account and quote screens remain previews.

## Coverage presentation

Areas served appears immediately after Services & pricing and has a matching profile navigation link. Islandwide coverage has a badge. Town chips wrap, group by official region above eight towns and expand beyond twelve. Region statements remain region chips. Source URLs are deduplicated and retain capture dates. No section or navigation item appears without sourced coverage.

The single Area picker replaces the former office-address filter on search and trade pages. It supports typing, keyboard selection, grouped planning areas, Any area, clearing and reset. Area matching uses company statements only. A town match ranks before region coverage, then islandwide coverage, regardless of secondary sort. Unknown coverage is an explicit opt-in and ranks last. All active filters affect counts before pagination. URL parameters preserve selections on reload.

Official town-to-region mapping: [URA Master Plan 2019 Planning Area Boundary](https://data.gov.sg/datasets/d_4765db0e87b9c86336792efe8a1f7a66/view), under the [Singapore Open Data Licence](https://data.gov.sg/open-data-licence). The mapping contains 55 planning areas.

## Verification

- 55 JavaScript tests pass, including coverage evidence, ordering, no office-address inference, combined filters, counts, rendering, missing coverage and lossless index encoding.
- 15 Python tests pass.
- Rebuilt 740 pages. Site checks pass for all internal links, fragments, unique metadata, schema restrictions, publication totals, logos and protected write-ups.
- All trade HTML plus JSON payloads stay below 300 KB. Aircon is largest at 297.8 KB.
- Full map-pin check completed, with transient failures retried: 691 verified building pins, 28 address-only fallbacks, including 39 verified OneMap pins. Unresolved addresses never render an unverified map iframe.
- Browser checks at desktop 1366 x 900 and mobile 390 x 844. No horizontal page overflow was found. Area search, keyboard selection, reset, combined filters, URL reload and loading 12 more results work.
- Woodlands plus Plumbing gives 63 matches; 28 companies have unstated areas. With those included and a minimum 4.8 rating, there are 56 matches, 16 with published prices and 40 with WhatsApp. Reload restores the selection and counts.
- 338 Aircon shows an islandwide badge, eight towns and one source. Alldone Services shows region chips plus its islandwide statement. The current release has no published profile with regions alone and no islandwide statement; a pure region-only case is covered by a unit test.
- 24 Hours Plumbing Services has no Areas served section or navigation link. Ace Plumbing Specialist shows grouped towns and its 17-area expansion works.
- Additional mobile checks covered NILE Plumbing, Daylight Electrician, Lion City Aircon, SG1 Plumber, Evergreen Cleaning and Active Plumbing. No browser console errors appeared in those checks.

## Local review links

The isolated preview server binds only to this computer on port 8881. It serves Roster pages without loading the shared preview login for this local design review; production authentication files are unchanged.

- [Area-filtered search](http://127.0.0.1:8881/roster/search/?area=woodlands&trade=plumbing)
- [338 Aircon coverage](http://127.0.0.1:8881/roster/company/338-aircon/#areas-served)
- [Grouped areas](http://127.0.0.1:8881/roster/company/ace-plumbing-specialist/#areas-served)

Screenshots are saved beside the worktree in the task workspace:

- `service-areas-desktop.png`
- `service-areas-mobile.png`
- `service-areas-search-desktop.png`
- `service-areas-search-mobile.png`

Nothing from this branch has been pushed or deployed.
