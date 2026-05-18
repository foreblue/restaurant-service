#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export VITE_BUSINESS_API_MODE="${VITE_BUSINESS_API_MODE:-http}"
export VITE_BUSINESS_API_BASE_URL="${VITE_BUSINESS_API_BASE_URL:-auto}"
export VITE_BUSINESS_APP_ENV="${VITE_BUSINESS_APP_ENV:-local}"

HOST="${BUSINESS_WEB_HOST:-0.0.0.0}"
PORT="${BUSINESS_WEB_PORT:-5173}"

cd "$REPO_ROOT"

exec npm exec pnpm@11.1.2 -- \
  --filter @restaurant/business-web \
  exec vite --host "$HOST" --port "$PORT" "$@"
