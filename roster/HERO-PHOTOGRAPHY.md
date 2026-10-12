# Rotating profession hero

Built-in image generation was used on 12 October 2026. These are original illustrative scenes, not photos of companies listed on Roster. The live interface labels the photography as illustrative.

Only web format conversion and resizing were performed with macOS sips. Source PNG files are preserved. Desktop JPEGs are 1200 pixels wide and mobile JPEGs are 640 pixels wide.

## Behaviour

The heading keeps “Find your next” fixed while five profession names and photos change together. Rotation runs every seven seconds, with manual category and pause controls. It pauses during keyboard interaction, while the page is hidden, and when the hero is offscreen. Reduced-motion users get manual controls with no autoplay or transition. Search values and the active search tab never change with a slide.

The first image loads eagerly. Remaining images load before they are shown, and a failed image leaves the current image visible.

## Validation

- Build: 741 pages. Static site validation passes, including local links, metadata and the 16 original company write-ups.
- All 68 existing JavaScript tests pass.
- Browser checks at 320, 390, 1000 and 1440 pixels: no horizontal overflow. All five photos and destination links work; pause/resume and automatic rotation work.
- Typing pauses rotation. Manual profession changes preserve quick-search text, AI-search text and the selected search tab. AI search still opens the shortlist.
- Responsive image decoding retries after a source change caused by resizing. Desktop-to-mobile-to-desktop checks pass.
- Unpublished local preview: http://127.0.0.1:8881/roster/

## Exact image-generation prompts and files

### aircon

Source: `/Users/martinmarinov/.codex/generated_images/01a12604-d98a-73c1-9c28-2ad11debbad8/exec-514df5e2-cc8d-4530-8bae-7d4a42129fdd.png`

Web assets: `assets/hero/aircon-v1.jpg` and `assets/hero/aircon-v1-small.jpg`.

Use case: photorealistic-natural. Asset type: original website hero photography for Roster, a Singapore home services directory. Create one landscape 3:2 editorial photograph, around 1536 by 1024 pixels. Consistent art direction: premium but authentic everyday Singapore apartment, warm daylight, natural skin, quiet sage green and warm cream palette, olive or muted green unbranded workwear, no posed handshake, no stock-photo grin. Frame a single working professional and the specific task in the upper and right two thirds, leaving the lower-left fairly calm for a dark gradient and headline added by the website. Medium-wide environmental portrait, believable hands and tools, tidy lived-in interior. No text, no logos, no watermarks, no collage. A Southeast Asian male air-conditioning technician in his thirties, standing safely on a low work platform, carefully lifting the removable filter from an open white wall-mounted split air conditioner. The air conditioner is off. Camera sees his face in profile, both hands and the filter clearly. Bright modern Singapore living room with pale warm walls, soft curtain light, subtle greenery outside. The technician and unit are on the right side of the frame, with quiet wall and lower room on the left.

### plumbing

Source: `/Users/martinmarinov/.codex/generated_images/01a12604-d98a-73c1-9c28-2ad11debbad8/exec-6ca9c91d-e9b7-490c-a2a4-6b14a84ac1b4.png`

Web assets: `assets/hero/plumbing-v1.jpg` and `assets/hero/plumbing-v1-small.jpg`.

Use case: photorealistic-natural. Asset type: original website hero photography for Roster, a Singapore home services directory. Create one landscape 3:2 editorial photograph, around 1536 by 1024 pixels. Consistent art direction: premium but authentic everyday Singapore apartment, warm daylight, natural skin, quiet sage green and warm cream palette, olive or muted green unbranded workwear, no posed handshake, no stock-photo grin. Frame a single working professional and the specific task in the upper and right two thirds, leaving the lower-left fairly calm for a dark gradient and headline added by the website. Medium-wide environmental portrait, believable hands and tools, tidy lived-in interior. No text, no logos, no watermarks, no collage. A South Asian male plumber in his thirties kneeling beside an open kitchen sink cabinet in a modern Singapore apartment. He uses a wrench on a visible drain trap beneath the stainless sink, looking at his task. Head and hands clearly visible, open cabinet and curved metal drain pipe unmistakable, understated green shirt and dark work trousers. Warm pale cabinetry and daylight, subject on the right, quieter cabinetry and tiled floor toward the left.

