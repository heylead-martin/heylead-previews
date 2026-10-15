# Roster: response to Grok review, 14 October 2026

Reviewed `GROK-REVIEW-RESPONSE-20261013.md`. This note supplements the complete 13 October handoff. The new source changes and generated pages are local and uncommitted on `service-areas-1253`, based on commit `4a4e4d422`. Nothing was merged, pushed or deployed. No database release was imported and no account, SMTP or OAuth setting was changed.

## Fixed in the site

| Finding | Result |
| --- | --- |
| B1: dropped count qualifiers | Direct Plumber now says `3,388+ reviews`. Repair.sg now says `more than 3,000 reviews`. Both qualifiers come from the existing stored excerpt, not a fresh website claim. |
| B2: obsolete sorting notes | The public renderer removes the retired `The sort uses...` sentences, including Sureclean and 1st Electrical. It preserves dated source comparisons. A site-wide check rejects any recurrence. Raw database notes remain unchanged until the next release. |
| B3: singular excerpt grammar | Repair.sg, Mr Plumber and SoCool now say `1 sourced excerpt`. A site-wide check rejects the old wording. |

Self-reported ratings remain plain linked claims. They never enter averages, stars or sorting. No independent review count changed.

Source files: `assets/evidence-display.mjs`, `lib/expanded.mjs`, the shared browser-module references, `scripts/review-policy.test.mjs`, `scripts/import-db.test.mjs`, and `scripts/check-site.mjs`. Generated HTML and the retained account bundle were rebuilt. Accounts remain disconnected and hidden.

## Supported self-reported count fields for the next release

Keep these fields inside the existing `self_reported_rating` object:

```json
{
  "rating": 5.0,
  "count": 3388,
  "count_qualifier": "plus",
  "excerpt": "5.0 from 3,388+ reviews"
}
```

This is a partial shape example, not a publishable evidence object. Retain the real `source_url`, `capturedAt`, and notes. Do not copy a date from this document into a source record.

- `count_qualifier: "plus"` produces `3,388+ reviews`.
- `count_qualifier: "more_than"` produces `more than 3,000 reviews`.
- `count_qualifier: "exact"` produces a plain number. Use it only when the selected evidence actually gives an exact count.
- If absent, the renderer preserves a qualifier attached to that same number in the existing excerpt. It does not borrow one from another count or from the notes.
- `count_conflict: true` suppresses the numeric count and produces: `The company says it has a 4.9 rating on its own site; its pages give different review counts.` It can accompany `count: null`. Use this only for an evidenced disagreement, such as the reported 338 Aircon conflict.
- A missing count without a conflict flag produces only the attributed rating sentence, with no invented review total.

The importer already preserves the self-reported object. Structured qualifiers and conflicting/missing-count rendering are covered by tests. The existing 338 Aircon and Cool Aircon records have not been updated: their new observations still belong in the next release.

## Recommended next data release

Prepare a new immutable release from `companies-20261012-1253.json`, SHA256 `3850fc0b4891afd5a2940f5efaaa9a958d88014af24b7fd454e70d5190cff352`. Do not overwrite that version or silently alter its checksum.

1. Include the 20 proposed official address matches with address-source URLs, actual capture dates and OneMap evidence. Preserve block/building precision, six-digit postals and stable IDs. Keep the nine unresolved cases unresolved. Codex must rerun its own map-pin verification after import before treating proposed pins as verified.
2. Bundle the three confirmed logos with source URLs, actual capture dates and SHA256 hashes. Keep the other 18 uncertain logos as initials. Clean.LAD's white artwork needs a dark tile. Do not hotlink artwork or clear a company-identity warning merely to display a logo.
3. Preserve Direct Plumber and Repair.sg qualifiers using the fields above. Record 338 Aircon's conflicting counts rather than picking one. Reconcile Cool Aircon's visible badge, rating and structured-data discrepancies. Update capture dates only for sources actually read; bot-blocked sources were not freshly verified.
4. Remove the four stale sorting claims from source notes. For Sureclean, preserve the distinction between dated source snapshots and the current independent snapshot. Do not rewrite one figure merely to force agreement.
5. Withhold Reliable Electrical's junk address until a legitimate address is sourced. The current importer requires a sourced address for publication, so removing it may withhold the whole profile. Report that count change explicitly rather than inventing a replacement or weakening the gate.
6. Correct the documented commas, leading punctuation, missing street names and building spelling, retaining the supporting source and provenance. Preserve the original source spelling in notes where appropriate.
7. Resolve the Flash Aircon / SIGNATURE ENGINEERING identity before attaching site claims or artwork to the legal entity. If unresolved, keep the identity warning and withhold mismatched site evidence. Flag-based publication rules may reduce profile counts; do not clear them to maintain 719.
8. Provide the new JSON, its SHA256 sidecar, matching logo bundle/checksum and a record-level changelog. Point LATEST to the completed release only after those artifacts agree. Keep original slugs and the 16 protected write-ups.

The 20 maps and three logos are proposed data corrections, not corrections already imported into this site. Current totals remain 690 verified pins / 29 unresolved, and 21 uncertain logos. Grok's recorded source observations have not been independently re-fetched in this code-fix pass.

## Validation

- Rebuild: 765 pages, 719 profiles.
- JavaScript: 95 tests passed.
- Python: 15 tests passed.
- Site check: zero broken internal links or fragments; no forbidden placeholder text, stale sorting claims or singular-excerpt grammar.
- Editorial check: 20 guides, 24,907 words; FAQ parity, canonicals, contents and noindex checks pass.
- Desktop browser at 1366 x 900: Repair.sg and Direct Plumber qualifiers; Sureclean and 1st Electrical expanded source notes. No horizontal overflow.
- Mobile browser at 390 x 844: Repair.sg qualifier, singular excerpt label and wrapping. No horizontal overflow.
- All trade counts remain unchanged: aircon 225, plumbing 92, electrician 113, handyman 97, cleaning 192. Full / compact counts remain 262 / 457.
- Original write-ups, noindex, schema restrictions, parked features and Areas served checks pass.

The local preview is running at `http://127.0.0.1:8881/roster/`. Remote Grok sessions cannot access that loopback address. The live site does not contain this follow-up. No new browser check of the proposed map or logo corrections is claimed.

## Remaining boundaries

Accounts, saved lists, quote delivery and AI matching remain parked. The logo-removal inbox remains pending. No new email provider or Supabase configuration was added. Indexing stays disabled. The temporary copies in `/tmp/rr1013` and `~/Library/Caches/rr1013` were not deleted in this pass.

The next step is the reviewed data release, then checksum verification, import, map-pin recheck, rebuild and approval. Nothing should go live without Martin's approval. This file is prepared for Martin to relay; no message was sent to Grok automatically.
