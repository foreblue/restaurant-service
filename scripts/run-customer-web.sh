#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NEXT_ENV_FILE="$REPO_ROOT/apps/customer-web/next-env.d.ts"

HOST="${CUSTOMER_WEB_HOST:-0.0.0.0}"
PORT="${CUSTOMER_WEB_PORT:-3000}"

export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-http://localhost:8080}"
export NEXT_PUBLIC_APP_BASE_URL="${NEXT_PUBLIC_APP_BASE_URL:-http://localhost:$PORT}"

restore_next_env() {
  if [[ -f "$NEXT_ENV_FILE" ]]; then
    perl -0pi -e 's#"\./\.next/dev/types/routes\.d\.ts"#"./.next/types/routes.d.ts"#g' "$NEXT_ENV_FILE"
  fi
}

trap restore_next_env EXIT

cd "$REPO_ROOT"

npm exec pnpm@11.1.2 -- \
  --filter @restaurant/customer-web \
  exec next dev -H "$HOST" -p "$PORT" "$@"
