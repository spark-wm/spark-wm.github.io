"""Subset the site fonts. The Chinese font keeps only the characters used in src/.

usage: python3 tools/build_fonts.py   (CI runs it on every push)
"""
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "fonts"
OUT = ROOT / "src" / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

LATIN = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2009,U+200B,U+2013,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+20AC,U+2122,U+2190-2193,U+2212,U+2248,U+2264-2265,U+00D7"


def run(src, dst, unicodes=None, text=None, axes=None):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.glyph_names = False
    font = TTFont(src)
    if axes:
        # keep only the axis ranges the page uses (Latin fonts: weights 400-750, widths 100-116%)
        font = instancer.instantiateVariableFont(font, axes)
    s = subset.Subsetter(opts)
    kw = {}
    if unicodes:
        kw["unicodes"] = subset.parse_unicodes(unicodes)
    if text:
        kw["text"] = text
    s.populate(**kw)
    s.subset(font)
    font.flavor = "woff2"
    font.save(dst)
    print(dst.name, dst.stat().st_size // 1024, "KB")


def zh_text():
    src = (ROOT / "src" / "content.ts").read_text(encoding="utf-8")
    extra = "".join(p.read_text(encoding="utf-8") for p in (ROOT / "src").rglob("*.vue"))
    chars = set(re.findall(r"[　-〿一-鿿＀-￯“”‘’…、，。：；？！（）《》]", src + extra))
    return "".join(sorted(chars)) + "0123456789"


# keep in step with the @font-face ranges in src/styles.css
run(SRC / "Archivo[wdth,wght].ttf", OUT / "archivo.woff2", unicodes=LATIN, axes={"wght": (400, 750), "wdth": (100, 116)})
# prompts only: one static italic at 18 px
run(SRC / "Newsreader-Italic[opsz,wght].ttf", OUT / "newsreader-italic.woff2", unicodes=LATIN, axes={"opsz": 18, "wght": 400})
run(SRC / "NotoSansSC[wght].ttf", OUT / "noto-sc.woff2", text=zh_text())
