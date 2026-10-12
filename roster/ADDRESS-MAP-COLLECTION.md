# Roster address and map collection rules

For Grok and every bot collecting or verifying Roster business data. Updated 12 October 2026.

## Required outcome

A map on a business listing must show a real pin at the cited business's building in Singapore. A world map, Singapore-wide map, street-only search or arbitrary camera centre is not a verified location. If the location cannot be matched, keep the address and mark the map unresolved. The site will show an address card instead of a misleading map.

## Collect these fields together

- Business name and stable database ID.
- Complete published address, with building/block, street, unit and six-digit Singapore postal code stored separately where possible. Keep postal codes as strings so leading zeros survive.
- Address source URL, source label and capture date.
- Google place ID and CID when available. Both are strings. A CID can exceed JavaScript's safe integer range.
- A direct place URL. A search-results URL alone is not proof that the correct place was matched.
- Actual marker latitude and longitude, their source URL and the time they were checked. Do not extract the search viewport centre or the camera position from a broad map URL.
- Match evidence: the cited place identity and postal code must agree with the listing. Compare the business name, street/building and official phone or website as well. Flag conflicting addresses for review rather than replacing them silently.
- Location precision and property type when known: building, block, commercial premises, HDB or other residential address. Do not guess the property type from the street name.

## Verification procedure

1. Open the address source and the specific map place. Match the business and building. Check the complete postal code; never fill missing digits from a similar company.
2. Capture the coordinates of the place marker, not the map centre. Coordinates must be in Singapore; the site's broad bounds are latitude 1.15 to 1.48 and longitude 103.59 to 104.10. These bounds alone do not verify an address.
3. Compare the place postal code to the published address. If they disagree, record both sources and mark the pin unresolved until the conflict is checked.
4. Preview the map in an iframe. It must show a visible pin on the correct building at a useful local zoom. Do not treat an HTTP 200 response as success. A map at latitude 0, longitude 0 or a world-scale zoom is a failure.
5. Verify directions use the same confirmed location. Recheck after an address, branch, place ID or CID changes.
6. Record the date and match evidence. Never mark a pin verified solely because a URL was constructed.

## Privacy and public display

HDB and other residential locations must display a block/building pin only. Remove unit and floor details from the public map caption, map request, directions and map popup. Keep any necessary original address evidence in the database. Do not geolocate a private entrance or individual apartment. Use the same conservative building-level display when the property type is unknown.

## Current site implementation

`roster/scripts/verify-map-pins.py` reads published companies and their imported map evidence. It checks a Google place marker against its CID and the published postal code, with coordinates inside Singapore. A sourced release `map.place` can supply the specific CID independently of the rating source URL.

For `map.status: address-geocoded`, the checker reopens the official OneMap postal search. It requires the sourced business address, capture date, matching six-digit postal code, one matching building result and agreement with the released coordinates. The published address must identify the matching block, street or building; a district alone is insufficient. A conflicting house number is rejected. This verifies the published address location, not company ownership or a Google business-place identity.

For this pathway, collect `map.geocode.url`, `postal`, `blk` and `capturedAt`, plus `map.lat` and `map.lng`. Keep the company address source alongside them. A returned error or HTTP success alone is not evidence: the checker needs the actual matching address result. If access requires authentication, use the documented authorization or leave the map unresolved.

The checker writes `roster/data/map-pins.json`, keyed by company slug. The cache contains building coordinates, source URL, match method, capture date and an address hash. No unit text is published in that cache. `--only slug-a slug-b` rechecks selected published listings while preserving the other cache records.

`roster/lib/expanded.mjs` uses a cached pin only when its address hash still matches the listing. It renders a coordinate-based Google map at zoom 17 and directions to the same point. An unresolved or stale pin produces an address card without an iframe. Updating the address therefore cannot leave the old pin attached unnoticed.

Run the pin check after an approved database import, then rebuild and inspect representative pages:

```sh
python3 roster/scripts/verify-map-pins.py
node roster/build.mjs
node roster/scripts/check-site.mjs
```

The pin check retrieves public location evidence only. It does not refresh review scores, prices, hours or business ownership. Those fields still come from the pinned database release.

## Known failure to avoid

On 11 October 2026, the text-based embed for Evergreen Cleaning Services showed a world map. Even a postal-code-only query failed. The cited place marker resolved correctly to its Tampines building. The site now uses verified coordinates rather than relying on raw address text to geocode at page load.

Do not invent a Google Maps API key, substitute a fake marker, reuse a nearby company's coordinates or change the business address just to make the map appear.

## Related collection priorities from the review

- Prioritise job-specific prices, service coverage and residential-service evidence for electrician and handyman records before expanding already broad categories.
- Keep price labels free of cart buttons, login text, phone numbers and FAQ questions. Preserve the full source wording separately. Store both `amount_sgd` and `amount_max_sgd` for a range.
- Preserve the source `unit`, quantities, monthly session counts, GST and conditions. Do not infer a unit in the website build. If the database infers a unit, retain `unitInferred` so the uncertainty is visible.
- Alternate phone numbers need `sourceLabel`, `sourceUrl` and their own `capturedAt`. Do not copy the company's last-check date onto an undated phone record.
- Keep `profile_bar.meetsFullBar` accurate. The site uses it to distinguish the fuller shortlist from compact listings.

## Reference documentation

- [Google Maps embed marker parameters](https://developers.google.com/maps/documentation/embed/embedding-map)
- [Google place IDs](https://developers.google.com/maps/documentation/javascript/place-id)
- [OneMap address search](https://www.onemap.gov.sg/apidocs/search), an alternative source requiring its documented authentication. Never bypass authentication.
