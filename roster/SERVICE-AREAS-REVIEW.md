# Roster review - 13 October 2026

Branch: `service-areas-1253`. Local review only. Nothing merged, pushed or deployed. Stop for Martin's approval after this review. Starting commit: `6849b64b029a70599750198e1aeb80b242dce1c1`. The review is recorded in the commit named `Fix Roster evidence display and park unfinished public features`.

## Release and published counts

- Companies: `companies-20261012-1253.json`
- Verified SHA256: `3850fc0b4891afd5a2940f5efaaa9a958d88014af24b7fd454e70d5190cff352`
- Logos: `logos-20261012-1253.tar.gz`
- Verified SHA256: `d6c7cdd1d02919ab4e1539ba0c737741b353376acf2738716f64456b05e81013`
- Reimported this exact release after fixing the importer. No later release was substituted.

| Trade | Full bar | Compact | Published total |
| --- | ---: | ---: | ---: |
| Aircon | 80 | 145 | 225 |
| Plumbing | 24 | 68 | 92 |
| Electrician | 48 | 65 | 113 |
| Handyman | 63 | 34 | 97 |
| Cleaning | 47 | 145 | 192 |
| Total | 262 | 457 | 719 |

These are published profile classifications, not the number initially shown in a directory. A directory initially shows up to eight full cards and loads compact results in batches of twelve. Area filtering uses one compact list to preserve coverage ordering.

The source contains 6,478 rows and 845 profiled records. Its release describes 794 publishable records; the site's existing stricter evidence gates accept 719. All 16 original write-ups pass the preservation check. There are 390 profiles with sourced service coverage and 329 without it. All accepted service-location entries remain intact.

## Completed fixes

- Ninety published companies have explicit, dated quote-on-request statements. Cards, shortlist data and Services & pricing now show `Quote on request` with the linked `Their site` excerpt and capture date. AFRA's quotation statement is visible even when its service row is collapsed. Missing evidence retains the generic fallback. Indicative price qualifiers remain intact.
- Initials tiles show initials only. There are 499 real self-hosted logos and 220 initials tiles, including 21 uncertain logos deliberately withheld. Ownership/removal notes appear below real logos and in the footer. Mobile tile height and note spacing were corrected to avoid overlaps.
- `/roster/logo-removal/` explains the removal process and clearly says the contact route is pending. Martin requested that the inbox remain pending. No email address, SMTP service or submission backend was added.
- All 61 profiles without an eligible rating use the requested no-ratings wording. Eight self-reported ratings appear as plain linked company claims, with no stars. They do not enter averages or sorting. Trustpilot and company-site widgets remain excluded from averages.
- Five Pexels photos replace the generated hero imagery. Each depicts hands, tools or equipment, with no faces or visible brand logos. Files are pinned by ID, self-hosted at two sizes, checksum-recorded and credited. Rotation and pause/resume still work. Guides and share images use the same approved assets. See `HERO-PHOTOGRAPHY.md` for all URLs.
- Account, saved, quote and matching features are retained behind the default-off `previewFeatures` flag. Public navigation, save buttons, quote panels and AI entry points are absent. Direct feature URLs show a connection-pending page without input forms or feature scripts. Quick search and direct company contact remain available. The build and deployment workflow produce disconnected account configuration without reading account env values.
- Noindex remains on. Structured data contains no review ratings/stars, offers or dollar symbols. Alternate phones retain their source label. Area filtering and Areas served remain intact.

## Checks and visual review

- Build completed: 760 pages.
- JavaScript: 92 tests passed, zero failures.
- Python: 15 tests passed, zero failures.
- Site checker: zero broken internal links or fragments; publication totals, all 16 protected write-ups, metadata and schema checks passed.
- Generated pages contain none of the forbidden undefined/null/NaN/mojibake/placeholder tokens.
- Editorial checker: 20 core pages, 24,907 editorial words, valid contents, FAQs and indexing safeguards.
- Isolated local PostgreSQL RLS check passed: private reads, guest denial, cross-account insert/update/delete denial, slug constraints, duplicate handling, own-row deletion and cascade. This used no hosted Supabase connection or configuration changes.
- Staged Pages artifact passed: disconnected public account configuration and no local env files, credentials, CLI state or dependencies.
- Largest trade HTML plus JSON is aircon at 252.4 KB. All five are below 300 KB.
- Full map-pin recheck with retries: 690 verified building pins and 29 address-only fallbacks, including 39 OneMap building pins. Unresolved pins never render an iframe. Public map addresses omit unit numbers, including HDB units.
- Desktop at 1366 x 900 and mobile at 390 x 844: profile layouts, real logos and initials, quote-source rows, listing cards and hidden feature routes checked without horizontal overflow. Fixed the empty right-hand directory column after hiding the quote sidebar.
- Homepage rotation changed the photo, category, browse target and credit together. Pause changes to Resume and stops rotation. Mobile homepage imagery and search remain readable.
- Filter interaction: plumbing search plus Woodlands and 4.8 rating returns 87 matches, with 27 published-price and 65 WhatsApp counts. Selecting Published pricing returns 27 matches and updates WhatsApp to 22. Switching to Bedok returns 88 matches, with 33 unstated-coverage companies offered separately. URL reload preserves filters.

