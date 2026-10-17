"""Brand images drawn locally with Pillow (no photos, no faces):
- assets/og-default.png, 1200x630: the default share image (review P1-11)
- assets/roster-logo-512.png, 512x512: raster Organization logo for JSON-LD (review P1-12)
Run: python3 scripts/make-brand-images.py   (deterministic; rerun only if the brand changes)"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PAPER, PAPER_DEEP, INK, INK_SOFT, GREEN, GREEN_TINT = '#f3f0e9', '#ebe6db', '#1b2120', '#343b39', '#0e5e3f', '#e2ece5'
FONTS = Path('/usr/share/fonts/truetype/dejavu')
serif = lambda size: ImageFont.truetype(str(FONTS / 'DejaVuSerif-Bold.ttf'), size)
sans = lambda size, bold=False: ImageFont.truetype(str(FONTS / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), size)


def mark(draw, x, y, size):
    """The favicon mark: a green rounded square with a paper-coloured R."""
    draw.rounded_rectangle((x, y, x + size, y + size), radius=size // 4, fill=GREEN)
    font = sans(int(size * 0.62), bold=True)
    box = draw.textbbox((0, 0), 'R', font=font)
    draw.text((x + (size - (box[2] - box[0])) / 2 - box[0], y + (size - (box[3] - box[1])) / 2 - box[1]), 'R', font=font, fill=PAPER)


def og():
    image = Image.new('RGB', (1200, 630), PAPER)
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 560, 1200, 630), fill=PAPER_DEEP)
    mark(draw, 96, 110, 120)
    draw.text((246, 118), 'Roster.', font=serif(96), fill=INK)
    draw.text((100, 290), 'Home services in Singapore,', font=serif(54), fill=INK)
    draw.text((100, 362), 'with the facts behind every listing.', font=serif(54), fill=GREEN)
    draw.text((100, 462), 'Aircon · Plumbing · Electrical · Handyman · Cleaning', font=sans(30), fill=INK_SOFT)
    draw.text((100, 580), 'Unpaid listings. Sourced prices and ratings.', font=sans(24), fill=INK_SOFT)
    image.save(ROOT / 'assets/og-default.png', optimize=True)


def logo():
    image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
    mark(ImageDraw.Draw(image), 0, 0, 512)
    image.save(ROOT / 'assets/roster-logo-512.png', optimize=True)


if __name__ == '__main__':
    og()
    logo()
    for name in ('og-default.png', 'roster-logo-512.png'):
        print(name, (ROOT / 'assets' / name).stat().st_size, 'bytes')
