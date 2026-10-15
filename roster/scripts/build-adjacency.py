"""Derive planning-area adjacency from the URA Master Plan 2019 boundaries.

Usage: python3 scripts/build-adjacency.py /path/to/MasterPlan2019PlanningAreaBoundaryNoSea.geojson > data/planning-area-adjacency.json

Source: URA Master Plan 2019 Planning Area Boundary (No Sea), data.gov.sg dataset
d_4765db0e87b9c86336792efe8a1f7a66, Singapore Open Data Licence
(https://data.gov.sg/open-data-licence). The GeoJSON itself is not stored in the repo.

Two areas are adjacent when their boundaries run together for at least MIN_SHARED_M metres,
so corner touches and slivers do not count. Boundary vertices are matched within TOL degrees.
"""
import json
import math
import sys
from collections import defaultdict

TOL = 0.00003  # about 3 m
MIN_SHARED_M = 200


def rings(geom):
    c = geom['coordinates']
    for poly in ([c] if geom['type'] == 'Polygon' else c):
        yield from poly


def shared_lengths(features):
    cell = lambda x, y: (int(x / TOL), int(y / TOL))
    names = [f['properties']['PLN_AREA_N'].title() for f in features]
    grid = defaultdict(set)
    for i, f in enumerate(features):
        for ring in rings(f['geometry']):
            for x, y, *_ in ring:
                grid[cell(x, y)].add(i)

    def near(x, y):
        k, found = cell(x, y), set()
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                found |= grid.get((k[0] + dx, k[1] + dy), set())
        return found

    metres = lambda a, b: math.hypot((a[0] - b[0]) * 111320 * math.cos(math.radians(1.35)), (a[1] - b[1]) * 110574)
    length = defaultdict(float)
    for i, f in enumerate(features):
        for ring in rings(f['geometry']):
            prev = None
            for pt in ring:
                cur = near(pt[0], pt[1]) - {i}
                if prev is not None:
                    for j in cur & prev[1]:
                        # Each shared edge is walked once from each side.
                        length[tuple(sorted((names[i], names[j])))] += metres(prev[0], pt) / 2
                prev = (pt, cur)
    return length


def main(path):
    features = json.load(open(path, encoding='utf-8'))['features']
    pairs = sorted([a, b, round(m)] for (a, b), m in shared_lengths(features).items() if m >= MIN_SHARED_M)
    out = {
        'source': 'URA Master Plan 2019 Planning Area Boundary (No Sea), data.gov.sg d_4765db0e87b9c86336792efe8a1f7a66',
        'licence': 'Singapore Open Data Licence, https://data.gov.sg/open-data-licence',
        'method': f'Planning areas sharing at least {MIN_SHARED_M} m of boundary (vertices matched within about 3 m).',
        'pairs': pairs,
    }
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main(sys.argv[1])
