# Roster import review: release 1044

Updated 12 October 2026. Imported the exact requested release `companies-20261012-1044.json`, also named by Drive's `db-expanded/releases/LATEST`.

Verified SHA256 before import:

- JSON: `84e57a61cc9acdfe68b87a2b6d5b9399d456177b5fa915b38cf0ea88934aaac2`.
- Logo bundle `logos-20261012-1044.tar.gz`: `42feb3616c5122eaab3ab3b6463bd034db1491e61143e6b46aa57d3fed47a78e`.

## Current build

- 6,478 source records, 719 published companies and 5,759 excluded records.
- 126 newly eligible listings and one withdrawal from release 2227. Skywave Solutions is now flagged commercial-only; its old URL redirects to the relevant trade directory.
- Trade totals: 225 aircon, 92 plumbing, 113 electrician, 97 handyman and 192 cleaning companies. There are 262 full profiles and 457 compact listings.
- 499 release logos installed and checked against per-image SHA256 values. Two existing curated images remain. The importer now validates static GIF and ICO images; original bytes are preserved. Twenty-one published companies retain initials because their logos are uncertain.
- Map checks produced 691 verified building pins, including 39 sourced OneMap address locations, and 28 address-only fallbacks. Fifty of the previous 55 unresolved pins are fixed. No previously verified pin regressed. Unit details stay out of map requests, captions and directions.
- The 28 fallbacks comprise 24 Google place/postal conflicts, two OneMap address mismatches, one missing usable CID/postal pair and one place marker that could not be matched. PS Home Maintenance's released coordinates point to a different street and remain hidden. Home Plumbing Services has only a district and postal code in its published address, so the building match remains unresolved.
- All 16 original source write-ups remain protected. Matching, sourced postals fill missing fields for 1st Electrical and SK Electrical without replacing their text. Billy Aircon remains withheld under its existing flag.
- Company-site widget scores and self-reported scores are excluded from averages. Trustpilot TrustScores remain visible as separate sources. Full profiles without a real rating show "No rating yet" rather than sample figures.
- Per-unit price calculations and minimum quantities supplied by the release appear alongside the original totals and conditions.
- All 739 generated pages remain noindex. Authentication and the account, quote and claim previews are unchanged.

## Validation

All 39 JavaScript tests and 15 Python tests pass. Site checks validate generated pages, internal links and fragments, metadata, schema restrictions, publication counts and the original write-ups. Repeated JSON field names are now encoded as column indexes and decoded losslessly in the browser. The largest trade HTML plus index is 292.7 KB, within the existing 300 KB limit.

Browser review covered AirCare+, Sauber Cleaning Services, Lion City Aircon, Daylight Electrician, SK Electrical, 1st Electrical, CleanAndFix, PS Home Maintenance, CBM Home and BCD Engineering. Checked headings, maps or address fallback, rating displays, logo or initials presentation, and page width. CleanAndFix's new OneMap building pin was visually confirmed. Lion City's Trustpilot score is visible separately from its Google-based average.

Desktop filtering and load more passed at 1440px. Mobile checks at 390px and 320px covered new logo/profile rendering, service and FAQ disclosures, search, rating and location filters, sorting, save/unsave and dynamic filter counts. The Eunos plumbing search with a 4.8 minimum returns three matches, with zero published-price matches and two WhatsApp matches. Selecting WhatsApp narrows it to two, and saving a company updates the saved count immediately. No horizontal overflow was found in the sampled mobile views.

## Previous review: release 2227

The following historical review is retained for the audit trail.

Updated 11 October 2026. Imported the exact requested release `companies-20261011-2227.json`, also named by Drive's `db-expanded/releases/LATEST`.

SHA256 verified before import: `aa9c2a9bd84ca484b66310a6615cee9614b33cdeb758303f2569eaabb8148914`.

## Current build

