#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
APK="$ROOT/Castle-v${VERSION}.apk"

if [[ ! -f "$APK" ]]; then
  echo "APK not found: $APK"
  echo "Build first: npm run build:apk:gradle"
  exit 1
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

if ! command -v adb >/dev/null; then
  echo "adb not found. Install Android platform-tools or set ANDROID_HOME."
  exit 1
fi

DEVICES="$(adb devices | awk 'NR>1 && $2=="device" { print $1 }')"
if [[ -z "$DEVICES" ]]; then
  echo "No Android device detected."
  echo "Enable USB debugging, connect the phone, accept the RSA prompt, then retry."
  exit 1
fi

echo "Installing $APK …"
adb install -r "$APK"
echo "Done. Open Castle on your phone."