## Pages checked locally

The local server binds to 127.0.0.1:8881 and serves this worktree. Shared production preview authentication files were not changed. Local-only stubs allow review without a preview login.

| Page | What was checked | Local URL |
| --- | --- | --- |
| Homepage | Pexels photos, rotation/pause/credit, quick search, mobile | http://127.0.0.1:8881/roster/ |
| Plumbing | Full cards, compact cards, logos, no saved/quote UI | http://127.0.0.1:8881/roster/plumbing/ |
| Filtered search | Area/rating/price counts, reload, compact mobile cards | http://127.0.0.1:8881/roster/search/?q=plumbing&area=bedok&rating=4.8 |
| 338 Aircon | Islandwide badge plus eight towns, separate own-site rating | http://127.0.0.1:8881/roster/company/338-aircon/#areas-served |
| Alldone Services | Five region chips plus islandwide; no towns | http://127.0.0.1:8881/roster/company/alldone-services-pte-ltd/#areas-served |
| 24 Hours Plumbing Services | Missing coverage hides section and navigation item | http://127.0.0.1:8881/roster/company/24-hours-plumbing-services/ |
| AFRA | Explicit quote evidence, initials, alternate phone source | http://127.0.0.1:8881/roster/company/afra-engineering/#pricing |
| Kiasu Plumber | Exact no-ratings message | http://127.0.0.1:8881/roster/company/kiasu-plumber/#reviews |
| Cool Earth | Plain own-site claim separated from Google average | http://127.0.0.1:8881/roster/company/cool-earth/#reviews |
| Handytech SG | Unresolved pin withheld from map rendering | http://127.0.0.1:8881/roster/company/handytech-sg/#contact |
| Sign-in, saved, matches | Connection-pending placeholders, zero forms | http://127.0.0.1:8881/roster/sign-in/ and /roster/saved/ and /roster/matches/ |
| Logo removal | Clearly pending inbox, no submission | http://127.0.0.1:8881/roster/logo-removal/ |

The release has no published regions-only company without an islandwide statement. Alldone is the closest real profile. A separate pure regions-only fixture passes in the automated service-area tests. No data was invented to create a screenshot case.

Screenshots are beside the worktree in `../review-20261013/`: `home-desktop.png`, `home-mobile.png`, `listings-mobile.png` and `afra-mobile.png`.

## Parked features, separately

1. **Supabase sign-in/sign-up/recovery:** retained, hidden, disconnected by default. Needs a separately approved activation task, email delivery provider, confirmation/reset delivery testing and callback/session validation. Google OAuth additionally needs owner-approved provider/client configuration and login testing. No provider or keys were configured in this review.
2. **Saved lists:** retained and hidden. Needs working accounts, verified hosted private saved-company schema/RLS, and signed-in cross-device save/remove and guest-merge testing. Pure logic and isolated RLS tests pass; this is not a claim that hosted account flows are production-ready.
3. **Quote sidebar and request flow:** retained and hidden. Needs a real request backend, recipient/contact-sharing rules, spam protection, delivery provider and success/failure handling. WhatsApp versus email is still a product decision. Nothing is sent or stored by the preview.
4. **Matches / AI search:** retained and hidden. Current matching is deterministic local service/area keyword matching. Needs either an honest launch as local matching or a separately approved server-side AI integration. Sending requests to its selected companies also depends on the quote backend above.

## Data issues and pending decisions

- Handytech SG's previously usable Google embed no longer returned a matching place marker on recheck. It is now one of the 29 address-only fallbacks; a verified building location is needed to restore its map. Transient network failures for three other profiles passed after retry.
- Twenty-one logos remain uncertain and correctly use initials. Their reasons remain in `data/presentation.json` and the import report.
- Own-site rating counts differ from independent Google snapshots for some companies. For example, Cool Earth says 66 on its site versus 65 in its Google snapshot; 338 Aircon says 10,338 versus 10,711. These are separate claims, never averaged together.
- Self-reported rating objects for 338 Aircon, Mr Plumber and Repair.sg lack a capture date. The plain attributed claims remain separate; no date was invented.
- The removal inbox remains deliberately pending. That link cannot yet accept a request.
- No email provider exists. Accounts and request delivery remain parked.

