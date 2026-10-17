"""One-off helper for P1-14: SVG logos over 30 KB rendered to WebP copies (<=256 px, transparent)
with headless Chrome via Playwright. Run by hand after an import adds large SVGs:
    python3 scripts/rasterize-svg-logos.py
optimize-logos.py then serves assets/logos/web/<name>.webp for those SVGs. The build itself does not
need Chrome; SVGs without a copy are served as they are."""
import io
import json
import os
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

import importlib.util
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('optimize_logos', ROOT / 'scripts/optimize-logos.py')
optimize = importlib.util.module_from_spec(spec); spec.loader.exec_module(optimize)

presentation = json.loads((ROOT / 'data/presentation.json').read_text())
svgs = sorted({e.get('logo', '') for e in presentation.values() if e.get('logo', '').endswith('.svg')})
large = [s for s in svgs if (ROOT / s.removeprefix('/roster/')).stat().st_size > optimize.TARGET]
exe = '/usr/bin/google-chrome' if os.path.exists('/usr/bin/google-chrome') else None
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=exe, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 256, 'height': 256})
    for src in large:
        out = ROOT / 'assets/logos/web' / (Path(src).stem + '.webp')
        svg = (ROOT / src.removeprefix('/roster/')).read_bytes()
        # The SVG is shown as an <img>, so its scripts and external references never run.
        page.set_content('<html><body style="margin:0;background:transparent"><img id="l" style="max-width:256px;max-height:256px;display:block"></body></html>')
        page.eval_on_selector('#l', '(img, data) => new Promise(ok => { img.onload = ok; img.onerror = ok; img.src = "data:image/svg+xml;base64," + data; })', __import__('base64').b64encode(svg).decode())
        png = page.locator('#l').screenshot(omit_background=True)
        image = Image.open(io.BytesIO(png)).convert('RGBA')
        out.parent.mkdir(parents=True, exist_ok=True)
        print(src, image.size, optimize.encode(image, out), 'bytes')
    browser.close()
