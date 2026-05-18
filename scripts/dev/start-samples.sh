#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

INDEX_PORT=5100
BASIC_SAMPLE_PORT=5110
LAYER1_PORT=5120
LAYER2_PORT=5130
LAYER3_PORT=5140

INDEX_DIR="$REPO_ROOT/samples/index"
BASIC_SAMPLE_PROJECT="$REPO_ROOT/src/BlazorJsonVisualizer.SampleApp/BlazorJsonVisualizer.SampleApp.csproj"

pids=()

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

check_port_free() {
  local port="$1"
  python3 - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    sock.bind(("0.0.0.0", port))
except OSError:
    print(f"Port {port} is already in use.", file=sys.stderr)
    sys.exit(1)
finally:
    sock.close()
PY
}

cleanup() {
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
      wait "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

require_command dotnet
require_command python3

if [[ ! -d "$INDEX_DIR" ]]; then
  echo "Missing static sample index directory: $INDEX_DIR" >&2
  exit 1
fi

check_port_free "$INDEX_PORT"
check_port_free "$BASIC_SAMPLE_PORT"
check_port_free "$LAYER1_PORT"
check_port_free "$LAYER2_PORT"
check_port_free "$LAYER3_PORT"

echo "== Sample ports =="
echo "  5100  Static samples index"
echo "  5110  Basic Blazor host/sample"
echo "  5120  Layer 1 JSON viewer sample (planned)"
echo "  5130  Layer 2 schema overlay sample (planned)"
echo "  5140  Layer 3 projection sample (planned)"
echo

echo "Building implemented sample projects..."
dotnet restore "$BASIC_SAMPLE_PROJECT"
dotnet build "$BASIC_SAMPLE_PROJECT" --no-restore

echo "Starting static sample index on http://0.0.0.0:$INDEX_PORT"
python3 -m http.server "$INDEX_PORT" --bind 0.0.0.0 --directory "$INDEX_DIR" &
pids+=("$!")

echo "Starting basic sample on http://0.0.0.0:$BASIC_SAMPLE_PORT"
dotnet run --project "$BASIC_SAMPLE_PROJECT" --no-launch-profile --no-build --urls "http://0.0.0.0:$BASIC_SAMPLE_PORT" &
pids+=("$!")

echo
echo "Samples index URL: http://localhost:$INDEX_PORT"
echo "Press Ctrl+C to stop all sample processes."

wait
