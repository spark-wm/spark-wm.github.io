"""Subset the two Latin fonts of the site to fixed character ranges (the page is in English only).

The outputs in src/assets/fonts/ are committed, so this only needs to run after a font file
or a range below changes.

usage: python3 tools/build_fonts.py
"""
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts"
OUT = ROOT / "src" / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

LATIN = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2009,U+200B,U+2013,U+2018-201A,U+201C-201E,U+2020-2022,U+2026,U+2032-2033,U+20AC,U+2122,U+2190-2193,U+2212,U+2248,U+2264-2265,U+00D7"


def run(src, dst, unicodes, axes):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = False
    # keep only the axis ranges the page uses
    font = instancer.instantiateVariableFont(TTFont(src), axes)
    s = subset.Subsetter(opts)
    s.populate(unicodes=subset.parse_unicodes(unicodes))
    s.subset(font)
    font.flavor = "woff2"
    font.save(dst)
    print(dst.name, dst.stat().st_size // 1024, "KB")


# keep in step with the @font-face ranges in src/styles.css
# UI font: weights 400-750, widths 100-116%
run(SRC / "Archivo[wdth,wght].ttf", OUT / "archivo.woff2", LATIN, {"wght": (400, 750), "wdth": (100, 116)})
# prompts only: one static italic at 18 px
run(SRC / "Newsreader-Italic[opsz,wght].ttf", OUT / "newsreader-italic.woff2", LATIN, {"opsz": 18, "wght": 400})