- 5,444 source records, 594 published companies and 4,850 excluded records.
- Seven newly eligible listings and no withdrawals from the previous published release.
- Trade totals: 205 aircon, 83 plumbing, 94 electrician, 82 handyman and 130 cleaning companies.
- Imported the matching `logos-20261011-2227.tar.gz` bundle. All 410 installed release images match their per-image checksums. Two existing curated images remain available.
- The release removes 102 previous logo references and flags other images as uncertain. Twenty published companies have an uncertain logo, so the importer shows initials while preserving each audit reason. Four additional uncertain logos belong to excluded records. Photo fallback cannot reinstate an uncertain image.
- Map check rerun: 539 verified building pins and 55 address-only fallbacks. All previously verified pins retain verified status. Fallbacks comprise 48 place/postal conflicts and seven missing usable CID/postal pairs. There were no network failures. Unit numbers stay out of map captions and directions.
- 614 generated pages pass site checks. All 16 original write-ups remain protected. Billy Aircon remains withheld under its existing flag.
- All pages remain noindex. Rating schema, preview authentication, account forms, quote forms and claim forms are unchanged.

## Validation

All 34 JavaScript tests and eight logo-import/framing tests pass. The complete site check validates pages, internal links, fragments, metadata, schema restrictions, publication counts and the original write-ups. The largest trade page plus JSON index is 296.3 KB, within the 300 KB limit.

Browser review covered the seven newly published companies plus 338 Aircon, Lion City Aircon and Daylight Electrician. Reviewed page headings, section order, logo or initials rendering, map or address fallback and noindex metadata. Desktop directory layout was checked at 1440px and mobile cards at 390px. The new U-Home logo loads correctly and the long business name wraps without horizontal overflow. Mobile search for Reliable shows two matching companies and updates the price and WhatsApp counts to one and two respectively.

The existing compact laptop layout and dynamic filter-count fixes remain in place.

## Previous review: release 1509

The following historical review is retained for the audit trail.

Updated 11 October 2026. Imported the exact release named in Drive's `db-expanded/releases/LATEST`: `companies-20261011-1509.json`.

SHA256 verified before import: `d8c61fe128810b6e1161f9cc3366baccf7cd258fcb5769b2013884e4c840ce45`.

## Current build

- 5,444 source records, 587 published companies, 4,857 excluded records.
- 57 newly eligible listings and four withdrawn listings relative to release 1337.
- 119 full profiles and 468 compact listings. All 16 original write-ups remain unchanged in the protected source data.
- 529 company logos installed from `logos-20261011-1458.tar.gz`. Every installed image matches its own checksum in release 1509. Images without usable source records retain initials placeholders.
- Additional rating platforms are imported into the existing weighted average. The source date, source link and collection notes remain available. Unknown counts are not treated as one review, and mirrored Google widgets do not inflate totals.
- Actual rating records replace the sample review panel where available. No rating or review structured data was added.
- Map check rerun: 534 verified building pins and 53 address-only fallbacks. The fallbacks comprise 46 postal-code conflicts and seven records without a usable CID/postal pair. There were no network failures. Unit numbers remain excluded from map captions and directions.
- 607 generated pages, including five unavailable-listing redirects. Every page remains noindex. Auth, quote and claim previews are unchanged.

| Primary trade | Published | Full profiles | Excluded |
| --- | ---: | ---: | ---: |
| Aircon | 202 | 51 | 1,697 |
| Plumbing | 82 | 22 | 357 |
| Electrician | 92 | 16 | 2,018 |
| Handyman | 82 | 13 | 302 |
| Cleaning | 129 | 17 | 483 |

## Withdrawn listings

Aeon Environmental Services, Greengarden Integrated Services and SQ 1 Development are now marked commercial-only. City Cleaning lacks sourced About content, services and an owned company website. These four previously published URLs redirect to the home-cleaning directory, without republishing excluded business details. Billy Aircon remains withheld under the existing release flag and redirects to the aircon directory. All slugs remain reserved.

## Validation

27 JavaScript tests and eight logo-import/framing tests pass. The site check validates every generated page, local link, fragment, logo checksum, source link, metadata rule and original write-up. The largest trade page and JSON index total 294.3 KB, within the existing 300 KB limit. Unused optional directory fields were omitted to keep the larger release within that limit. Browser checks covered ten original and imported company pages, an additional SVG logo, mobile layout, combined rating totals, directory search, average-rating filtering, sorting, save/unsave and load more. The refreshed Evergreen map was inspected at its verified Tampines building pin.

