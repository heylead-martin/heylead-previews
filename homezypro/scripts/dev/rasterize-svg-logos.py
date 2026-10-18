"""Dev script (ported from roster/scripts/rasterize-svg-logos.py): render served SVG logos over 30 KB
to WebP copies (<=256 px, transparent) with headless system Chrome via Python Playwright.

    python3 scripts/dev/rasterize-svg-logos.py      # from homezypro/, after `npm run import:data`

Writes public/logos/<name>.webp and src/data/svg-rasters.json ({svg src: {src, svgSha256, ...}}),
then points presentation.json at the WebP copy. Commit the outputs. The import (scripts/logos.py)
keeps serving a raster only while the SVG's sha256 still matches; the build never needs Chrome.
"""
import base64
import hashlib
import io
import json
import os
import sys
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from logos import TARGET, MAX_SIDE, encode  # noqa: E402

CHROME = '/usr/bin/google-chrome'


def main():
    presentation_file = ROOT / 'src/data/presentation.json'
    manifest_file = ROOT / 'src/data/svg-rasters.json'
    presentation = json.loads(presentation_file.read_text())
    manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else {}
    svgs = sorted({e.get('logo', '') for e in presentation.values() if e.get('logo', '').endswith('.svg')})
    large = [s for s in svgs if (ROOT / 'public' / s.lstrip('/')).stat().st_size > TARGET]
    if not os.path.exists(CHROME):
        raise SystemExit(f'{CHROME} not found')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': MAX_SIDE, 'height': MAX_SIDE})
        for src in large:
            svg = (ROOT / 'public' / src.lstrip('/')).read_bytes()
            out = ROOT / 'public/logos' / (Path(src).stem + '.webp')
            # Shown as an <img>, so the SVG's scripts and external references never run.
            page.set_content('<html><body style="margin:0;background:transparent"><img id="l" style="max-width:256px;max-height:256px;display:block"></body></html>')
            page.eval_on_selector('#l', '(img, data) => new Promise(ok => { img.onload = ok; img.onerror = ok; img.src = "data:image/svg+xml;base64," + data; })', base64.b64encode(svg).decode())
            png = page.locator('#l').screenshot(omit_background=True)
            image = Image.open(io.BytesIO(png)).convert('RGBA')
            image.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
            size = encode(image, out)
            manifest[src] = {'src': '/logos/' + out.name, 'svgSha256': hashlib.sha256(svg).hexdigest(), 'bytes': size, 'width': image.width, 'height': image.height}
            print(src, image.size, size, 'bytes')
        browser.close()
    for entry in presentation.values():
        if entry.get('logo') in manifest:
            entry['logo'] = manifest[entry['logo']]['src']
    manifest_file.write_text(json.dumps(manifest, indent=1, sort_keys=True) + '\n')
    presentation_file.write_text(json.dumps(presentation, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'rasterised': len(large), 'manifest': len(manifest)}))


if __name__ == '__main__':
    main()
