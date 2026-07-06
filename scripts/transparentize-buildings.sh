#!/usr/bin/env bash
# Remove baked-in checkerboard/white backgrounds from AI-generated building sprites.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/assets/building-stages"

for f in "$DIR"/stage-*.png; do
  tmp="${f}.tmp.png"
  convert "$f" \
    -alpha set \
    -fuzz 14% -transparent '#FFFFFF' \
    -fuzz 12% -transparent '#F0F0F0' \
    -fuzz 12% -transparent '#E8E8E8' \
    -fuzz 10% -transparent '#CCCCCC' \
    -fuzz 10% -transparent '#D0D0D0' \
    -trim +repage \
    -bordercolor none -border 12x12 \
    "$tmp"
  mv "$tmp" "$f"
  echo "  $(basename "$f")"
done

echo "Transparency applied to $(ls "$DIR"/stage-*.png | wc -l) sprites"
