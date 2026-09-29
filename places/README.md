# Places

Internal Google Maps listing tool at https://previews.heylead.com/places/

Searches Places API (New) for a trade and a city. Returns name, phone, website,
rating, review count, and up to five review samples per listing (Google's cap).

Backend: `~/heylead-places-api` Cloudflare Worker
`https://heylead-places.martin-656.workers.dev`

The Google API key is not in this public repo. Paste it in the UI, or set
`GOOGLE_PLACES_API_KEY` on the Worker.
