#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f "$HOME/.nvm/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "$HOME/.nvm/nvm.sh"
  nvm use
fi

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="${JAVA_HOME:-/home/mhdial/java/jdk-17}"
if [[ ! -x "$JAVA_HOME/bin/javac" ]]; then
  export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
export NODE_ENV=production
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

VERSION="$(node -p "require('./package.json').version")"
VERSION_CODE="$(node -p "parseInt(require('./package.json').version.split('.')[2]||'0',10)||1")"
APK_NAME="Castle-v${VERSION}.apk"

if [[ ! -d "$ANDROID_HOME" ]]; then
  echo "Android SDK not found at $ANDROID_HOME"
  echo "Install the SDK or set ANDROID_HOME, then run: npm run prebuild:android"
  exit 1
fi

if [[ ! -d "$ROOT/android" ]]; then
  echo "android/ missing — run: npm run prebuild:android"
  exit 1
fi

if [[ -f "$ROOT/android/app/build.gradle" ]]; then
  sed -i "s/versionCode [0-9][0-9]*/versionCode ${VERSION_CODE}/" "$ROOT/android/app/build.gradle"
  sed -i "s/versionName \"[^\"]*\"/versionName \"${VERSION}\"/" "$ROOT/android/app/build.gradle"
fi

ARCH="${1:-arm64-v8a}"
LOG="$ROOT/build-apk.log"

echo "Building release APK v${VERSION} (arch=$ARCH)…"
echo "Log: $LOG"

cd "$ROOT/android"
./gradlew assembleRelease \
  --init-script "$ROOT/scripts/android-mirror-init.gradle" \
  -PreactNativeArchitectures="$ARCH" \
  --no-daemon \
  2>&1 | tee "$LOG"

APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
if [[ -f "$APK" ]]; then
  cp "$APK" "$ROOT/${APK_NAME}"
  echo ""
  echo "APK ready:"
  echo "  $APK"
  echo "  $ROOT/${APK_NAME}"
  ls -lh "$APK"
else
  echo "Build finished but APK not found at $APK"
  exit 1
fi
