#!/usr/bin/env python3
"""
Generates the site's brand marks from the Tanker display face.

    python scripts/brand-icons.py

Outputs (all committed, this only needs re-running if the mark changes):
    src/app/icon.svg        vector favicon — what modern browsers actually use
    src/app/favicon.ico     multi-size raster fallback (16/32/48/64/128/256)
    src/app/apple-icon.png  180x180 for the iOS home screen

The mark is a bare Tanker "R" — no background, no glow, just the letterform.

⚠️ A background-less favicon has to survive BOTH light and dark browser chrome,
and each output solves that differently:
  * icon.svg     — ADAPTS. An SVG favicon is a live document, so a
                   `prefers-color-scheme` block inside it recolours the glyph:
                   near-black on a light tab strip, white on a dark one. This is
                   the file modern browsers actually use.
  * favicon.ico  — cannot adapt, so it takes the near-black. It is only reached
                   by browsers too old for SVG favicons (pre-16.4 Safari), and
                   those sit on light tab strips by default.
  * apple-icon   — white, on transparent. iOS flattens icon transparency to
                   BLACK, so this lands as a white R on near-black, which is the
                   site's own canvas.

⚠️ The SVG embeds the R as a PATH, not as text. An SVG favicon is rendered by the
browser with no access to our webfont, so `<text font-family="Tanker">` would
silently fall back to something generic. The outline is extracted from the TTF.

⚠️ Tanker ships as WOFF2, which neither fontTools nor Satori can read directly.
`src/app/fonts/Tanker-Regular.ttf` is a committed conversion of it (also used by
the OG image route). Regenerate with:
    python -c "from fontTools.ttLib import TTFont; f=TTFont('src/app/fonts/Tanker-Regular.woff2'); f.flavor=None; f.save('src/app/fonts/Tanker-Regular.ttf')"

Requires: fontTools, brotli, Pillow  (dev-only — not a runtime dependency).
"""

from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
TTF = ROOT / "src/app/fonts/Tanker-Regular.ttf"
APP = ROOT / "src/app"

# Hero palette (globals.css `.hero-dark` + the tunnel's node colour).
INK = (11, 13, 18)  # near-black, a hair off --color-bg so it isn't pure #000
PAPER = (255, 255, 255)

GLYPH = "R"


def glyph_path() -> tuple[str, tuple[float, float, float, float], int]:
    """SVG path data for the mark's letter, plus its bounds and the font upem."""
    font = TTFont(TTF)
    glyphs = font.getGlyphSet()
    name = font.getBestCmap()[ord(GLYPH)]
    pen = SVGPathPen(glyphs)
    glyphs[name].draw(pen)
    bounds = BoundsPen(glyphs)
    glyphs[name].draw(bounds)
    return pen.getCommands(), bounds.bounds, font["head"].unitsPerEm


def write_svg() -> None:
    path, (x0, y0, x1, y1), upem = glyph_path()
    box = 512

    # No background to pad against, so the letter nearly fills the canvas —
    # a bare glyph set small just reads as a speck in a 16px tab.
    target_h = 452.0
    scale = target_h / (y1 - y0)
    w = (x1 - x0) * scale
    tx = (box - w) / 2 - x0 * scale
    # Font coords are Y-up, SVG is Y-down: flip, and put the baseline where the
    # letter's bottom should land.
    ty = (box - target_h) / 2 + target_h + y0 * scale

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {box} {box}" role="img" aria-label="Rudyman">
  <style>
    /* The tab strip is light by default and dark when the OS/browser is —
       so the glyph follows it. Without this a background-less favicon is
       invisible for half of all users. */
    path {{ fill: rgb{INK}; }}
    @media (prefers-color-scheme: dark) {{ path {{ fill: rgb{PAPER}; }} }}
  </style>
  <path transform="translate({tx:.2f} {ty:.2f}) scale({scale:.5f} {-scale:.5f})" d="{path}"/>
</svg>
"""
    (APP / "icon.svg").write_text(svg, encoding="utf-8")
    print("wrote src/app/icon.svg")


def render(size: int, colour: tuple[int, int, int]) -> Image.Image:
    """The same bare mark, rasterised on transparency. Drawn big and
    downsampled so the small favicon sizes stay clean."""
    S = 1024
    base = Image.new("RGBA", (S, S), (0, 0, 0, 0))

    # The letter, sized off its real ink bounds so it is optically centred
    # rather than centred on the font's line box.
    target_h = S * 0.88
    probe = ImageFont.truetype(str(TTF), 100)
    bx0, by0, bx1, by1 = probe.getbbox(GLYPH)
    px = int(round(100 * target_h / (by1 - by0)))
    font = ImageFont.truetype(str(TTF), px)
    bx0, by0, bx1, by1 = font.getbbox(GLYPH)
    d = ImageDraw.Draw(base)
    d.text(
        ((S - (bx1 - bx0)) / 2 - bx0, (S - (by1 - by0)) / 2 - by0),
        GLYPH,
        font=font,
        fill=colour + (255,),
    )
    return base.resize((size, size), Image.LANCZOS)


def write_raster() -> None:
    sizes = [16, 32, 48, 64, 128, 256]
    render(256, INK).save(APP / "favicon.ico", sizes=[(s, s) for s in sizes])
    print("wrote src/app/favicon.ico", sizes, "(near-black, legacy fallback)")
    render(180, PAPER).save(APP / "apple-icon.png")
    print("wrote src/app/apple-icon.png 180x180 (white; iOS flattens to black)")


if __name__ == "__main__":
    write_svg()
    write_raster()
