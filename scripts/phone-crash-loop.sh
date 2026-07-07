#!/usr/bin/env bash
# Update-install Castle, exercise key flows via adb, screenshot + crash check.
# NEVER uninstalls — only `adb install -r`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

VERSION="$(node -p "require('./package.json').version")"
APK="$ROOT/Castle-v${VERSION}.apk"
PKG="com.lifescastle.app"
SHOT="$ROOT/screenshots/crash-loop"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$SHOT"

if ! adb devices | awk 'NR>1 && $2=="device" { found=1 } END { exit !found }'; then
  echo "No adb device. Enable USB debugging and reconnect."
  exit 1
fi

if [[ ! -f "$APK" ]]; then
  echo "Missing $APK — run: npm run build:apk:gradle"
  exit 1
fi

tap_center() {
  local bounds="$1"
  local x1 y1 x2 y2 x y
  bounds="${bounds//[\[\]]/}"
  IFS=',' read -r x1 y1 x2 y2 <<<"$bounds"
  x=$(( (x1 + x2) / 2 ))
  y=$(( (y1 + y2) / 2 ))
  adb shell input tap "$x" "$y"
}

find_bounds() {
  local pattern="$1"
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1
  adb pull /sdcard/ui.xml /tmp/castle-ui.xml >/dev/null 2>&1
  grep -oE "${pattern}[^>]*bounds=\"\[[0-9]+,[0-9]+\]\[[0-9]+,[0-9]+\]\"" /tmp/castle-ui.xml \
    | head -1 \
    | sed -E 's/.*bounds="([^"]+)".*/\1/'
}

step() {
  local name="$1"
  sleep "${2:-3}"
  local file="$SHOT/${STAMP}-${name}.png"
  adb shell screencap -p "/sdcard/castle-step.png"
  adb pull /sdcard/castle-step.png "$file" >/dev/null
  local focus fatal rn
  focus="$(adb shell dumpsys window 2>/dev/null | grep mCurrentFocus | head -1 || true)"
  fatal="$(adb logcat -d 2>/dev/null | grep -E 'FATAL EXCEPTION|AndroidRuntime: FATAL' | tail -3 || true)"
  rn="$(adb logcat -d -s ReactNativeJS:E 2>/dev/null | tail -5 || true)"
  echo ""
  echo "=== $name ==="
  echo "Screenshot: $file"
  echo "$focus"
  if [[ -n "$fatal" ]]; then
    echo "CRASH DETECTED:"
    echo "$fatal"
    return 1
  fi
  if [[ -n "$rn" ]]; then
    echo "RN errors:"
    echo "$rn"
  fi
  echo "OK"
  return 0
}

echo "=== Update install (no uninstall) v${VERSION} ==="
adb install -r "$APK"

echo "=== Launch $PKG ==="
adb logcat -c
adb shell am force-stop "$PKG"
sleep 1
adb shell input tap 540 1700 2>/dev/null || true
sleep 0.5
adb shell am start -n "$PKG/.MainActivity"
sleep 6
step "01-launch" 2 || exit 1

echo "=== Settings tab ==="
B="$(find_bounds 'content-desc=".*Settings"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 900 2203
step "02-settings" || exit 1

echo "=== Stats tab ==="
B="$(find_bounds 'content-desc=".*Stats"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 540 2203
step "03-stats" || exit 1

echo "=== Life Map tab ==="
B="$(find_bounds 'content-desc=".*Life Map"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 180 2203
sleep 2
adb shell input swipe 540 400 540 1200 300
sleep 1

echo "=== Focus panel ==="
B="$(find_bounds 'content-desc="Focus"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 783 1784
step "04-focus-panel" || exit 1

echo "=== Close focus panel (tap outside / back) ==="
adb shell input keyevent KEYCODE_BACK
sleep 2
step "05-after-focus-close" || exit 1

adb shell input swipe 540 400 540 1200 300
sleep 1

echo "=== Log Resist (miniature) ==="
B="$(find_bounds 'content-desc="Log Resist"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 783 1357
sleep 2
step "05b-resist" || exit 1

echo "=== View Settlement ==="
B="$(find_bounds 'text="View Settlement"')"
[[ -n "$B" ]] && tap_center "$B" || adb shell input tap 341 1783
sleep 4
step "06-settlement" || exit 1

echo "=== Back from settlement ==="
adb shell input keyevent KEYCODE_BACK
sleep 2

echo "=== Background + resume ==="
adb shell input keyevent KEYCODE_HOME
sleep 2
adb shell am start -n "$PKG/.MainActivity"
sleep 4
step "07-resume" || exit 1

echo "=== Cold relaunch ==="
adb shell am force-stop "$PKG"
sleep 1
adb shell am start -n "$PKG/.MainActivity"
sleep 5
step "08-cold-relaunch" || exit 1

echo ""
echo "All steps passed. Screenshots in $SHOT"
