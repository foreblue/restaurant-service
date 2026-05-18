#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="${DEV_SESSION:-restaurant-service-dev}"

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux가 필요합니다. 모듈별 스크립트를 개별 터미널에서 실행하세요." >&2
  exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "이미 실행 중입니다: tmux attach -t $SESSION"
  exit 0
fi

tmux new-session -d -s "$SESSION" -n api "$SCRIPT_DIR/run-api.sh"
tmux new-window -t "$SESSION:" -n business-web "$SCRIPT_DIR/run-business-web.sh"
tmux new-window -t "$SESSION:" -n customer-web "$SCRIPT_DIR/run-customer-web.sh"

tmux list-windows -t "$SESSION"

cat <<EOF

개발 서버를 시작했습니다.

  BE API:      http://localhost:8080/actuator/health
  사업자 FE:   http://localhost:5173/
  사용자 FE:   http://localhost:3000/

로그 확인:
  tmux attach -t $SESSION

종료:
  $SCRIPT_DIR/stop-dev.sh
EOF
