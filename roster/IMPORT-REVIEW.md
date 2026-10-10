# Roster import review

Prepared 10 October 2026 on `roster-db-import`. Local review only. Nothing pushed or published. Publishing requires Martin's approval.

## Release

- File: `companies-20261010-2242.json`
- SHA256 verified against the release sidecar: `b13c99085c67d96003e00b7688bc2ecec3a0e9f522a1723da299de01fe5f74fa`
- Source rows: 5,444
- Company pages included: 577
- Source rows excluded: 4,867
- Generated pages: 591

| Trade | Included | Excluded |
| --- | ---: | ---: |
| Aircon | 202 | 1703 |
| Plumbing | 82 | 426 |
| Electrician | 109 | 2573 |
| Handyman | 86 | 301 |
| Home cleaning | 123 | 575 |

Trade totals overlap because a company may serve several trades.

## What changed

The reusable importer reads the verified release selected by LATEST, preserves stable slugs, logs exclusions, and keeps the original profile baseline. Pages combine services, prices and expandable explanations, with sourced company summaries and additional details. Reviews remain directly above FAQs.

There are 571 sourced summaries, 210 company-specific FAQ sets, 204 warranty records, 145 founding-year records, 159 advertised emergency-availability records, 95 brand lists, 63 response-time records, 61 payment-method lists and 313 social-link sets. Fields are displayed only where supplied and sourced. Ratings remain dated source sentences.

Trade directories support location, price, Google rating, review, WhatsApp and saved-company filters, sorting and load more. Search covers all included profiles. Account and quote screens remain unsent previews. Noindex and the existing preview authentication remain in place.

## Original profiles

All 16 hand-written profile objects are unchanged in `data/profiles.json` and preserved in `data/curated/`. Fifteen currently have generated pages.

Billy Aircon is withheld because the new release flags `no-sg-postal-code`. The explicit exclusion rule has been applied without deleting its write-up. Martin was asked whether to retain its original page pending verification. Fix or clear the release flag before a later import to restore the page.

338 Aircon's invalidated property.co review link returned 404 in the supplied spot-check. That excerpt was removed. Its original company write-up remains unchanged.

## Data issues requiring review

- 138 profiles contain automatically extracted pricing text that needs editorial review. The importer retains original wording behind disclosures and uses "See source details" when a field is a paragraph rather than a short price. It does not turn extracted amounts into an invented rate card.
- Examples: City Cooling includes repeated page-title pricing references and an eight-unit label beside a chemical-wash excerpt that does not establish that quantity. MCAAS has a carpet-cleaning excerpt assigned to the mattress job. Correct these in the next database release before public launch.
- 8 profiles have general or indicative pricing, shown separately from company rates.
- 55 profiles have alternate phone records. Only the supplied primary phone is shown.
- 149 profiles have alternate address records. Primary addresses are retained; map embeds and directions omit unit numbers.
- The supplied spot-check could not re-find Google listings for IJ Handyman, Commercial Engineering, DW Deep Cleaning and Doctor Cool. Their dated source snapshots are not newly verified ratings.
- The spot-check specifically recommends human review of AFRA's conflicting contact numbers and Doctor Clean's business model. These are non-blocking source caveats, not resolved findings from this build.
- New blocking flags also withhold spam-affected sites, duplicate candidates and the non-Singapore cleaning record. Complete reasons are in `data/import-report.json`.

## Validation

- 12 importer and data-rule tests passed.
- 591 generated pages passed local link and fragment checks, unique titles and descriptions, noindex, schema restrictions, section order, map privacy and source-count checks.
- All 16 original write-ups match their baseline exactly.
- Repeating the verified release import and build produced byte-identical generated data and pages.
- Ten deterministic random company pages rendered with populated sections, no invalid data placeholders and no horizontal overflow at 1440px.
- At 390px, service disclosures, source conditions and company FAQs worked, with 16px body text and no horizontal overflow. Google Maps loaded at block level.
- Browser checks covered search, empty results, filters, sorting, load more, saved-company toggling and dynamic results.
- HTML plus JSON per trade: Aircon 245.0 KB, Plumbing 121.3 KB, Electrician 147.5 KB, Handyman 123.8 KB, Home cleaning 161.0 KB. All below 300 KB.

## Local review links

The temporary local review server is on port 8880. It bypasses preview authentication only in its local responses, without changing deployed authentication files.

- Directory: http://127.0.0.1:8880/roster/aircon-servicing/
- AC Hub, including sourced FAQs: http://127.0.0.1:8880/roster/company/ac-hub-pte-ltd-city-ice-air-conditioning/
- MCAAS, including pricing extraction issues: http://127.0.0.1:8880/roster/company/mcaas-solutions-pte-ltd/
- Cool Aircon, original write-up and unified service pricing: http://127.0.0.1:8880/roster/company/cool-aircon/

Use `README.md` for future import and validation commands. Do not merge or push until Martin reviews the preview and approves publication.
