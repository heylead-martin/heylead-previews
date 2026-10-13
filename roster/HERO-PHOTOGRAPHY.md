# Hero photography

Five reviewed Pexels photos are pinned by photo ID and self-hosted. No faces, visible brand logos, company-site images or Google images are used. They illustrate service types and do not depict listed companies or imply that the pictured location is Singapore.

| Service | Pexels ID | Photographer | Photo URL |
| --- | --- | --- | --- |
| aircon | 6033459 | Brunxs | https://www.pexels.com/photo/ventilation-system-on-roof-of-building-6033459/ |
| plumbing | 6419128 | Anıl Karakaya | https://www.pexels.com/photo/plumber-installs-pipe-fittings-6419128/ |
| electrician | 6412539 | Tymur Khakimov | https://www.pexels.com/photo/cutting-wire-with-pliers-6412539/ |
| handyman | 6713705 | Tima Miroshnichenko | https://www.pexels.com/photo/a-carpenter-wit-a-set-of-hand-tools-6713705/ |
| cleaning | 7513111 | SHVETS production | https://www.pexels.com/photo/cleaning-products-placed-on-table-against-armchair-in-living-room-7513111/ |

## Reproducible assets

`data/hero-photos.json` records each source, photographer, ID and SHA256 for the 640px and 1200px local files. The photos were visually reviewed at source size and in the site. The aircon image is an unbranded ventilation detail.

Run `node scripts/import-hero-photos.mjs` from `roster/` to fetch these exact IDs. It reads `PEXELS_API_KEY` from the environment or ignored `.env.local`, never logs it, and never sends it to the image CDN. Normal builds require no key or Pexels connection. Review imagery again after any intentional replacement.

Each slide and guide shows the linked credit `Illustrative photo: {photographer} / Pexels`. Rotation remains seven seconds, with pause/resume, visibility/focus pausing and reduced-motion handling. Credit changes with the displayed slide. The AI-generated face images were removed from the hero asset folder.

Sources: [Pexels API documentation](https://www.pexels.com/api/documentation/) and [Pexels license](https://www.pexels.com/license/).
