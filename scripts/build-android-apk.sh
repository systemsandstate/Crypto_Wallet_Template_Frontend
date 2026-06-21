#!/usr/bin/env bash
# Build installable Android APK (release, signed with debug keystore for sideloading).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

export ANDROID_HOME="${ANDROID_HOME:-/root/Android/sdk}"
export PATH="$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin"
export EXPO_PUBLIC_API_URL="${EXPO_PUBLIC_API_URL:-https://api.mohsinraza.xyz/api}"

echo "API URL: $EXPO_PUBLIC_API_URL"
echo "ANDROID_HOME: $ANDROID_HOME"

# Fix broken boost download (JFrog returns HTML). Use archives.boost.io mirror.
BOOST_FILE="node_modules/expo-modules-core/android/build/downloads/boost_1_76_0.tar.gz"
if [[ ! -f "$BOOST_FILE" ]] || file "$BOOST_FILE" | grep -q HTML; then
  echo "Downloading boost for Android native build..."
  mkdir -p "$(dirname "$BOOST_FILE")"
  curl -fsSL -o "$BOOST_FILE" \
    "https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.gz"
fi

if [[ ! -d android ]]; then
  echo "Running expo prebuild..."
  CI=1 npx expo prebuild --platform android
fi

echo "Building release APK..."
cd android
chmod +x gradlew
./gradlew assembleRelease --no-daemon

APK_SRC="app/build/outputs/apk/release/app-release.apk"
OUT_DIR="$ROOT_DIR/dist/android"
mkdir -p "$OUT_DIR"
APK_OUT="$OUT_DIR/merchant-payments-release.apk"
cp "$APK_SRC" "$APK_OUT"

echo ""
echo "APK ready: $APK_OUT"
ls -lh "$APK_OUT"
