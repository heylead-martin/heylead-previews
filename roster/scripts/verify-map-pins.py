"""Refresh building-level pins from cited Google places or OneMap address evidence. Never guess coordinates."""
import concurrent.futures
import argparse
import datetime
import json
import math
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

def read_public_url(url):
    try:
        return subprocess.check_output(['/usr/bin/curl', '-LfsS', '--retry', '1', '--retry-delay', '1', '--max-time', '20', url], stderr=subprocess.DEVNULL).decode()
    except subprocess.CalledProcessError as error:
        raise ValueError(f'Location source request failed (curl exit {error.returncode})') from error

def valid_coordinates(lat, lng):
    return (isinstance(lat, (int, float)) and not isinstance(lat, bool)
            and isinstance(lng, (int, float)) and not isinstance(lng, bool)
            and 1.15 < lat < 1.48 and 103.59 < lng < 104.10)

def place_cid(url):
    parsed = urlparse(url or '')
    if parsed.scheme != 'https' or parsed.hostname not in {'maps.google.com', 'www.google.com', 'google.com'}:
        return ''
    cid = parse_qs(parsed.query).get('cid', [''])[0]
    return cid if re.fullmatch(r'\d+', cid) else ''

def verify_address_pin(company, postal):
    evidence = company.get('mapEvidence') or {}
    geo = evidence.get('geocode') or {}
    url = urlparse(geo.get('url', ''))
    block = str(geo.get('blk') or '').strip().upper()
    address = company.get('address', {}).get('value', '')
    public_address = re.sub(r'#\s*[A-Za-z0-9]+(?:\s*[-/]\s*[A-Za-z0-9]+)?', '', address)
    if (not re.fullmatch(r'\d{6}', postal) or geo.get('postal') != postal
            or not evidence.get('addressSourceUrl') or not block
            or url.scheme != 'https' or url.hostname != 'www.onemap.gov.sg'
            or url.path != '/api/common/elastic/search'
            or parse_qs(url.query).get('searchVal') != [postal]
            or not re.match(r'\d{4}-\d{2}-\d{2}', geo.get('capturedAt', ''))):
        raise ValueError('Incomplete or mismatched OneMap address evidence')
    source = f'https://www.onemap.gov.sg/api/common/elastic/search?searchVal={postal}&returnGeom=Y&getAddrDetails=Y&pageNum=1'
    data = json.loads(read_public_url(source))
    matches = [row for row in data.get('results', []) if row.get('POSTAL') == postal and str(row.get('BLK_NO', '')).upper() == block]
    if len(matches) != 1:
        raise ValueError('OneMap did not return one matching postal code and building')
    found = matches[0]
    block_match = re.search(r'(?<![A-Z0-9])' + re.escape(block) + r'(?![A-Z0-9])', public_address.upper())
    if not block_match:
        normalise = lambda s: re.sub(r'[^A-Z0-9 ]', ' ', re.sub(r'\b(AVENUE|ROAD|STREET|LANE)\b', lambda m: {'AVENUE': 'AVE', 'ROAD': 'RD', 'STREET': 'ST', 'LANE': 'LN'}[m[1]], s.upper())).split()
        current_words = set(normalise(public_address))
        road_words = normalise(found.get('ROAD_NAME', ''))
        building_words = normalise(found.get('BUILDING', '').split('@')[0])
        # Accept a named road/building with a unique postal match, but not a district alone.
        name_match = (len(road_words) >= 2 and set(road_words) <= current_words) or (len(building_words) >= 2 and set(building_words) <= current_words)
        explicit_house = re.search(r'^(?:BLK\s+|BLOCK\s+)?\d+[A-Z]?\b|,\s*\d+[A-Z]?\s+[A-Z]', public_address.upper())
        if not name_match or explicit_house:
            raise ValueError('OneMap building or street does not match the published address')
    lat, lng = float(found['LATITUDE']), float(found['LONGITUDE'])
    if not valid_coordinates(lat, lng):
        raise ValueError('OneMap coordinates fall outside Singapore')
    if not valid_coordinates(evidence.get('latitude'), evidence.get('longitude')) or not (
            math.isclose(lat, evidence['latitude'], abs_tol=0.00005)
            and math.isclose(lng, evidence['longitude'], abs_tol=0.00005)):
        raise ValueError('OneMap marker does not match the released building coordinates')
    return {'status': 'verified', 'latitude': lat, 'longitude': lng, 'precision': 'building',
            'postal': postal, 'sourceName': 'OneMap published-address location', 'sourceUrl': source,
            'matchedBy': 'onemap-postal-and-building', 'addressSourceUrl': evidence['addressSourceUrl'],
            'evidenceCapturedAt': geo['capturedAt']}

