"""Install, optimise and frame published company logos for HomezyPro.

Ported from roster/scripts/import-logos.py, optimize-logos.py and fit-logos.py. Reads one JSON
config on stdin:
  {"bundle": "<logos tar.gz>", "publicDir": "<homezypro/public>", "logos": [{localPath, sha256, src}]}

1. Streams the bundle once (never extracts archive paths or follows links), keeping only the
   requested published logos. Every file must match its release sha256 and its image type.
   Animated GIFs and active SVG content are rejected. Any failure stops the import.
2. Writes the served copy to public/logos/: rasters become WebP, longest side <= 256 px, aiming
   for <= 30 KB; sanitised SVGs are served as they are.
3. Measures each raster's margins and writes public/assets/logo-fit.css (CSS framing only).

Prints {"variants": {src: {...}}, "stats": {...}}.
"""
import base64
import hashlib
import io
import json
import re
import sys
import tarfile
import xml.etree.ElementTree as ET
from pathlib import Path

from PIL import Image, ImageChops, ImageSequence

MAX_SIDE = 256
TARGET = 30 * 1024


def check_image(raw, suffix):
    valid = {
        '.png': raw.startswith(b'\x89PNG\r\n\x1a\n'),
        '.jpg': raw.startswith(b'\xff\xd8\xff'),
        '.jpeg': raw.startswith(b'\xff\xd8\xff'),
        '.webp': raw[:4] == b'RIFF' and raw[8:12] == b'WEBP',
        '.avif': raw[4:8] == b'ftyp' and b'avif' in raw[8:40],
        '.gif': raw[:6] in {b'GIF87a', b'GIF89a'},
        '.ico': raw[:4] == b'\x00\x00\x01\x00',
    }
    if suffix == '.svg':
        if b'<!ENTITY' in raw:
            raise ValueError('SVG entities are not supported')
        svg = ET.fromstring(raw)
        if svg.tag.split('}')[-1] != 'svg':
            raise ValueError('Not an SVG image')
        for node in svg.iter():
            if node.tag.split('}')[-1].lower() in {'script', 'foreignobject', 'iframe', 'object', 'embed'}:
                raise ValueError('Active SVG content is not supported')
            for key, value in node.attrib.items():
                key = key.split('}')[-1].lower()
                embedded = re.fullmatch(r'data:image/(png|jpeg);base64,([A-Za-z0-9+/=\s]+)', value) if key == 'href' else None
                if embedded:
                    check_image(base64.b64decode(re.sub(r'\s', '', embedded[2]), validate=True), '.' + embedded[1])
                if key.startswith('on') or (key == 'href' and not value.startswith('#') and not embedded):
                    raise ValueError('SVG handlers and external resources are not supported')
        if re.search(rb'@import|url\(\s*[\x22\x27]?(?!#)[a-z]+:', raw, re.I):
            raise ValueError('External SVG styles are not supported')
    elif not valid.get(suffix):
        raise ValueError('Logo file does not match its image extension')
    if suffix in {'.gif', '.ico'}:
        with Image.open(io.BytesIO(raw)) as image:
            if getattr(image, 'is_animated', False):
                raise ValueError('Animated logos are not supported')
            image.verify()


def encode(image, out):
    """Smallest of: lossless, or lossy at falling quality until under TARGET."""
    best = None
    for quality in (None, 86, 80, 72, 64, 56, 48, 40):
        params = {'lossless': True, 'method': 6} if quality is None else {'quality': quality, 'method': 6, 'alpha_quality': 90}
        image.save(out, 'WEBP', **params)
        size = out.stat().st_size
        if best is None or size < best[0]:
            best = (size, params)
        if size <= TARGET:
            break
    if out.stat().st_size != best[0]:
        image.save(out, 'WEBP', **best[1])
    return out.stat().st_size


def measure(image):
    rgba = image.convert('RGBA')
    width, height = rgba.size
    red, green, blue, alpha = rgba.split()
    bounds = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if not bounds:
        return None
    transparent = alpha.getextrema()[0] < 128
    darkest = ImageChops.darker(ImageChops.darker(red, green), blue)
    if not transparent:
        # Only trim a near-white canvas when its entire outer border is white.
        foreground = darkest.point(lambda value: 255 if value < 245 else 0)
        edges = [(0, 0, width, 1), (0, height - 1, width, height), (0, 0, 1, height), (width - 1, 0, width, height)]
        if all(not foreground.crop(edge).getbbox() for edge in edges):
            bounds = foreground.getbbox() or bounds
    solid = alpha.point(lambda value: 255 if value > 128 else 0)
    light = ImageChops.multiply(solid, darkest.point(lambda value: 255 if value > 210 else 0))
    dark_background = transparent and light.histogram()[255] > solid.histogram()[255] * .7
    left, top, right, bottom = bounds
    guard = max(1, round(max(right - left, bottom - top) * .015))
    left, top = max(0, left - guard), max(0, top - guard)
    right, bottom = min(width, right + guard), min(height, bottom + guard)
    ratio = 1.5 if (right - left) / (bottom - top) > 2 else 1
    scale = 88 / max((right - left) / ratio, bottom - top)
    return {
        'ratio': ratio,
        'width': round(width * scale / ratio, 3), 'height': round(height * scale, 3),
        'x': round(50 + (width - left - right) * scale / (2 * ratio), 3),
        'y': round(50 + (height - top - bottom) * scale / 2, 3),
        'dark': dark_background, 'trimmed': [left, top, right, bottom] != [0, 0, width, height],
    }


