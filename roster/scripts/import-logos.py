"""Install only published logo assets after validating the entire requested batch."""
import hashlib
import base64
import io
import json
from pathlib import Path
import re
import sys
import tarfile
import xml.etree.ElementTree as ET
from PIL import Image


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


def install(config):
    root = Path(config['root']).resolve()
    expected = {}
    for logo in config['logos']:
        name, digest = logo['localPath'], logo['sha256']
        if not re.fullmatch(r'logos/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|avif|svg|gif|ico)', name) or not re.fullmatch(r'[a-f0-9]{64}', digest):
            raise ValueError('Invalid logo path or checksum')
        file = Path(name)
        destination = f'/roster/assets/logos/{file.stem}-{digest[:12]}{file.suffix}'
        if logo['src'] != destination:
            raise ValueError('Unexpected logo destination')
        if name in expected and expected[name]['sha256'] != digest:
            raise ValueError('Conflicting logo checksums')
        expected[name] = logo
    payloads = {}
    bundle = config.get('bundle')
    if bundle:
        # Stream once. Never extract archive paths or follow archive links.
        with tarfile.open(bundle, 'r|gz') as archive:
            for member in archive:
                if member.name not in expected:
                    continue
                if not member.isfile() or member.size > 10 * 1024 * 1024 or member.name in payloads:
                    raise ValueError('Invalid or duplicate logo archive entry')
                payloads[member.name] = archive.extractfile(member).read()
    else:
        for name, logo in expected.items():
            file = root / logo['src'].removeprefix('/roster/')
            if file.is_file() and not file.is_symlink():
                payloads[name] = file.read_bytes()
    for name, logo in expected.items():
        if name not in payloads:
            raise ValueError(f'Missing logo {name}; pass the matching logo bundle as the second import argument')
        raw = payloads[name]
        if hashlib.sha256(raw).hexdigest() != logo['sha256']:
            raise ValueError(f'Logo checksum mismatch: {name}')
        check_image(raw, Path(name).suffix.lower())
    destination = root / 'assets/logos'
    destination.mkdir(parents=True, exist_ok=True)
    if destination.resolve() != destination:
        raise ValueError('Logo destination must not be a symlink')
    for name, logo in expected.items():
        file = root / logo['src'].removeprefix('/roster/')
        if file.is_symlink():
            raise ValueError('Logo destination must not be a symlink')
        file.write_bytes(payloads[name])
    return {'verifiedFiles': len(payloads), 'publishedCompanies': len(config['logos']), 'bytes': sum(map(len, payloads.values()))}


if __name__ == '__main__':
    print(json.dumps(install(json.load(sys.stdin))))