def verify(company):
    address = company.get('address', {})
    original = address.get('value', '')
    postals = re.findall(r'(?<!\d)\d{6}(?!\d)', original)
    postal = address.get('postal') or (postals[-1] if postals else '')
    source = (company.get('googleRating') or {}).get('sourceUrl') or company.get('mapsUrl', '')
    base = {'addressValue': original, 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds')}
    evidence = company.get('mapEvidence') or {}
    if evidence.get('status') == 'address-geocoded':
        try:
            return company['slug'], {**base, **verify_address_pin(company, postal)}
        except (subprocess.SubprocessError, ValueError, TypeError, UnicodeError, KeyError) as error:
            return company['slug'], {**base, 'status': 'unresolved', 'reason': str(error)[:160]}
    place = evidence.get('place') or {}
    if evidence.get('status') == 'verified' and place.get('postal') == postal and place_cid(place.get('url')) == str(place.get('cid')):
        source = place['url']
    cid = place_cid(source)
    if not re.fullmatch(r'\d{6}', postal) or not re.fullmatch(r'\d+', cid):
        return company['slug'], {**base, 'status': 'unresolved', 'reason': 'A sourced place CID and Singapore postal code are needed.'}
    url = f'https://www.google.com/maps?cid={cid}&z=17&output=embed'
    try:
        raw = read_public_url(url)
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
            if not valid_coordinates(lat, lng):
                raise ValueError('Coordinates fall outside Singapore')
            return company['slug'], {**base, 'status': 'verified', 'latitude': lat, 'longitude': lng, 'precision': 'building', 'postal': postal, 'cid': cid, 'sourceName': tidy(place[1]), 'sourceUrl': url, 'matchedBy': 'cited-place-cid-and-postal-code'}
        raise ValueError('No matching place marker')
    except (subprocess.SubprocessError, ValueError, TypeError, UnicodeError) as error:
        return company['slug'], {**base, 'status': 'unresolved', 'reason': str(error)[:160], 'sourceUrl': url}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', nargs='+', help='Recheck selected published slugs without replacing other checked pins')
    args = parser.parse_args()
    companies = json.loads((ROOT/'data/companies.json').read_text())['companies']
    result = json.loads((ROOT/'data/map-pins.json').read_text()) if args.only else {}
    if args.only:
        unknown = set(args.only) - {c['slug'] for c in companies}
        if unknown:
            parser.error('Unknown company slugs: ' + ', '.join(sorted(unknown)))
        companies = [c for c in companies if c['slug'] in args.only]
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for n, (slug, pin) in enumerate(pool.map(verify, companies), 1):
            result[slug] = pin
            if n % 50 == 0:
                print(f'Checked {n}/{len(companies)} places', flush=True)
    # The source address is a cache key only. Publish no apartment or unit text here.
    import hashlib
    for pin in result.values():
        if 'addressValue' in pin:
            pin['addressHash'] = hashlib.sha256(pin.pop('addressValue').encode()).hexdigest()
    (ROOT/'data/map-pins.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')
    verified = sum(p['status']=='verified' for p in result.values())
    print(f'{verified} verified building pins; {len(result)-verified} address fallbacks', flush=True)
    print(f"OneMap address pins: {sum(p.get('matchedBy') == 'onemap-postal-and-building' for p in result.values())}", flush=True)
