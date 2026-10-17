"""HomezyPro brand images: public/assets/homezypro-logo-512.png (Organization logo, icons) and
public/assets/og-default.png (1200x630 default share card). Drawn with Pillow; no external fonts
are required (falls back to Pillow's bundled font). Run by hand: python3 scripts/make-brand-images.py"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
GREEN, PAPER, INK = (14, 94, 63), (243, 240, 233), (27, 33, 32)


def font(size):
    for name in ('DejaVuSans-Bold.ttf', 'LiberationSans-Bold.ttf', 'Arial Bold.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default(size)


def mark(size):
    """The favicon.svg mark (roofline over an H) at `size` px."""
    s = size / 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=round(8 * s), fill=GREEN)
    d.line([(7.5 * s, 14.5 * s), (16 * s, 7.5 * s), (24.5 * s, 14.5 * s)], fill=PAPER, width=max(2, round(2.2 * s)), joint='curve')
    for box in ((11, 13.6, 13.7, 24), (18.3, 13.6, 21, 24), (13.7, 17.3, 18.3, 19.7)):
        d.rectangle(tuple(v * s for v in box), fill=PAPER)
    return img


def main():
    out = ROOT / 'public/assets'
    out.mkdir(parents=True, exist_ok=True)
    mark(512).save(out / 'homezypro-logo-512.png', optimize=True)
    card = Image.new('RGB', (1200, 630), PAPER)
    card.paste(mark(180), (90, 150), mark(180))
    d = ImageDraw.Draw(card)
    d.text((310, 165), 'HomezyPro', font=font(112), fill=INK)
    d.text((316, 305), 'Home services, compared with sources.', font=font(40), fill=GREEN)
    d.text((92, 480), 'Sourced services, published prices and Google ratings for home-service companies.', font=font(28), fill=INK)
    card.save(out / 'og-default.png', optimize=True)


if __name__ == '__main__':
    main()