def first_frame(raw):
    with Image.open(io.BytesIO(raw)) as source:
        frame = next(ImageSequence.Iterator(source)).copy() if getattr(source, 'is_animated', False) else source.copy()
    return frame.convert('RGBA' if frame.mode in ('RGBA', 'LA', 'P', 'PA') or 'transparency' in frame.info else 'RGB')


def run(config):
    public = Path(config['publicDir']).resolve()
    expected = {}
    for logo in config['logos']:
        name, digest = logo['localPath'], logo['sha256']
        if not re.fullmatch(r'logos/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|avif|svg|gif|ico)', name) or not re.fullmatch(r'[a-f0-9]{64}', digest):
            raise ValueError('Invalid logo path or checksum')
        file = Path(name)
        if logo['src'] != f'/logos/{file.stem}-{digest[:12]}{file.suffix}':
            raise ValueError('Unexpected logo destination')
        if name in expected and expected[name]['sha256'] != digest:
            raise ValueError('Conflicting logo checksums')
        expected[name] = logo
    payloads = {}
    with tarfile.open(config['bundle'], 'r|gz') as archive:
        for member in archive:
            if member.name not in expected:
                continue
            if not member.isfile() or member.size > 10 * 1024 * 1024 or member.name in payloads:
                raise ValueError('Invalid or duplicate logo archive entry')
            payloads[member.name] = archive.extractfile(member).read()
    for name, logo in expected.items():
        if name not in payloads:
            raise ValueError(f'Missing logo {name} in the bundle')
        if hashlib.sha256(payloads[name]).hexdigest() != logo['sha256']:
            raise ValueError(f'Logo checksum mismatch: {name}')
        check_image(payloads[name], Path(name).suffix.lower())

    out_dir = public / 'logos'
    out_dir.mkdir(parents=True, exist_ok=True)
    if out_dir.resolve() != out_dir:
        raise ValueError('Logo destination must not be a symlink')
    keep = set()
    variants = {}
    rules = ['/* Generated by scripts/logos.py (ported from roster fit-logos.py). CSS only. */']
    rasters = config.get('rasters') or {}
    stats = {'logos': 0, 'webp': 0, 'svg': 0, 'rasterisedSvg': 0,'over30k': 0, 'maxBytes': 0, 'servedBytes': 0, 'originalBytes': 0, 'framed': 0}
    for name, logo in sorted(expected.items()):
        raw, original = payloads[name], Path(logo['src'])
        raster = rasters.get(logo['src'])
        if original.suffix.lower() == '.svg':
            # Sanitised SVG, plus its Chrome-rendered WebP (scripts/dev/rasterize-svg-logos.py) when
            # the raster was made from exactly these bytes.
            served = out_dir / original.name
            width = height = None
            if not (raster and raster['svgSha256'] == hashlib.sha256(raw).hexdigest() and (out_dir / Path(raster['src']).name).is_file()):
                served.write_bytes(raw)
                stats['svg'] += 1
            else:
                served = out_dir / Path(raster['src']).name
                with Image.open(served) as done:
                    width, height = done.size
                    frame = done.convert('RGBA')
                stats['rasterisedSvg'] += 1
                fit = measure(frame)
                if fit and (fit['trimmed'] or fit['dark'] or fit['ratio'] != 1):
                    values = ';'.join(f'--logo-{key}:{fit[key]}%' for key in ('width', 'height', 'x', 'y'))
                    if fit['ratio'] > 1:
                        values += f';--logo-ratio:{fit["ratio"]}'
                    if fit['dark']:
                        values += ';--logo-background:#243b32'
                    rules.append(f'.listing-logo.has-logo:has(img[src="/logos/{served.name}"]){{{values}}}')
                    stats['framed'] += 1
        else:
            served = out_dir / (original.stem + '.webp')
            frame = first_frame(raw)
            if not served.exists():
                thumb = frame.copy()
                thumb.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
                encode(thumb, served)
            with Image.open(served) as done:
                width, height = done.size
            stats['webp'] += 1
            fit = measure(frame)
            if fit and (fit['trimmed'] or fit['dark'] or fit['ratio'] != 1):
                values = ';'.join(f'--logo-{key}:{fit[key]}%' for key in ('width', 'height', 'x', 'y'))
                if fit['ratio'] > 1:
                    values += f';--logo-ratio:{fit["ratio"]}'
                if fit['dark']:
                    values += ';--logo-background:#243b32'
                rules.append(f'.listing-logo.has-logo:has(img[src="/logos/{served.name}"]){{{values}}}')
                stats['framed'] += 1
        keep.add(served.name)
        size = served.stat().st_size
        variants[logo['src']] = {'src': f'/logos/{served.name}', 'bytes': size, 'originalBytes': len(raw), 'width': width, 'height': height}
        stats['logos'] += 1
        stats['servedBytes'] += size
        stats['originalBytes'] += len(raw)
        stats['maxBytes'] = max(stats['maxBytes'], size)
        stats['over30k'] += size > TARGET and served.suffix == '.webp'
    # Logos of companies that are no longer published are removed.
    for stale in out_dir.iterdir():
        if stale.name not in keep and stale.is_file():
            stale.unlink()
    (public / 'assets').mkdir(parents=True, exist_ok=True)
    (public / 'assets/logo-fit.css').write_text('\n'.join(rules) + '\n')
    return {'variants': variants, 'stats': stats}


if __name__ == '__main__':
    print(json.dumps(run(json.load(sys.stdin))))