## Logo display update

The rebuild measures 515 raster assets, including two existing images, and keeps 16 SVGs in their original viewBox. CSS adjusts the framing of 326 padded logos, gives 233 horizontal wordmarks wider tiles, and puts 20 predominantly white transparent logos on a dark background. The SHS logo now fills its tile and its white lettering is visible. Compact and mobile tiles are slightly larger. Original images and their release checksums are unchanged. The generated stylesheet is shared and cached across pages, with no extra company data in the directory indexes.

Browser checks verified SHS in dynamically filtered plumbing results and ten representative company profiles at mobile width, including an SVG, padded artwork, wide lettering and white logos. SHS and Xool also received desktop visual checks. All sampled logos loaded and no horizontal page overflow was found. The initial logo update was published in commit `d3cc64b03`. A subsequent mobile audit found compact grid tracks expanding on narrow screens and save buttons extending beyond their title row. The follow-up constrains each grid track, allows long company names to wrap, and reserves a 44px save control. All 587 listing cards now pass the 320px layout check, with filters, save/unsave and loading more results also verified. Medium-width wordmarks now receive wider tiles too. Profile title columns can shrink beside logos; below 360px the logo sits above the title so long company names do not expand the page. Five representative profiles pass at 320px, 390px and 430px.

## Previous review: release 1337

The following historical notes describe the earlier release and are retained for its audit trail.


Updated 11 October 2026 on `roster-db-import`, following `REVIEW-2026-10-11-1340-roster-review.md` and Martin's map-pin request.

## Release and publication status

The site uses checksum-verified `companies-20261011-1337.json`, SHA256 `388f7b4803c2bc2ed186ed9074a3870c2b6ecf7d41e6218482acfa04f4723de7`. The review's warning about release 1204 was already resolved. The database has 5,444 rows and 624 profiled records. Publication safeguards admit 534 companies and exclude 4,910 records with reasons in `data/import-report.json`.

The previous import and design work was committed and published with Martin's approval. The average-rating and claim-autocomplete update was deployed as `25f534197`. This follow-up addresses the remaining review items and accurate maps.

## Fuller profiles and compact listings

108 published records meet `profile_bar.meetsFullBar`; 426 are limited listings. The source has 117 full-bar records overall, but nine fail the site's independent publication checks. The source flag does not override publication safeguards.

Trade and job pages lead with up to eight eligible full-bar companies, ordered by evidence completeness, then average rating and review count. Other companies appear in compact rows with prominent averages, a price or quote prompt, services and direct contact. Search, filtering and alternate sorting apply to both groups. Additional compact rows load in batches of 12. Existing company URLs remain stable.

| Primary trade | Published companies | Full-bar profiles |
| --- | ---: | ---: |
| aircon | 185 | 48 |
| plumbing | 68 | 19 |
| electrician | 84 | 15 |
| handyman | 76 | 11 |
| cleaning | 121 | 15 |

Non-full-bar company pages use a smaller layout and a visible "Limited details" note. Available sourced services, prices, contact details and reviews remain accessible. All 16 original hand-written source objects remain unchanged; they are not replaced by generated summaries. Fifteen have available listings. Billy's withdrawn public URL redirects to the aircon directory without republishing its withheld profile.

## Maps

479 cited place markers matched the published postal code and Singapore coordinates. 48 place/postal conflicts and seven records without the necessary identifiers show an address card with no map. Raw address searches are no longer embedded. Verified maps display a building-level coordinate pin at zoom 17, and directions use the same coordinates. Unit details are omitted from public captions and map requests. A changed address invalidates its cached pin.

`data/map-pins.json` records source URL, capture date, postal match and address hash. `scripts/verify-map-pins.py` refreshes this cache independently of database import. It does not update review scores or other business data. Browser verification confirmed Evergreen's actual Tampines building pin without a unit popup.

