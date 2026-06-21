#!/usr/bin/env bash
# PM2-friendly Expo start (no port-kill — PM2 manages the process lifecycle).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

METRO_PORT="${EXPO_METRO_PORT:-8081}"
export REACT_NATIVE_PACKAGER_HOSTNAME="${EXPO_PUBLIC_HOST:-mohsinraza.xyz}"
export EXPO_DEVTOOLS_LISTEN_ADDRESS="${EXPO_DEVTOOLS_LISTEN_ADDRESS:-0.0.0.0}"
export EXPO_UNSTABLE_HEADLESS="${EXPO_UNSTABLE_HEADLESS:-1}"

EXPO_URL="exp://${REACT_NATIVE_PACKAGER_HOSTNAME}:${METRO_PORT}"
node scripts/print-expo-qr.js "${EXPO_URL}" || true

exec npx expo start --host lan --go --port "${METRO_PORT}"
