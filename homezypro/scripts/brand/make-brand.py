"""HomezyPro brand assets. Run by hand from homezypro/ (needs Python Playwright + /usr/bin/google-chrome,
Pillow and fontTools; the site build needs none of them):

    python3 scripts/brand/make-brand.py

Design
- Mark: a house silhouette with a check knocked out (even-odd fill, one colour, no masks or ids, so it
  can be inlined twice on a page). Built on a 64-unit grid; strokes are >= 6.5 units so it holds at 16 px.
- Wordmark: "HomezyPro" in Fraunces (SIL Open Font License; the site's display face) at wght 600, opsz 72,
  converted to outlines, so the SVG never depends on installed fonts. Chrome shapes the text (kerning),
  fontTools supplies the glyph outlines at Chrome's positions.
- Colours from the site tokens: green #0e5e3f (mark, "Pro"), ink #1b2120 ("Homezy"), paper #f3f0e9.

Writes public/brand/{logo.svg,logo-mono.svg,logo-mark.svg,logo-stacked.svg,logo.png,logo-512.png,og-default.png},
public/{favicon.svg,favicon.ico,favicon-16x16.png,favicon-32x32.png,apple-touch-icon.png,icon-192.png,
icon-512.png,icon-maskable-192.png,icon-maskable-512.png}, and a preview sheet at /tmp/hz-brand.png.
site.webmanifest is static (public/site.webmanifest).
"""
import base64
import io
import re
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'public'
BRAND = PUBLIC / 'brand'
CHROME = '/usr/bin/google-chrome'
FONT_DIR = Path('/usr/share/fonts/truetype/sand-box/google/Fraunces')
FRAUNCES = FONT_DIR / 'Fraunces-VariableFont_SOFT,WONK,opsz,wght.ttf'
AXES = {'wght': 600, 'opsz': 72, 'SOFT': 0, 'WONK': 0}
GREEN, INK, PAPER = '#0e5e3f', '#1b2120', '#f3f0e9'

# 64-unit grid. House: roof with eaves, body with rounded base. Check: a closed outline (half-width 3.5)
# through (21.5,40) (29,47.5) (43.5,33), knocked out of the house by the even-odd rule.
HOUSE = 'M32 5.5L59.5 29A3 3 0 0 1 57.5 34.3H53V54A5 5 0 0 1 48 59H16A5 5 0 0 1 11 54V34.3H6.5A3 3 0 0 1 4.5 29Z'
CHECK = 'M23.975 37.525L29 42.55L41.025 30.525L45.975 35.475L29 52.45L19.025 42.475Z'
MARK_D = f'{HOUSE}{CHECK}'


def mark_svg(fill=GREEN, size=64, pad=0, background=None, scale=1.0):
    """The mark alone. `scale` shrinks it inside the canvas (maskable safe zone)."""
    box = 64 + 2 * pad
    inner = 64 * scale
    off = (box - inner) / 2
    bg = f'<rect width="{box}" height="{box}" fill="{background}"/>' if background else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" width="{size}" height="{size}">{bg}'
            f'<path fill="{fill}" fill-rule="evenodd" transform="translate({off:.3f} {off:.3f}) scale({scale})" d="{MARK_D}"/></svg>')


def shaped_positions(text, page, upem):
    """Glyph x positions (font units, 1 px = 1 unit) with Chrome's shaping and kerning."""
    font = base64.b64encode(FRAUNCES.read_bytes()).decode()
    settings = ', '.join(f'"{k}" {v}' for k, v in AXES.items())
    page.set_content(f'''<style>@font-face{{font-family:F;src:url(data:font/ttf;base64,{font})}}
      span{{font-family:F;font-size:{upem}px;font-variation-settings:{settings};font-kerning:normal;white-space:pre;line-height:1}}</style>
      <span id="t">{text}</span>''')
    page.wait_for_function('document.fonts.status === "loaded"')
    return page.evaluate('''() => { const n = document.getElementById('t').firstChild, r = document.createRange(), x0 = n.parentElement.getBoundingClientRect().left;
      return [...n.data].map((_, i) => { r.setStart(n, i); r.setEnd(n, i + 1); return r.getBoundingClientRect().left - x0; }); }''')


def wordmark(page):
    """Outlines for "Homezy" and "Pro" plus their bounds, in font units (y down, baseline at 0)."""
    font = instantiateVariableFont(TTFont(FRAUNCES), AXES)
    upem = font['head'].unitsPerEm
    glyphs, cmap = font.getGlyphSet(), font.getBestCmap()
    text = 'HomezyPro'
    xs = shaped_positions(text, page, upem)  # measured at upem px, so 1 px = 1 font unit
    parts, bounds = {'Homezy': '', 'Pro': ''}, BoundsPen(glyphs)
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, xs[i], 0)))
        # Whole font units (2000/em) keep the inline SVG small with no visible change.
        parts['Homezy' if i < 6 else 'Pro'] += re.sub(r'-?\d+\.\d+', lambda m: str(round(float(m.group()))), pen.getCommands())
        glyphs[name].draw(TransformPen(bounds, (1, 0, 0, -1, xs[i], 0)))
    cap = font['OS/2'].sCapHeight
    return parts, bounds.bounds, cap


