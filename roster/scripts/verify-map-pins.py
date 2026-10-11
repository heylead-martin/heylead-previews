"""Refresh building-level pins from cited Google place embeds. Never guess coordinates."""
import concurrent.futures
import datetime
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]

def tidy(value):
    return str(value or '').replace('\u2013', '-').replace('\u2014', '-')

def records(value):
    if isinstance(value, list):
        if len(value) > 2 and isinstance(value[0], list) and len(value[0]) > 3 and isinstance(value[0][2], list) and len(value[0][2]) == 2 and isinstance(value[1], str):
            yield value
        for child in value:
            yield from records(child)

def verify(company):
    address = company.get('address', {})
    original = address.get('value', '')
    postals = re.findall(r'(?<!\d)\d{6}(?!\d)', original)
    postal = address.get('postal') or (postals[-1] if postals else '')
    source = (company.get('googleRating') or {}).get('sourceUrl') or company.get('mapsUrl', '')
    cid = parse_qs(urlparse(source).query).get('cid', [''])[0]
    base = {'addressValue': original, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}
    if not re.fullmatch(r'\d{6}', postal) or not re.fullmatch(r'\d+', cid):
        return company['slug'], {**base, 'status': 'unresolved', 'reason': 'A sourced place CID and Singapore postal code are needed.'}
    url = f'https://www.google.com/maps?cid={cid}&z=17&output=embed'
    try:
        raw = subprocess.check_output(['/usr/bin/curl', '-LfsS', '--max-time', '20', url], stderr=subprocess.DEVNULL).decode()
        match = re.search(r'initEmbed\((\[.*?\])\);', raw, re.S)
        if not match:
            raise ValueError('No place data in the embed response')
        data = json.loads(match.group(1))
        for place in records(data):
            location = place[0]
            if str(location[3]) != cid:
                continue
            lat, lng = location[2]
            source_address = ' '.join(place[2]) if isinstance(place[2], list) else str(location[1])
            source_postals = re.findall(r'(?<!\d)\d{6}(?!\d)', source_address)
            if postal not in source_postals:
                raise ValueError('The place postal code does not match the published address')
            if not (isinstance(lat, (int, float)) and isinstance(lng, (int, float)) and 1.15 < lat < 1.48 and 103.59 < lng < 104.1):
                raise ValueError('Coordinates fall outside Singapore')
            return company['slug'], {**base, 'status': 'verified', 'latitude': lat, 'longitude': lng, 'precision': 'building', 'postal': postal, 'cid': cid, 'sourceName': tidy(place[1]), 'sourceUrl': url, 'matchedBy': 'cited-place-cid-and-postal-code'}
        raise ValueError('No matching place marker')
    except (subprocess.SubprocessError, ValueError, TypeError, UnicodeError) as error:
        return company['slug'], {**base, 'status': 'unresolved', 'reason': str(error)[:160], 'sourceUrl': url}

if __name__ == '__main__':
    companies = json.loads((ROOT/'data/companies.json').read_text())['companies']
    result = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for n, (slug, pin) in enumerate(pool.map(verify, companies), 1):
            result[slug] = pin
            if n % 50 == 0:
                print(f'Checked {n}/{len(companies)} places', flush=True)
    # The source address is a cache key only. Publish no apartment or unit text here.
    import hashlib
    for pin in result.values():
        pin['addressHash'] = hashlib.sha256(pin.pop('addressValue').encode()).hexdigest()
    (ROOT/'data/map-pins.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    verified = sum(p['status']=='verified' for p in result.values())
    print(f'{verified} verified building pins; {len(result)-verified} address fallbacks', flush=True)
