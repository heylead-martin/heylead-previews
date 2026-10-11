from pathlib import Path
import runpy
import unittest

from PIL import Image

measure = runpy.run_path(str(Path(__file__).with_name('fit-logos.py')))['measure']


class LogoFramingTests(unittest.TestCase):
    def test_transparent_whitespace_and_light_artwork(self):
        image = Image.new('RGBA', (400, 160))
        image.paste((255, 255, 255, 255), (140, 20, 260, 140))
        fit = measure(image)
        self.assertTrue(fit['dark'])
        self.assertEqual(fit['bounds'], [138, 18, 262, 142])
        self.assertEqual((fit['x'], fit['y']), (50, 50))
        self.assertAlmostEqual(fit['width'] * fit['ratio'] / fit['height'], 2.5, places=3)

    def test_off_center_artwork_stays_inside_the_frame(self):
        image = Image.new('RGBA', (400, 300))
        image.paste((30, 80, 50, 255), (20, 80, 80, 240))
        fit = measure(image)
        self.assertFalse(fit['dark'])
        left, top, right, bottom = fit['bounds']
        for value, size, position, dimension in [(left, 400, fit['x'], fit['width']), (top, 300, fit['y'], fit['height'])]:
            self.assertGreaterEqual(position - dimension / 2 + value / size * dimension, 5.99)
        self.assertLessEqual(fit['x'] - fit['width'] / 2 + right / 400 * fit['width'], 94.01)
        self.assertLessEqual(fit['y'] - fit['height'] / 2 + bottom / 300 * fit['height'], 94.01)

    def test_white_canvas_is_trimmed_without_losing_wide_text(self):
        image = Image.new('RGB', (400, 160), 'white')
        image.paste((20, 30, 40), (30, 60, 370, 100))
        fit = measure(image)
        self.assertEqual(fit['bounds'], [25, 55, 375, 105])
        self.assertFalse(fit['dark'])
        self.assertEqual(fit['ratio'], 1.5)
        self.assertAlmostEqual(fit['width'] * fit['ratio'] / fit['height'], 2.5, places=3)

    def test_full_bleed_and_empty_images(self):
        self.assertFalse(measure(Image.new('RGB', (80, 80), '#225577'))['trimmed'])
        self.assertIsNone(measure(Image.new('RGBA', (80, 80))))


if __name__ == '__main__':
    unittest.main()
