import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('map_pins', Path(__file__).with_name('verify-map-pins.py'))
pins = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pins)


class MapPinTests(unittest.TestCase):
    def setUp(self):
        self.company = {'slug': 'example', 'address': {'value': '15 Yishun Industrial Street 1 #02-30, Singapore 768091', 'postal': '768091'},
                        'mapEvidence': {'status': 'address-geocoded', 'latitude': 1.4377249, 'longitude': 103.8446221,
                                        'addressSourceUrl': 'https://example.com/contact',
                                        'geocode': {'url': 'https://www.onemap.gov.sg/api/common/elastic/search?searchVal=768091&returnGeom=Y&getAddrDetails=Y&pageNum=1',
                                                    'postal': '768091', 'blk': '15', 'capturedAt': '2026-10-12'}}}
        self.result = {'results': [{'POSTAL': '768091', 'BLK_NO': '15', 'LATITUDE': '1.4377248991', 'LONGITUDE': '103.8446221411'}]}

    def test_onemap_accepts_only_matched_building_and_omits_unit_details(self):
        with patch.object(pins, 'read_public_url', return_value=json.dumps(self.result)):
            slug, record = pins.verify(self.company)
        self.assertEqual(slug, 'example')
        self.assertEqual(record['status'], 'verified')
        self.assertEqual(record['matchedBy'], 'onemap-postal-and-building')
        self.assertNotIn('#02-30', record['sourceUrl'])
        self.assertNotIn('cid', record)

    def test_conflicting_postal_block_coordinates_and_ambiguous_results_fail_closed(self):
        for field, value in [('POSTAL', '555856'), ('BLK_NO', '16'), ('LATITUDE', '0'), ('LONGITUDE', '103.90')]:
            result = copy.deepcopy(self.result)
            result['results'][0][field] = value
            with self.subTest(field=field), patch.object(pins, 'read_public_url', return_value=json.dumps(result)):
                self.assertEqual(pins.verify(self.company)[1]['status'], 'unresolved')
        with patch.object(pins, 'read_public_url', return_value=json.dumps({'results': self.result['results'] * 2})):
            self.assertEqual(pins.verify(self.company)[1]['status'], 'unresolved')

    def test_bad_source_and_changed_address_do_not_make_requests(self):
        for change in ['host', 'postal', 'building']:
            company = copy.deepcopy(self.company)
            if change == 'host':
                company['mapEvidence']['geocode']['url'] = 'https://unrelated.example/?searchVal=768091'
            elif change == 'postal':
                company['address']['postal'] = '555856'
            else:
                company['address']['value'] = '16 Yishun Industrial Street 1, Singapore 768091'
            with patch.object(pins, 'read_public_url', return_value=json.dumps(self.result)) as fetch:
                self.assertEqual(pins.verify(company)[1]['status'], 'unresolved')
                if change != 'building':
                    fetch.assert_not_called()

    def test_named_building_or_street_can_match_without_a_house_number(self):
        for address, extra in [('Yishun Industrial Street 1, Singapore 768091', {'ROAD_NAME': 'YISHUN INDUSTRIAL STREET 1'}), ('Win 5, Singapore 768091', {'BUILDING': 'WIN 5'})]:
            company = copy.deepcopy(self.company)
            company['address']['value'] = address
            result = copy.deepcopy(self.result)
            result['results'][0].update(extra)
            with patch.object(pins, 'read_public_url', return_value=json.dumps(result)):
                self.assertEqual(pins.verify(company)[1]['status'], 'verified')

    def test_missing_api_results_stays_unresolved(self):
        with patch.object(pins, 'read_public_url', return_value=json.dumps({'error': 'Authentication required'})):
            self.assertEqual(pins.verify(self.company)[1]['status'], 'unresolved')

    def test_sourced_candidate_cid_resolves_search_url_without_changing_rating_source(self):
        company = copy.deepcopy(self.company)
        company['mapsUrl'] = 'https://www.google.com/maps/search/?query=Example'
        company['mapEvidence'] = {'status': 'verified', 'place': {'cid': '12345678901234567890', 'postal': '768091', 'url': 'https://maps.google.com/?cid=12345678901234567890'}}
        record = [[None, 'Building', [1.4377249, 103.8446221], '12345678901234567890'], 'Example', ['15 Street', 'Singapore 768091']]
        with patch.object(pins, 'read_public_url', return_value='initEmbed(' + json.dumps([record]) + ');') as fetch:
            result = pins.verify(company)[1]
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['cid'], '12345678901234567890')
        self.assertIn('cid=12345678901234567890', fetch.call_args.args[0])
        self.assertIn('/search/', company['mapsUrl'])


if __name__ == '__main__':
    unittest.main()
