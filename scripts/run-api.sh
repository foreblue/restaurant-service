#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]]; then
    printf '%s\n' "$JAVA_HOME"
    return
  fi

  local homebrew_arm="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
  local homebrew_intel="/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"

  if [[ -x "$homebrew_arm/bin/java" ]]; then
    printf '%s\n' "$homebrew_arm"
    return
  fi

  if [[ -x "$homebrew_intel/bin/java" ]]; then
    printf '%s\n' "$homebrew_intel"
    return
  fi

  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    local discovered
    discovered="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
    if [[ -n "$discovered" && -x "$discovered/bin/java" ]]; then
      printf '%s\n' "$discovered"
      return
    fi
  fi

  cat >&2 <<'EOF'
JDK 21을 찾을 수 없습니다.
Homebrew를 사용한다면 다음 명령으로 설치하세요.

  brew install openjdk@21
EOF
  exit 1
}

export JAVA_HOME="$(resolve_java_home)"
export PATH="$JAVA_HOME/bin:$PATH"

cd "$API_DIR"

if [[ "${API_START_DB:-1}" != "0" ]]; then
  docker compose up -d mysql
fi

exec ./gradlew bootRun "$@"