No remote settings, SMTP configuration, Supabase schema or keys were created or changed. No merge, push or deployment was performed.

## Follow-up: separate guides from directories

At Martin's request, the five long trade guides now have their own pages: `/roster/home-cleaning/guide/`, `/roster/plumbing/guide/`, `/roster/electrician/guide/`, `/roster/handyman/guide/` and `/roster/aircon-servicing/guide/`. All 20 editorial guides are now standalone. Directories have a compact guide link card instead of the full article. The previous `#guide` anchors still land on that card.

Homepage cards, footer links, related guides and in-article links now use the new URLs. Each guide has its own canonical, Article and FAQ schema, a contents panel and a link back to company browsing. Directories retain CollectionPage/ItemList schema and do not duplicate the article or its FAQs. Noindex remains on. The 1,000-word minimum and all existing editorial copy are preserved.

Validation: 765 generated pages, zero broken internal links/fragments, 92 JavaScript tests and 15 Python tests passed. All 20 editorial pages pass their existing word-count, FAQ and metadata checks plus new directory/guide separation checks. The cleaning directory and new guide were checked at 1366px and 390px, including the old anchor, guide link, contents and return link. New screenshots are `../review-20261013/cleaning-guide-link-desktop.png`, `cleaning-guide-desktop.png` and `cleaning-guide-mobile.png`.

Company totals, release data and parked features are unchanged. This follow-up remains local, with no merge, push or deployment.


## Grok review follow-up: 14 October 2026

Reviewed `GROK-REVIEW-RESPONSE-20261013.md`. Changes remain local on `service-areas-1253`, after commit `4a4e4d422`. No merge, push, deployment, account activation or data release import.

- B1 fixed in the shared renderer: Direct Plumber keeps `3,388+ reviews`; Repair.sg keeps `more than 3,000 reviews`. Existing recorded excerpts provide these qualifiers. New releases can use `self_reported_rating.count_qualifier` with `plus`, `more_than` or `exact`. A missing field falls back only to a qualifier attached to the matching number in the recorded excerpt. Another count or a homes-served number does not supply the qualifier. Import preservation is tested. Independent averages and sorting remain unchanged.
- B2 fixed in page output: retired `The sort uses...` sentences are removed from public rating notes while source comparisons remain. The immutable release and raw archived notes are unchanged; their cleanup belongs in the next release. A site-wide check now rejects obsolete sorting claims.
- B3 fixed: all three single-excerpt pages (Repair.sg, Mr Plumber and SoCool) use `1 sourced excerpt`. A site-wide grammar check prevents regression.
- B4 to B6 remain data work: Reliable Electrical's scraped address, formatting/street corrections, and the unresolved Flash/SIGNATURE company identity. None was silently rewritten from review notes.
- Grok proposes 20 official address matches and three confirmed logos. They still need a checksummed release, logo provenance and map-pin verification after import. The current snapshot remains 690 verified pins / 29 unresolved, 499 real logos / 220 initials, with 21 uncertain logos. Do not report the proposed resolutions as imported.
- 338 Aircon and Cool Aircon have conflicting or changed counts. No new count or capture date was invented or imported. Keep them as self-reported and separate from independent ratings; resolve conflicting count representation with the new release.

Validation: rebuild 765 pages / 719 profiles; 95 JavaScript tests and 15 Python tests pass; editorial checks pass for 20 guides / 24,907 words; site checks find zero broken internal links or fragments and no forbidden text, obsolete sorting notes or singular/plural errors. The original 16 write-ups, noindex, structured-data restrictions, parked features and Areas served checks pass. Trade counts and page budgets are unchanged.


The renderer also supports an explicit `self_reported_rating.count_conflict: true`, displaying the company-claimed rating with a statement that its pages give different counts, instead of an exact count. Missing counts have no invented total. This support is ready for the next data release; no current record was marked conflicting automatically.

Browser follow-up: Repair.sg and Direct Plumber count wording and Sureclean/1st Electrical source disclosures checked at 1366 x 900; Repair.sg checked at 390 x 844. No horizontal overflow. Screenshot: `../../review-20261014/repair-sg-mobile.jpg`. See `GROK-REVIEW-FOLLOWUP-20261014.md` for the next-release evidence and field requirements.


## Release r13 import, fixes and new content: 15 October 2026

Local work on `service-areas-1253`. No push, deployment, account activation or Supabase change. This section summarises the rounds of work done today.

### Import of `companies-20261014-1546.json`

