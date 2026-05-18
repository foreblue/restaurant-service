#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SESSION="${DEV_SESSION:-restaurant-service-dev}"

if command -v tmux >/dev/null 2>&1 && tmux has-session -t "$SESSION" 2>/dev/null; then
  tmux kill-session -t "$SESSION"
  echo "tmux 세션 종료: $SESSION"
else
  echo "실행 중인 tmux 세션 없음: $SESSION"
fi

for port in 8080 5173 3000; do
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue

    command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"
    process_cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"

    if [[ "$command_line" == *"$REPO_ROOT"* || "$command_line" == *"restaurant-service"* || "$process_cwd" == "$REPO_ROOT"* ]]; then
      kill "$pid" 2>/dev/null || true
      echo "포트 $port 프로세스 종료: $pid"
    else
      echo "포트 ${port}는 다른 프로세스가 사용 중이라 건너뜀: $pid" >&2
    fi
  done < <(lsof -t -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
done
