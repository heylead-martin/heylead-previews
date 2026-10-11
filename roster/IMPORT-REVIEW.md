# Roster import and site review

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