def logo_svgs(parts, bounds, cap):
    xmin, ymin, xmax, ymax = bounds
    # Wordmark caps 36 units tall, baseline at y=52 on the mark's 64 grid; 15-unit gap after the mark.
    s = 36 / cap
    tx = 64 + 15 - xmin * s
    width = 64 + 15 + (xmax - xmin) * s
    top = min(0, 52 + ymin * s)
    height = max(64, 52 + ymax * s) - top
    t = f'translate({tx:.3f} 52) scale({s:.5f})'
    vb = f'0 {top:.2f} {width:.2f} {height:.2f}'

    def svg(mark_fill, homezy, pro, label=True):
        # Classes let the inline copy (header/footer) take colours from CSS (public/assets/brand.css).
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="HomezyPro">'
                + ('<title>HomezyPro</title>' if label else '')
                + f'<path class="hz-mark" fill="{mark_fill}" fill-rule="evenodd" d="{MARK_D}"/>'
                + f'<g transform="{t}"><path class="hz-homezy" fill="{homezy}" d="{parts["Homezy"]}"/><path class="hz-pro" fill="{pro}" d="{parts["Pro"]}"/></g></svg>\n')
    # Stacked (square) version for the Organization logo and the 512 px PNG.
    ww = (xmax - xmin) * s
    side = max(ww, 96) + 24
    mx = (side - 96) / 2
    st = f'translate({(side - ww) / 2 - xmin * s:.3f} {96 + 16 + 36:.3f}) scale({s:.5f})'
    stacked = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-((side - (96 + 16 + 36 + 12)) / 2):.2f} {side:.2f} {side:.2f}" role="img" aria-label="HomezyPro"><title>HomezyPro</title>'
               f'<path fill="{GREEN}" fill-rule="evenodd" transform="translate({mx:.3f} 0) scale(1.5)" d="{MARK_D}"/>'
               f'<g transform="{st}"><path fill="{INK}" d="{parts["Homezy"]}"/><path fill="{GREEN}" d="{parts["Pro"]}"/></g></svg>\n')
    return {
        'logo.svg': svg(GREEN, INK, GREEN),
        'logo-mono.svg': svg('currentColor', 'currentColor', 'currentColor'),
        'logo-stacked.svg': stacked,
        'inline': svg('currentColor', 'currentColor', 'currentColor', label=False),
    }, width / height