See `ADDRESS-MAP-COLLECTION.md` for the collection instructions prepared for Grok and other bots.

## Prices and contact evidence

- Units, quantities, monthly sessions, GST and other conditions come from the pinned release. The website does not infer a missing unit. Database-inferred units retain their explicit qualifier.
- UI noise such as Login, cart quantity buttons, phone-only labels and FAQ questions uses the named job as the public price label. Original excerpts remain accessible.
- Sin & Goh's power-trip range is already S$50 to S$200 in release 1337, including `amount_max_sgd`. It is not truncated by this build. The 6 Days Cleaning record is excluded for missing sourced About content; its raw cart-label problems stay in the bot collection guide.
- Alternate numbers retain their own source label and show "Checked <date>" only when that source record has a date. An absent date is not replaced with the company's date.
- Full-bar depth and missing electrician/handyman job prices remain data-collection work. No prices, service coverage or review sources were invented to promote a listing.

## Removed or withheld URL audit

The 13:40 review counted 64 deletions in a temporary uncommitted build. That exact intermediate manifest was not retained, so this audit covers all 83 currently reserved but unpublished slugs instead of asserting a reconstructed list of 64. The table gives the current exclusion reasons from the pinned release.

The last public release before the database import (`407aaa6f1`) had 16 company pages. Billy Aircon is the only one absent from the current published-company set. Its URL now redirects to the aircon directory. The other withdrawn slugs were not present in that public release. They stay reserved so later imports cannot reuse their URLs for unrelated companies.

