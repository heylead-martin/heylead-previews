# SEO and AEO expansion review

Prepared 12 October 2026 on branch `service-areas-1253`. Local preview only. No push, publication, indexing change or database migration was performed.

## Delivered

The 20 core pages in `Roster-SG-Page-Inventory.xlsx` now have distinct editorial content totalling 24,907 words. Every core page contains at least 1,200 words, excluding page navigation, company cards and shared footer text. Five existing directories were expanded and 15 guide routes were added. The methodology page was also rewritten with 1,398 words to describe the current product accurately.

The implementation follows `Roster-SG-SEO-AEO-Strategy.docx` for topic coverage, answer-first sections, Singapore context, related questions and internal linking. The strategy's planned claims and future features were treated as proposals, not existing facts.

Content source files are in `content/guides/`. Metadata and route definitions are in `content/guides/catalogue.mjs`. The existing 719 company profiles retain their sourced content; they were not padded with generic 1,000-word descriptions. The protected 16 original company write-ups remain intact.

## Pages and word counts

| Inventory ID | URL | Editorial words | Change |
| --- | --- | ---: | --- |
| AC-01 | `/roster/aircon/` | 1,271 | New guide |
| AC-02 | `/roster/aircon-servicing/` | 1,258 | Expanded directory |
| AC-03 | `/roster/aircon/servicing-price/` | 1,259 | New guide |
| AC-04 | `/roster/aircon/installation/` | 1,238 | New guide |
| AC-05 | `/roster/aircon/types/` | 1,221 | New guide |
| CL-01 | `/roster/home-cleaning/` | 1,276 | Expanded directory |
| CL-02 | `/roster/home-cleaning/deep-cleaning/` | 1,249 | New guide |
| CL-03 | `/roster/home-cleaning/sofa-carpet-cleaning/` | 1,259 | New guide |
| CL-04 | `/roster/home-cleaning/move-out-cleaning/` | 1,254 | New guide |
| PL-01 | `/roster/plumbing/` | 1,246 | Expanded directory |
| PL-02 | `/roster/plumbing/choked-drain/` | 1,276 | New guide |
| PL-03 | `/roster/plumbing/toilet-repair/` | 1,222 | New guide |
| PL-04 | `/roster/plumbing/leak-repair/` | 1,216 | New guide |
| PL-05 | `/roster/plumbing/water-heater/` | 1,214 | New guide |
| EL-01 | `/roster/electrician/` | 1,253 | Expanded directory |
| EL-02 | `/roster/electrician/24-hour/` | 1,272 | New guide |
| EL-03 | `/roster/electrician/hdb/` | 1,220 | New guide |
| EL-04 | `/roster/electrician/wiring/` | 1,229 | New guide |
| HM-01 | `/roster/handyman/` | 1,258 | Expanded directory |
| HM-02 | `/roster/handyman/door-window-repair/` | 1,216 | New guide |

Existing directory URLs were preserved. The inventory's cleaning cluster uses `/roster/home-cleaning/` to match the current site. The broad aircon guide lives at `/roster/aircon/`, while `/roster/aircon-servicing/` keeps its directory and servicing intent. The two earlier chemical-wash and gas-top-up pages remain available.

## Reading experience

- Each guide opens with a direct answer, then distinct practical sections.
- Responsive typography, narrow reading columns and a collapsible contents panel make long pages easier to scan.
- Comparison tables have captions, row and column headings, and contained horizontal scrolling on small screens.
- Four visible FAQs per core page match the generated FAQ structured data.
- New guides use the existing illustrative trade imagery, with the illustration label retained.
- Five homepage guide cards, related-guide cards and grouped footer links connect the content cluster.
- Existing directories keep company browsing first, with a clear link to their full guide.

## Evidence and copy decisions

Regulatory and safety statements were checked against PUB, EMA, HDB, BCA, NEA, SP Group and SCDF sources. Aircon type and servicing references also use manufacturer guidance where relevant. Source links sit next to the claims they support. The source-reference count in `data/editorial-audit.json` counts links in the authored copy; the price guide additionally renders its actual company-rate evidence from the dataset.

Domestic cleaning is not described as universally requiring an NEA cleaning business licence: NEA lists domestic-premises cleaning among the excluded activities. Plumbing copy distinguishes regulated work from specified simple tasks. Electrical, gas and window work direct readers to appropriate qualified workers and official rules. Guides do not provide dangerous repair procedures.

No unverified licence, insurance, vetting, response-time, availability or booking-success claims were added. Quote requests and claims are still beta previews. The urgent electrician page explicitly does not promise dispatch. Numeric aircon price comparisons use the existing comparable advertised-rate sample, with source companies and conditions available. They are not presented as market-wide prices or final quotes.

## Search preparation

Each core page has a unique title, description, canonical URL, one H1, Singapore language metadata, social previews and appropriate Article or CollectionPage, FAQPage and breadcrumb data. Organization and WebSite identities are connected. Roster is not marked as the contractor performing each service. No Review, AggregateRating or Offer schema was added.

Directory ItemList data now describes the cards rendered initially, in their displayed order. This reduces payload size while the complete company index continues to support filters and more results.

All preview pages remain `noindex`; robots restrictions remain in place. The preview sitemap contains no indexable URLs. `data/seo-launch-pages.json` records 22 proposed public launch pages: the homepage, methodology page and 20 core pages. It is a planning manifest, not a submitted sitemap. Current canonical origins remain the preview host until the production domain is confirmed.

Answer-first copy and clear entities support machine readability. Search engines do not guarantee rankings, FAQ rich results or AI citations, and no special AI crawler file or extra AEO schema was invented.

## Validation

- Static build: 759 generated pages and 719 company profiles.
- Node tests: 83 passed.
- Editorial audit: all 20 core pages above 1,000 words, title and description budgets, FAQ parity, headings, contents links, footer links and preview sitemap checks passed.
- Site audit: all local links and fragments, unique metadata, publication counts, schema restrictions and 16 original write-ups passed.
- Largest directory payload: about 263 KB of HTML plus JSON, within the existing 300 KB limit.
- Browser review: 390 x 844 mobile viewport and the default 1265-pixel content width. Guide anchors land correctly, tables stay within their scroller, and no page-wide horizontal overflow was found. No console errors appeared in the guide review.

Run from the repository root:

```sh
node roster/build.mjs
node --test roster/scripts/*.test.mjs
node roster/scripts/check-editorial.mjs
node roster/scripts/check-site.mjs
```

## Before public indexing

Confirm the final production domain and which pages should be indexable, then approve the launch configuration. Generate the public sitemap only after those decisions. Review the copy and source-dependent claims for publication, and supply real reviewer credentials only if a named expert has actually reviewed the content. Search Console, indexing submissions and analytics were not configured by this update.

The earlier Supabase migration still requires owner approval before `supabase db push`, plus CLI authentication/linking and the owner-managed Auth configuration. Google OAuth has not been enabled. See `ACCOUNTS-SETUP.md` for those separate steps.
