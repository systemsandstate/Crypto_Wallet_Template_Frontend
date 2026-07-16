#!/usr/bin/env bash
# Publish an OTA (JS/asset) update via EAS Update.
# Usage:
#   bash scripts/publish-ota.sh                 # production channel
#   bash scripts/publish-ota.sh preview "msg"   # preview channel + message
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

CHANNEL="${1:-production}"
MESSAGE="${2:-OTA update $(date -u +%Y-%m-%dT%H:%M:%SZ)}"

if [[ -z "${EXPO_PUBLIC_EAS_PROJECT_ID:-}" ]]; then
  if [[ -f .env ]]; then
    # shellcheck disable=SC1091
    set -a && source .env && set +a
  fi
fi

if [[ -z "${EXPO_PUBLIC_EAS_PROJECT_ID:-}" ]]; then
  echo "Missing EXPO_PUBLIC_EAS_PROJECT_ID."
  echo "Run: npx eas-cli login && npx eas-cli init"
  echo "Then put the project ID in .env as EXPO_PUBLIC_EAS_PROJECT_ID=..."
  exit 1
fi

echo "Publishing OTA to channel=${CHANNEL}"
echo "Message: ${MESSAGE}"

npx eas-cli update \
  --channel "$CHANNEL" \
  --message "$MESSAGE" \
  --non-interactive
