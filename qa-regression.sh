#!/usr/bin/env bash
set -euo pipefail

run_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    pnpm "$@"
  else
    npx pnpm@11.1.2 "$@"
  fi
}

(
  cd apps/api
  ./gradlew test
)

run_pnpm --filter @restaurant/business-web lint
run_pnpm --filter @restaurant/business-web test
run_pnpm --filter @restaurant/business-web build
run_pnpm --filter @restaurant/business-web test:e2e

run_pnpm --filter @restaurant/customer-web lint
run_pnpm --filter @restaurant/customer-web test
run_pnpm --filter @restaurant/customer-web build
run_pnpm --filter @restaurant/customer-web test:e2e