### electrician

Source: `/Users/martinmarinov/.codex/generated_images/01a12604-d98a-73c1-9c28-2ad11debbad8/exec-a8b3e5ae-0ecf-4c6e-8e09-20451625d042.png`

Web assets: `assets/hero/electrician-v1.jpg` and `assets/hero/electrician-v1-small.jpg`.

Use case: photorealistic-natural. Asset type: original website hero photography for Roster, a Singapore home services directory. Create one landscape 3:2 editorial photograph, around 1536 by 1024 pixels. Consistent art direction: premium but authentic everyday Singapore apartment, warm daylight, natural skin, quiet sage green and warm cream palette, olive or muted green unbranded workwear, no posed handshake, no stock-photo grin. Frame a single working professional and the specific task in the upper and right two thirds, leaving the lower-left fairly calm for a dark gradient and headline added by the website. Medium-wide environmental portrait, believable hands and tools, tidy lived-in interior. No text, no logos, no watermarks, no collage. An East Asian female electrician in her thirties inspecting an open, disconnected small residential electrical distribution box at chest height in a Singapore apartment hallway. She holds a compact test meter and wears work gloves, looks focused at the equipment, no sparks and no loose live wires. Muted green work shirt, warm cream wall, soft daylight, subject on the right, quieter wall and hallway on the left.

### handyman

Source: `/Users/martinmarinov/.codex/generated_images/01a12604-d98a-73c1-9c28-2ad11debbad8/exec-532f88bb-4664-4102-8802-c59e5c2317c0.png`

Web assets: `assets/hero/handyman-v1.jpg` and `assets/hero/handyman-v1-small.jpg`.

Use case: photorealistic-natural. Asset type: original website hero photography for Roster, a Singapore home services directory. Create one landscape 3:2 editorial photograph, around 1536 by 1024 pixels. Consistent art direction: premium but authentic everyday Singapore apartment, warm daylight, natural skin, quiet sage green and warm cream palette, olive or muted green unbranded workwear, no posed handshake, no stock-photo grin. Frame a single working professional and the specific task in the upper and right two thirds, leaving the lower-left fairly calm for a dark gradient and headline added by the website. Medium-wide environmental portrait, believable hands and tools, tidy lived-in interior. No text, no logos, no watermarks, no collage. A Southeast Asian male handyman in his forties installing a simple oak floating shelf on a pale wall in a Singapore apartment. He holds a spirit level against the shelf, with a cordless drill resting safely on a nearby work surface. Calm focused expression, muted olive work shirt. Natural light, warm oak furniture, a small plant. Subject and shelf on the right side of frame, quieter warm room on the left.

### cleaning

Source: `/Users/martinmarinov/.codex/generated_images/01a12604-d98a-73c1-9c28-2ad11debbad8/exec-e0748b9f-f058-4f4e-8d01-57f60f0282c3.png`

Web assets: `assets/hero/cleaning-v1.jpg` and `assets/hero/cleaning-v1-small.jpg`.

Use case: photorealistic-natural. Asset type: original website hero photography for Roster, a Singapore home services directory. Create one landscape 3:2 editorial photograph, around 1536 by 1024 pixels. Consistent art direction: premium but authentic everyday Singapore apartment, warm daylight, natural skin, quiet sage green and warm cream palette, olive or muted green unbranded workwear, no posed handshake, no stock-photo grin. Frame a single working professional and the specific task in the upper and right two thirds, leaving the lower-left fairly calm for a dark gradient and headline added by the website. Medium-wide environmental portrait, believable hands and tools, tidy lived-in interior. No text, no logos, no watermarks, no collage. A Southeast Asian female home cleaner in her thirties wiping a warm white kitchen countertop with a clean cloth, wearing muted sage workwear and simple cleaning gloves. A plain unbranded spray bottle sits on the counter nearby. Natural, focused posture, authentic Singapore apartment kitchen with pale cabinets, warm daylight and subtle plants. Subject on the right side of frame, calmer counter and light room toward the left.