| Slug | Exclusion reasons |
| --- | --- |
| `24-hour-plumbing` | site-spam-injection |
| `24-hours-electrician-lotus` | missing-sourced-about |
| `2cool-air-conditioning-pte-ltd` | website-not-company-site |
| `3322coolair-pte-ltd` | missing-sourced-about |
| `6-days-cleaning` | missing-sourced-about |
| `7days-aircon-service-singapore` | site-placeholder-content, site-placeholder-content-detected |
| `a-class-aircon-management` | missing-sourced-about |
| `a-stop-solution` | missing-sourced-about |
| `ac-aircon-services` | missing-sourced-about |
| `affordable-electrician-services-singapore` | no-sg-postal-code |
| `aircon-guru-engineering-pte-ltd` | missing-sourced-about |
| `aircon-servicing` | missing-sourced-about |
| `aircond-service-centre-pte-ltd` | missing-sourced-about |
| `airconman-aircon-servicing-repair-singapore` | possible-duplicate |
| `airconman-sg-pte-ltd` | possible-duplicate |
| `airemax-aircon-pte-ltd` | missing-sourced-about |
| `airloft-by-poh-meng-engineering` | missing-sourced-about |
| `all-best-air-conditioning-electric-pte-ltd` | missing-sourced-about |
| `alpha-omega-trinity-pte-ltd` | missing-sourced-about |
| `alphakleen-services` | missing-sourced-about |
| `apple-cleaners-singapore-professional-cleaning-services` | missing-sourced-about |
| `arkin-pte-ltd` | missing-sourced-about |
| `bencool-services-professional-aircon-services-airconditioner` | missing-sourced-about |
| `billy-aircon` | no-sg-postal-code |
| `bsh-engineering-ptd-ltd` | missing-sourced-about |
| `chillman-aircon` | website-not-company-site |
| `cleanaxisco-pte-ltd` | missing-sourced-about |
| `cleanhub-facility-pte-ltd` | missing-sourced-about |
| `competent-electrician-hougang` | website-not-company-site, possible-duplicate |
| `ct-air-con-group` | site-spam-injection |
| `d-k-construction-engineering-pte-ltd-handyman-renovation-ser` | missing-sourced-about |
| `divine-cleanse-llp` | website-not-company-site |
| `east-tan-aircon-engineering-service` | missing-sourced-about |
| `easy-cool-engineering-pte-ltd` | missing-sourced-about |
| `eco-electricians-contractor-pte-ltd` | missing-sourced-about |
| `effie-cool-service-singapore-aircon-servicing` | missing-sourced-about |
| `elan-electrical-services-pte-ltd` | missing-sourced-about |
| `electric-repair-sg` | missing-sourced-about |
| `empire-cleaning-home-services` | missing-sourced-about |
| `express-plumbing-elect` | missing-sourced-about |
| `finest-services-pte-ltd` | missing-sourced-about |
| `gj-plumbing-jetting-pte-ltd` | missing-sourced-about |
| `handyman-german-maintenance-workshop-services` | missing-sourced-about |
| `handyman-home-fiz` | missing-sourced-about |
| `handyman-services-24` | missing-sourced-about |
| `handyman-services-singapore` | missing-sourced-about |
| `huat-plumbing` | missing-sourced-about |
| `hydrotec-services` | missing-sourced-about |
| `integer-building-services` | missing-sourced-about |
| `ironing-maids-home-ironing-cleaning-service-singapore` | missing-sourced-about |
| `jb-house-cleaning-services-perfectionist-cleaning-business` | not-singapore |
| `jd-waterworks` | missing-sourced-about |
| `just-cool-aircon-engineering-pte-ltd` | no-sg-postal-code |
| `k2l-aircon` | missing-sourced-about |
| `kat-electrical-engineering-pte-ltd` | site-spam-injection |
| `kc-plumbing-electrical-renovation` | missing-sourced-about |
| `kleeno-cleaning-services` | missing-sourced-about |
| `lightning-air-conditioning-services` | site-spam-injection |
| `luxury-air-con-engineering-services` | missing-sourced-about |
| `metrocleaners` | missing-sourced-about |
| `one-stop-handyman-pte-ltd` | missing-sourced-about |
| `part-time-maid` | missing-sourced-about |
| `pc-handyman-services` | website-not-company-site |
| `plumbermeng-98530163-singapore-s-premier-plumbing-specialist` | missing-sourced-about |
| `plumbing-hub-express` | website-not-company-site |
| `primeasia-plumbing-sanitary-pte-ltd` | missing-sourced-about |
| `reliable-plumbing-services-u-home-plumbing-engineering` | missing-sourced-about |
| `saikon-contractors` | missing-sourced-about |
| `sembawang-lighting-house-pte-ltd` | missing-sourced-about |
| `sin-hong-yong-pte-ltd` | missing-sourced-about |
| `sk-plumber` | missing-sourced-about |
| `sky-blue-aircon-engineering-pte-ltd` | missing-sourced-about |
| `skyteam-electrical-pte-ltd` | missing-sourced-about |
| `south-air-conditioning-refrigeration-services` | missing-sourced-about |
| `supercool-aircon` | missing-sourced-about |
| `superten-plumber` | missing-sourced-about |
| `tech-lai-integrated-pte-ltd` | missing-sourced-about |
| `thetop-aircon-service` | missing-sourced-about |
| `tth-handyman-engineering-construction-warehouse` | missing-sourced-about |
| `vim-engineering-pte-ltd-24-7-plumbing-services-singapore-lic` | Not included in pinned release |
| `wefix4u` | missing-sourced-about |
| `west-cloud-air-con` | website-not-company-site |
| `wi-electrical-pte-ltd-lew-singapore-electrical-license-renew` | missing-sourced-about |

## Validation and safeguards

Importer and presentation tests cover blocking flags, checksum integrity, original copy, stable slugs, full-bar metadata, shortlist membership, real weighted averages, phone dates, price labels, package units and company-name matching. Site checks cover all generated pages, local links, metadata, noindex, source pin coordinates, compact/full profile separation and the 300 KB HTML plus JSON budget per trade.

No rating, review or offer structured data is emitted. Preview authentication is unchanged. Account, quote and listing-claim forms remain local previews that send and store nothing. Pages remain noindex. Sample multi-source review figures remain labelled and separate from real averages.

Remaining source-data issues include price extraction and unmatched map addresses. Consult `data/import-report.json`, the map-pin cache and the collection guide for the queues. This update does not claim that all source records have been manually verified.