def render(page, svg, width, height, background='transparent'):
    page.set_viewport_size({'width': width, 'height': height})
    data = base64.b64encode(svg.encode()).decode()
    page.set_content(f'<html><body style="margin:0;background:{background}"><img id="i" src="data:image/svg+xml;base64,{data}" style="display:block;width:{width}px;height:{height}px"></body></html>')
    page.wait_for_function('document.getElementById("i").complete')
    png = page.locator('#i').screenshot(omit_background=background == 'transparent')
    return Image.open(io.BytesIO(png)).convert('RGBA')


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        page = browser.new_page()
        parts, bounds, cap = wordmark(page)
        svgs, ratio = logo_svgs(parts, bounds, cap)
        for name in ('logo.svg', 'logo-mono.svg', 'logo-stacked.svg'):
            (BRAND / name).write_text(svgs[name])
        (BRAND / 'logo-mark.svg').write_text(mark_svg().replace(' width="64" height="64"', ' role="img" aria-label="HomezyPro"') + '\n')
        (ROOT / 'src/lib/brand-logo.svg.txt').write_text(svgs['inline'])
        # Favicon SVG: green on light, lighter green on dark tabs.
        (PUBLIC / 'favicon.svg').write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>path{{fill:{GREEN}}}@media (prefers-color-scheme:dark){{path{{fill:#7fcfa6}}}}</style>'
            f'<path fill-rule="evenodd" d="{MARK_D}"/></svg>\n')

        render(page, svgs['logo.svg'], 1200, round(1200 / ratio)).save(BRAND / 'logo.png', optimize=True)
        render(page, svgs['logo-stacked.svg'], 512, 512).save(BRAND / 'logo-512.png', optimize=True)
        # Small favicons: the bare mark, rendered at each size so Chrome antialiases at that size.
        small = {n: render(page, mark_svg(size=n), n, n) for n in (16, 32, 48)}
        small[16].save(PUBLIC / 'favicon-16x16.png', optimize=True)
        small[32].save(PUBLIC / 'favicon-32x32.png', optimize=True)
        small[48].save(PUBLIC / 'favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)], append_images=[small[16], small[32]])
        # App icons: paper mark on a green tile. Apple and "any" icons use a full square (the OS rounds
        # it); maskable icons keep the mark inside the central 80% safe zone (here 56%).
        tile = lambda n, scale: render(page, mark_svg(fill=PAPER, size=n, background=GREEN, scale=scale), n, n)
        tile(180, 0.66).convert('RGB').save(PUBLIC / 'apple-touch-icon.png', optimize=True)
        tile(192, 0.66).save(PUBLIC / 'icon-192.png', optimize=True)
        tile(512, 0.66).save(PUBLIC / 'icon-512.png', optimize=True)
        tile(192, 0.56).save(PUBLIC / 'icon-maskable-192.png', optimize=True)
        tile(512, 0.56).save(PUBLIC / 'icon-maskable-512.png', optimize=True)

        # Default share card, 1200x630: logo, one line of copy, no people.
        logo = base64.b64encode(svgs['logo.svg'].encode()).decode()
        font = base64.b64encode(FRAUNCES.read_bytes()).decode()
        page.set_viewport_size({'width': 1200, 'height': 630})
        page.set_content(f'''<html><head><style>@font-face{{font-family:F;src:url(data:font/ttf;base64,{font})}}
          body{{margin:0;width:1200px;height:630px;background:{PAPER};font-family:F;color:{INK};position:relative;overflow:hidden}}
          .rule{{position:absolute;left:0;right:0;bottom:0;height:18px;background:{GREEN}}}
          .roofs{{position:absolute;right:-40px;bottom:18px;opacity:.09}}
          img{{position:absolute;left:96px;top:150px;height:132px}}
          h1{{position:absolute;left:100px;top:330px;margin:0;font-size:54px;font-weight:500;font-variation-settings:"opsz" 72,"SOFT" 0,"WONK" 0;letter-spacing:-.5px;line-height:1.15;width:900px}}
          p{{position:absolute;left:102px;top:470px;margin:0;font-size:26px;font-variation-settings:"opsz" 24;color:{GREEN}}}</style></head>
          <body><svg class="roofs" width="520" height="420" viewBox="0 0 64 52"><path fill="{GREEN}" fill-rule="evenodd" d="{MARK_D}"/></svg>
          <img src="data:image/svg+xml;base64,{logo}"><h1>Home services in Singapore, compared with their sources.</h1>
          <p>Published services, prices and Google ratings. Unpaid listings.</p><div class="rule"></div></body></html>''')
        page.wait_for_function('document.fonts.status === "loaded" && document.querySelector("img").complete')
        Image.open(io.BytesIO(page.screenshot())).convert('RGB').save(BRAND / 'og-default.png', optimize=True)

        # Preview sheet.
        files = ['brand/logo.png', 'brand/logo-512.png', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-maskable-192.png', 'icon-512.png', 'brand/og-default.png']
        img = lambda f, h: f'<figure><img src="data:image/png;base64,{base64.b64encode((PUBLIC / f).read_bytes()).decode()}" style="height:{h}px"><figcaption>{f}</figcaption></figure>'
        inline = lambda svg, h, bg, color: f'<figure style="background:{bg};color:{color}"><div style="height:{h}px">{svg.replace("<svg ", f"<svg height=\"{h}\" ")}</div><figcaption>{h}px</figcaption></figure>'
        page.set_viewport_size({'width': 1400, 'height': 900})
        page.set_content(f'''<html><body style="margin:24px;font:13px sans-serif;background:#fff"><style>figure{{display:inline-block;margin:10px;padding:10px;vertical-align:top;border:1px solid #ddd}}figcaption{{margin-top:6px;color:#555}}</style>
          <h2>HomezyPro brand preview</h2>
          {img('brand/logo.png', 80)}{inline(svgs['logo-mono.svg'], 40, INK, PAPER)}{inline(svgs['logo-mono.svg'], 24, '#fff', INK)}
          <br>{''.join(inline(mark_svg(size=n), n, '#fff', INK) for n in (16, 24, 32, 48))}
          {''.join(img(f, h) for f, h in [('favicon-16x16.png', 16), ('favicon-32x32.png', 32), ('apple-touch-icon.png', 90), ('icon-192.png', 96), ('icon-maskable-192.png', 96), ('brand/logo-512.png', 160)])}
          <br>{img('brand/og-default.png', 315)}</body></html>''')
        page.wait_for_timeout(200)
        page.screenshot(path='/tmp/hz-brand.png', full_page=True)
        browser.close()
    print('Brand assets written; preview at /tmp/hz-brand.png')


if __name__ == '__main__':
    main()
