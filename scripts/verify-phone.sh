#!/usr/bin/env bash
# Build → install → screenshot → logcat. Run after map/renderer changes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
LOG="$ROOT/build-apk.log"
SHOT="$ROOT/screenshots"
VERSION="$(node -p "require('./package.json').version")"

mkdir -p "$SHOT"

echo "=== Build Castle v${VERSION} ==="
npm run build:apk:gradle 2>&1 | tee "$LOG"
echo ""
echo "=== Install ==="
npm run install:apk

echo "=== Launch app ==="
adb shell am force-stop com.lifescastle.app
adb shell monkey -p com.lifescastle.app -c android.intent.category.LAUNCHER 1 >/dev/null
sleep 4

STAMP="$(date +%Y%m%d-%H%M%S)"
adb shell screencap -p "/sdcard/castle-${STAMP}.png"
adb pull "/sdcard/castle-${STAMP}.png" "$SHOT/castle-${STAMP}.png"
echo "Screenshot: $SHOT/castle-${STAMP}.png"

echo "=== ReactNativeJS log (last 40) ==="
adb logcat -d -s ReactNativeJS:* 2>/dev/null | tail -40 || true

echo "=== Done ==="
