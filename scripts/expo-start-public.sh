#!/usr/bin/env bash
# Start Expo so phones can reach Metro from outside the server (Expo Go).
# Default host: mohsinraza.xyz (override with EXPO_PUBLIC_HOST=your.domain)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

METRO_PORT="${EXPO_METRO_PORT:-8081}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${EXPO_PUBLIC_HOST:-mohsinraza.xyz}"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="0.0.0.0"
# VPS runs as root — skip Electron-based RN DevTools install (not needed for Expo Go)
export EXPO_UNSTABLE_HEADLESS=1

CLEAR_FLAG=""
for arg in "$@"; do
  if [[ "$arg" == "--clear" ]]; then
    CLEAR_FLAG="--clear"
  fi
done

# Free the Metro port so Expo won't prompt in non-interactive terminals
if command -v fuser >/dev/null 2>&1; then
  fuser -k "${METRO_PORT}/tcp" 2>/dev/null || true
fi

echo "Expo dev host: ${REACT_NATIVE_PACKAGER_HOSTNAME}"
echo "Metro port: ${METRO_PORT}"
SDK_VERSION="$(node -e "const { getConfig } = require('@expo/config'); console.log(getConfig('.').exp?.sdkVersion || 'unknown');")"
echo "Expo SDK: ${SDK_VERSION} (matches Expo_SDK_Reference template)"
echo ""
echo "Expo Go must be SDK ${SDK_VERSION}. Play Store / App Store builds often lag behind."
echo "  Android phone: install Expo Go SDK ${SDK_VERSION} from https://expo.dev/go"
echo "  iOS device:    use TestFlight beta from https://expo.dev/go (store build may be older)"
echo "  Alternative:   use the release APK at https://mohsinraza.xyz/merchant-payments.apk"
echo ""

if [[ "${1:-}" == "--tunnel" ]]; then
  echo "Mode: tunnel (Expo Go SDK 56)"
  echo "QR code will appear after the tunnel URL is ready."
  exec npx expo start --tunnel --go --port "${METRO_PORT}" ${CLEAR_FLAG}
fi

EXPO_URL="exp://${REACT_NATIVE_PACKAGER_HOSTNAME}:${METRO_PORT}"

echo "Mode: LAN/public"
node scripts/print-expo-qr.js "${EXPO_URL}"

exec npx expo start --host lan --go --port "${METRO_PORT}" ${CLEAR_FLAG}
