#!/usr/bin/env bash
# Extract 27 CoC building sprites from reference sheets → transparent PNGs (no labels).
# Outputs: assets/building-stages/stage-NN.png
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/assets/building-previews"
OUT="$ROOT/assets/building-stages"
MAP="$ROOT/assets/map"
mkdir -p "$OUT" "$MAP"

W=1536
H=1024

# Remove sky blue, trim, pad — keeps grass island under each building.
finalize_sprite() {
  local in="$1" out="$2"
  convert "$in" \
    -alpha set \
    -channel RGBA \
    -fuzz 20% -transparent '#87CEEB' \
    -fuzz 18% -transparent '#6BB8E8' \
    -fuzz 16% -transparent '#5EB5EA' \
    -fuzz 14% -transparent '#4A90D9' \
    -fuzz 14% -transparent '#3D8FD9' \
    -fuzz 12% -transparent '#2E7FC8' \
    -trim +repage \
    -bordercolor none -border 8x8 \
    "$out"
}

extract_row7_early() {
  local sheet="$1" start="$2"
  local cell_w=$((W / 7))
  local crop_h=500
  local crop_y=40
  for i in 0 1 2 3 4 5 6; do
    local stage=$((start + i))
    local x=$((i * cell_w))
    local tmp="$OUT/.tmp-stage-${stage}.png"
    local out="$OUT/stage-$(printf '%02d' "$stage").png"
    convert "$sheet" -crop "${cell_w}x${crop_h}+${x}+${crop_y}" +repage "$tmp"
    finalize_sprite "$tmp" "$out"
    rm -f "$tmp"
    echo "  stage-$(printf '%02d' "$stage").png"
  done
}

extract_row7_late() {
  local sheet="$1" start="$2"
  local cell_w=$((W / 7))
  local crop_h=700
  local crop_y=50
  for i in 0 1 2 3 4 5 6; do
    local stage=$((start + i))
    local x=$((i * cell_w))
    local tmp="$OUT/.tmp-stage-${stage}.png"
    local out="$OUT/stage-$(printf '%02d' "$stage").png"
    convert "$sheet" -crop "${cell_w}x${crop_h}+${x}+${crop_y}" +repage "$tmp"
    finalize_sprite "$tmp" "$out"
    rm -f "$tmp"
    echo "  stage-$(printf '%02d' "$stage").png"
  done
}

extract_columns7() {
  local sheet="$1" start="$2"
  local cell_w=$((W / 7))
  local crop_h=500
  local crop_y=35
  for i in 0 1 2 3 4 5 6; do
    local stage=$((start + i))
    local x=$((i * cell_w))
    local tmp="$OUT/.tmp-stage-${stage}.png"
    local out="$OUT/stage-$(printf '%02d' "$stage").png"
    convert "$sheet" \
      -crop "${cell_w}x${crop_h}+${x}+${crop_y}" +repage \
      "$tmp"
    finalize_sprite "$tmp" "$out"
    rm -f "$tmp"
    echo "  stage-$(printf '%02d' "$stage").png"
  done
}

extract_grid6() {
  local sheet="$1" start="$2"
  local cell_w=$((W / 3))
  local cell_h=$((H / 2))
  local crop_h=$((cell_h * 72 / 100))
  local idx=0
  for row in 0 1; do
    for col in 0 1 2; do
      local stage=$((start + idx))
      local x=$((col * cell_w))
      local y=$((row * cell_h + 15))
      local tmp="$OUT/.tmp-stage-${stage}.png"
      local out="$OUT/stage-$(printf '%02d' "$stage").png"
      convert "$sheet" \
        -crop "${cell_w}x${crop_h}+${x}+${y}" +repage \
        "$tmp"
      finalize_sprite "$tmp" "$out"
      rm -f "$tmp"
      echo "  stage-$(printf '%02d' "$stage").png"
      idx=$((idx + 1))
    done
  done
}

extract_map_tiles() {
  echo "Extracting map tiles from reference sheets…"
  # Grass sample from stages 7–13 (full grass, no sky)
  convert "$SRC/stages-7-13.png" \
    -crop "256x256+400+350" +repage \
    -resize 512x512 \
    "$MAP/grass-tile.png"
  # Dirt/path from stages 14–20 map
  convert "$SRC/stages-14-20.png" \
    -crop "256x256+640+280" +repage \
    -resize 512x512 \
    "$MAP/dirt-tile.png"
  # Village work pad — warm packed earth
  convert "$SRC/stages-0-6.png" \
    -crop "220x220+1100+520" +repage \
    -resize 512x512 \
    "$MAP/village-pad.png"
  # Brick wall texture from stage 1 crop
  convert "$SRC/stages-0-6.png" \
    -crop "120x80+440+280" +repage \
    -scale 512x512 \
    "$MAP/brick-tile.png"
  echo "  map/grass-tile.png dirt-tile.png village-pad.png brick-tile.png"
}

echo "Extracting stages 0–6"
extract_row7_early "$SRC/stages-0-6.png" 0

echo "Extracting stages 7–13"
extract_row7_late "$SRC/stages-7-13.png" 7

echo "Extracting stages 14–20"
extract_columns7 "$SRC/stages-14-20.png" 14

echo "Extracting stages 21–26"
extract_grid6 "$SRC/stages-21-26.png" 21

extract_map_tiles

echo "Done — 27 sprites + 4 map tiles"