- Release SHA256 `960ac87d0ff724e39c14a18f3acd361df58d23af3886c3d35d1a0a8e93e5421b` and logo bundle SHA256 `5e276c9507b4b1fb962392bf49dc8d855266561efe6b8a0ffff66165fca146fc` matched their sidecars before import.
- Published profiles: 717 (was 719). Aircon 224, plumbing 92, electrician 112, handyman 97, cleaning 192. Full / compact 262 / 455.
- Withheld: SIGNATURE ENGINEERING (`flash-aircon`, `website-not-company-site`) and Reliable Electrical Services (no sourced address). Both URLs now show the existing "listing unavailable" page.
- Map pins after a full `verify-map-pins.py` rerun: 709 verified, 8 address-only (ARAS, Ezycontractors, GD Plumbing, Handytech SG, Kiasu Plumber, LS Plumber, MY Plumber, PS Home Maintenance). OneMap-verified pins rose from 39 to 59, so all 20 proposed pins verified.
- Logos: 502 real, 215 initials. cleanLAD, HelperGo and RenoExpert added.
- 338 Aircon shows its self-reported rating with no count ("its pages give different review counts"). Direct Plumber shows `3,388+`, Repair.sg `more than 3,000`.

### Site fixes

- Price labels: amounts stripped by the release ("begins at .", "(as low as )", "Frm") and mid-word truncations are tidied at render time by `tidyPriceLabel()`; stored data and excerpts are unchanged. Unit-tier labels in rate tables fall back to the job name.
- Grammar: "1 unit", "Minimum 1 unit", sentence-case unit notes.
- Parked features: public copy no longer describes saved lists, quote requests or matching as available; parked routes have "not available yet" titles and descriptions.
- Profiles: single "No ratings found yet" sentence, "Some details unconfirmed" banner on the 8 original write-ups below full bar, Kiasu Plumber address highlight points to Location & contact, partial excerpts marked with ellipses, h3 service headings, no empty area lists, readable coverage FAQ answers.
- Schema: `$` converted to `SGD ` only for amounts, not URLs. Share images are absolute.
- Map wording: "business address matched to its building" instead of "verified business address".
- `blockAddress` collapses doubled commas. `check-site` now also rejects "1 units", leftover price text, relative share images and shown counts for conflicting self-reported ratings.

### New content from the keyword plan

Every new page uses the existing guide pipeline (at least 1,000 words, four FAQs, noindex). Rate tables list one sourced, non-promotional rate per company with company, source and capture date, and appear only when at least three companies publish a matching rate. Ranges are shown only for the most common unit.

- Guides added: aircon repair, aircon leaking water, chemical overhaul, condenser cleaning, how often to service aircon, part-time cleaners, post-renovation cleaning, steam cleaning, office cleaning, mattress cleaning, curtain cleaning, instant water heaters, licensed plumbers, tap replacement, power trips, licensed electricians, light installation, socket installation, house painting, TV mounting, furniture assembly, door locks and curtain installation.
- Area pages: `/roster/plumbing/woodlands/`, `/roster/plumbing/tampines/` and `/roster/plumbing/yishun/`, listing only companies that name the town, each linked to its coverage source. Every trade hub has an "Areas we serve" section linking 18 towns to the existing coverage filter.
- Merged into existing pages: chemical wash and gas top-up rates on their intent pages, installation price into the aircon installation guide, end-of-tenancy into the move-out guide, and duplicate hub keywords (cleaning services, plumber near me and similar).

### Validation

791 pages. 97 JavaScript tests and 15 Python tests pass. `check-site.mjs` passes with all internal links and fragments; `check-editorial.mjs` passes for 43 guides and 49,240 words. Largest trade payload: aircon at 241.5 KB of HTML plus JSON. No browser review of the new pages yet.

### Open items

- Aircon unit size: needs a sourced room-size guide before a page can give sizes.
- Not built for lack of sourced rates (fewer than three companies): 24-hour plumber, wall drilling, ceiling fan installation, window cleaning, EV chargers, water heater brands (Rheem, Ariston, Joven) and aircon trunking. Most 50/mo rows remain.
- The `,,` address case reported for Go Cleaners and Handyman Fix Pro did not reproduce with r13 data; the code was hardened and a site check added.
- 338 Aircon's protected original write-up still lists the conflicting counts in "Things to check first". Edit only with approval.
- CleanBreeze, Ironing Maids and Part-time Home Maid share the Everyworks WhatsApp number but are not in that operator group; next data release.
- Kiasu Plumber reply and arrival times, its hours versus 24/7, and AFRA's Saturday-only Google hours are company-stated conflicts left as data issues.
- `DEPLOYMENT-READINESS.md` and older review notes still describe earlier counts and account plans.
