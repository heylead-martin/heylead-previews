# Hero search and shortlist preview - 12 October 2026

Branch: `service-areas-1253`. Local review only. Nothing has been pushed or deployed.

## Experience

The homepage now puts search in the hero. Quick search opens the existing company directory. AI search accepts a sentence and is explicitly labelled as a beta with no connected AI service. The current matcher runs locally in the browser against 719 published profiles.

The dedicated shortlist starts with five selected companies. Switching to ten selects all ten, and switching back selects the five shown. Visitors can untick individual companies, clear the selection or select all again. Clicking the already-active shortlist size preserves those manual choices. Five is the recommended default because it gives a useful comparison without making the first decision feel too large. Every card shows the real average rating, review count, published price details, services and a short explanation of the match.

Request a quote now appears at the top of the desktop sidebar and above the mobile results, with a clear beta notice. The quote preview displays the user's brief and the exact selected companies. Logo tiles are larger and retain their artwork proportions; initials are centered without a LOGO label. Selection checkboxes are 32 pixels with at least a 44-pixel touch target. Nothing is sent. There is no account requirement, contact-data collection, quote endpoint or backend added in this update. The original quote panel is unchanged.

## Matching and boundaries

- Keyword rules identify a service, specific jobs and a town. Multiple services or towns require a manual choice. Unsupported requests do not receive arbitrary recommendations.
- Every detected job must match the company's listed offerings. The beta does not understand unrestricted natural language, synonyms or negation as a real language model would.
- Stated town coverage ranks first, followed by region coverage and islandwide coverage. Companies without coverage evidence are excluded when a town is chosen. Business addresses never imply service coverage.
- Completeness of listing details, real average rating and review count order companies within each coverage group. Listings remain unpaid.
- Timing, budget, availability and suitability must be confirmed directly. An example published price can describe another service; its name and conditions remain visible and it is never presented as a quote for the whole request.
- Search descriptions use URL fragments, so the static server does not receive them as HTTP query parameters. They can still appear in browser history or any link the visitor shares. Recipient selections remain in memory.
- Editing the brief or filters clears old results and selections. Each new search and each change of shortlist size selects the visible companies only. Pages remain noindex and do not include rating schema.

## Verification

- 65 JavaScript tests pass, including 10 new parser, coverage, ranking, selection and real-data tests.
- Rebuilt 741 pages. Site checks pass for internal links, fragments, metadata, noindex, schema restrictions, logos, publication totals and the 16 protected write-ups.
- Checked responsive widths of 375, 390, 768, 1024 and 1440 pixels. No horizontal page overflow was found.
- Browser checks cover normal search, keyboard-operated hero tabs, example jobs, automatic service and town detection, manual overrides, ambiguous requests, URL reload, individual selection, select all, switching five and ten, and the quote preview.
- Browser checks also verify five auto-selected companies, ten auto-selected companies, manual deselection, preserving deselection on an already-active size, and exactly ten recipients in the mobile dialog.
- Editing a brief removes stale selected recipients. Completing a preview explicitly says no quote requests were sent.
- A leaking kitchen sink in Bedok yields 39 matching companies. Aircon servicing in Tampines yields 112. Counts depend on the imported release.
- Browser console checks show no errors or warnings. Existing fitted logo proportions are retained in the new cards and dialog.

## Review locally

- [Homepage hero](http://127.0.0.1:8881/roster/)
- [Job shortlist](http://127.0.0.1:8881/roster/matches/#job=My+kitchen+sink+is+leaking+in+Bedok.+I+need+someone+to+take+a+look+this+week.)
- [Service coverage review](SERVICE-AREAS-REVIEW.md)

The preview server is local to this computer. Production preview authentication is unchanged.

Screenshots are saved beside this worktree in the task workspace: `roster-search-hero.png`, `roster-job-shortlist.png`, `roster-shortlist-mobile.png` and `roster-quote-preview.png`.
