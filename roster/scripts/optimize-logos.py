"""Served logo copies (review P1-14): WebP, longest side at most 256 px (2x the largest display
size), aiming for 30 KB or less. The checksummed originals stay in assets/logos/ as the import
record, and every page serves the copy in assets/logos/web/. Copies are named after the original,
whose filename already carries its sha256 prefix, so an unchanged logo is never re-encoded.
Writes data/logo-variants.json: {original src: {src, bytes, originalBytes, width, height}}."""
import json
import re
from pathlib import Path

from PIL import Image, ImageSequence

MAX_SIDE = 256
TARGET = 30 * 1024


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


def variant(root, src):
    file = root / src.removeprefix('/roster/')
    out = root / 'assets/logos/web' / (file.stem + '.webp')
    if not out.exists():
        with Image.open(file) as source:
            frame = next(ImageSequence.Iterator(source)).copy() if getattr(source, 'is_animated', False) else source.copy()
        frame = frame.convert('RGBA' if frame.mode in ('RGBA', 'LA', 'P', 'PA') or 'transparency' in frame.info else 'RGB')
        frame.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        encode(frame, out)
    with Image.open(out) as done:
        width, height = done.size
    return {'src': '/roster/' + str(out.relative_to(root)), 'bytes': out.stat().st_size,
            'originalBytes': file.stat().st_size, 'width': width, 'height': height}


def main(root):
    presentation = json.loads((root / 'data/presentation.json').read_text())
    sources = sorted({entry.get('logo', '') for entry in presentation.values()} - {''})
    variants = {}
    for src in sources:
        if not re.fullmatch(r'/roster/assets/logos/[A-Za-z0-9_.-]+', src):
            raise ValueError(f'Unexpected local logo path: {src}')
        if src.lower().endswith('.svg'):
            # Vectors are served as they are (sanitised on import) unless rasterize-svg-logos.py made a copy.
            if (root / 'assets/logos/web' / (Path(src).stem + '.webp')).exists():
                variants[src] = variant(root, src)
            continue
        variants[src] = variant(root, src)
    (root / 'data/logo-variants.json').write_text(json.dumps(variants, indent=1, sort_keys=True) + '\n')
    served = sum(v['bytes'] for v in variants.values())
    original = sum(v['originalBytes'] for v in variants.values())
    return {'logos': len(variants), 'originalBytes': original, 'servedBytes': served,
            'over30k': sum(v['bytes'] > TARGET for v in variants.values()),
            'maxBytes': max((v['bytes'] for v in variants.values()), default=0)}


if __name__ == '__main__':
    print(json.dumps(main(Path(__file__).resolve().parents[1])))
