#!/usr/bin/env python3
"""Build a high-res CoC map background with extended forest edges (no void gaps)."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    os.environ.get(
        'COC_MAP_SRC',
        '/home/mhdial/.cursor/projects/home-mhdial-Documents-projects-WallIdea/assets/___-71013148-35b5-4511-a9eb-9fc834b16d3e.png',
    )
)
OUT = ROOT / 'assets' / 'map' / 'coc-map-background.png'
WILDERNESS = (42, 135, 28)  # MAP_SKY_COLOR #2a871c

SCALE = 2
PAD_FRAC = 0.22  # extra forest margin on each side


def edge_extend(src: Image.Image, pad_x: int, pad_y: int) -> Image.Image:
    w, h = src.size
    out = Image.new('RGB', (w + pad_x * 2, h + pad_y * 2), WILDERNESS)
    out.paste(src, (pad_x, pad_y))

    strip = max(8, min(48, w // 24))
    # Left / right strips mirrored outward
    left = src.crop((0, 0, strip, h)).transpose(Image.FLIP_LEFT_RIGHT)
    right = src.crop((w - strip, 0, w, h)).transpose(Image.FLIP_LEFT_RIGHT)
    left_wide = left.resize((pad_x, h), Image.LANCZOS)
    right_wide = right.resize((pad_x, h), Image.LANCZOS)
    out.paste(left_wide, (0, pad_y))
    out.paste(right_wide, (pad_x + w, pad_y))

    # Top / bottom
    top = out.crop((0, pad_y, out.width, pad_y + strip)).transpose(Image.FLIP_TOP_BOTTOM)
    bottom = out.crop((0, pad_y + h - strip, out.width, pad_y + h)).transpose(
        Image.FLIP_TOP_BOTTOM
    )
    top_wide = top.resize((out.width, pad_y), Image.LANCZOS)
    bottom_wide = bottom.resize((out.width, pad_y), Image.LANCZOS)
    out.paste(top_wide, (0, 0))
    out.paste(bottom_wide, (0, pad_y + h))

    return out.filter(ImageFilter.GaussianBlur(radius=0.6))


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f'Missing source map: {SRC}')

    src = Image.open(SRC).convert('RGB')
    up_w, up_h = src.size[0] * SCALE, src.size[1] * SCALE
    upscaled = src.resize((up_w, up_h), Image.LANCZOS)

    pad_x = int(up_w * PAD_FRAC)
    pad_y = int(up_h * PAD_FRAC)
    extended = edge_extend(upscaled, pad_x, pad_y)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    extended.save(OUT, optimize=True)
    print(f'Wrote {OUT} ({extended.size[0]}x{extended.size[1]})')


if __name__ == '__main__':
    main()
