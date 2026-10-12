"""Simplify the official SLA polygon download for Roster's overview map.

Usage: python3 roster/scripts/prepare-home-map.py /path/to/download.geojson
The source is National Map Polygon, data.gov.sg dataset
d_29f066d67df3eae91df8a42f443863c8, under the Singapore Open Data Licence.
"""
import hashlib
import json
import math
from pathlib import Path
import sys


def simplify(points, tolerance=0.00018):
    if len(points) < 3:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    length = dx * dx + dy * dy
    def distance(p):
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length)) if length else 0
        return math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)
    index = max(range(1, len(points) - 1), key=lambda i: distance(points[i]))
    if distance(points[index]) <= tolerance:
        return [a, b]
    return simplify(points[:index + 1], tolerance)[:-1] + simplify(points[index:], tolerance)


source = Path(sys.argv[1]).read_bytes()
features = []
for feature in json.loads(source)['features']:
    props, geom = feature['properties'], feature['geometry']
    if not geom:
        continue
    folder = props.get('FOLDERPATH', '')
    kind = {'Layers/Coastal_Outlines': 'land', 'Layers/Parks_NaturalReserve': 'park', 'Layers/Hydrographic': 'water'}.get(folder)
    if not kind or (kind != 'land' and props.get('SHAPE.AREA', 0) < 400000):
        continue
    if kind == 'land' and 'MALAYSIA' in (props.get('NAME') or ''):
        kind = 'context'
    polygons = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
    for polygon in polygons:
        if not any(103.59 <= p[0] <= 104.10 and 1.18 <= p[1] <= 1.49 for p in polygon[0]):
            continue
        rings = [[[round(p[0], 5), round(p[1], 5)] for p in simplify(ring)] for ring in polygon]
        rings = [ring for ring in rings if len(ring) >= 4]
        if rings:
            features.append({'kind': kind, 'rings': rings})
result = {
    'source': 'Singapore Land Authority, National Map Polygon (June 2025)',
    'sourceUrl': 'https://data.gov.sg/datasets/d_29f066d67df3eae91df8a42f443863c8/view',
    'licence': 'Singapore Open Data Licence',
    'downloadedAt': '2026-10-12', 'sourceSha256': hashlib.sha256(source).hexdigest(),
    'simplificationDegrees': 0.00018, 'features': features,
}
target = Path(__file__).resolve().parents[1] / 'data/singapore-outline.json'
target.write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(f'{len(features)} polygons; {target.stat().st_size} bytes')
