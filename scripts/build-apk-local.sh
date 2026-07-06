#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

unset npm_config_prefix
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
VERSION_CODE="$(node -p "(() => { const p=require('./package.json').version.split('.').map(Number); return p[0]*10000+p[1]*100+p[2]; })()")"
APK_NAME="Castle-v${VERSION}.apk"
GRADLE_BIN="${GRADLE_BIN:-$HOME/.gradle/wrapper/dists/gradle-8.14.3-bin/cv11ve7ro1n3o1j4so8xd9n66/gradle-8.14.3/bin/gradle}"

# Drop stale Metro bundle so release always picks up latest JS.
rm -rf "$ROOT/android/app/build/generated/assets/createBundleReleaseJsAndAssets" \
  "$ROOT/android/app/build/intermediates/sourcemaps" 2>/dev/null || true

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
CLEAN="${CLEAN:-0}"
LOG="$ROOT/build-apk.log"

echo "Building release APK v${VERSION} (arch=$ARCH, clean=$CLEAN)…"
echo "Log: $LOG"

GRADLE_TASKS=(assembleRelease)
if [[ "$CLEAN" == "1" ]]; then
  GRADLE_TASKS=(clean "${GRADLE_TASKS[@]}")
fi

cd "$ROOT/android"
if [[ -x "$GRADLE_BIN" ]]; then
  "$GRADLE_BIN" "${GRADLE_TASKS[@]}" \
    --init-script "$ROOT/scripts/android-mirror-init.gradle" \
    -PreactNativeArchitectures="$ARCH" \
    --no-daemon \
    2>&1 | tee "$LOG"
else
  ./gradlew "${GRADLE_TASKS[@]}" \
    --init-script "$ROOT/scripts/android-mirror-init.gradle" \
    -PreactNativeArchitectures="$ARCH" \
    --no-daemon \
    2>&1 | tee "$LOG"
fi

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
