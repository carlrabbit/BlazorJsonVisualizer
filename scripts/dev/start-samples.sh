#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

INDEX_PORT=5100
BASIC_SAMPLE_PORT=5110
LAYER1_PORT=5120
LAYER2_PORT=5130
LAYER3_PORT=5140
# Use 0.0.0.0 by default so forwarded ports work in dev containers/workspaces.
# Override with SAMPLES_BIND_HOST=127.0.0.1 for loopback-only local runs.
BIND_HOST="${SAMPLES_BIND_HOST:-0.0.0.0}"
STATE_DIR="${TMPDIR:-/tmp}/blazor-json-visualizer-samples"
INDEX_PID_FILE="$STATE_DIR/index.pid"
BASIC_PID_FILE="$STATE_DIR/basic.pid"
LAYER1_PID_FILE="$STATE_DIR/layer1.pid"
LAYER2_PID_FILE="$STATE_DIR/layer2.pid"
LAYER3_PID_FILE="$STATE_DIR/layer3.pid"
DEFAULT_LOG_FILE="$STATE_DIR/samples.log"
DETACH_MODE=0
LOG_FILE=""

INDEX_DIR="$REPO_ROOT/samples/index"
BASIC_SAMPLE_PROJECT="$REPO_ROOT/src/BlazorJsonVisualizer.SampleApp/BlazorJsonVisualizer.SampleApp.csproj"
LAYER1_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.Layer1Sample/BlazorJsonVisualizer.Layer1Sample.csproj"
LAYER2_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.SchemaOverlaySample/BlazorJsonVisualizer.SchemaOverlaySample.csproj"
LAYER3_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.ProjectionSample/BlazorJsonVisualizer.ProjectionSample.csproj"

pids=()

usage() {
  cat <<'EOF'
Usage: scripts/dev/start-samples.sh [--detach] [--log-file PATH]

  --detach         Start the sample processes in the background and exit.
  --log-file PATH  Append detached process output to PATH.
EOF
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --detach)
        DETACH_MODE=1
        shift
        ;;
      --log-file)
        if [[ $# -lt 2 ]]; then
          echo "Missing value for --log-file" >&2
          usage >&2
          exit 1
        fi
        LOG_FILE="$2"
        shift 2
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Unknown argument: $1" >&2
        usage >&2
        exit 1
        ;;
    esac
  done
}

require_command() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Required command not found: $name" >&2
    exit 1
  fi
}

check_port_free() {
  local port="$1"
  python3 - "$port" "$BIND_HOST" <<'PY'
import socket
import sys

port = int(sys.argv[1])
host = sys.argv[2]
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    sock.bind((host, port))
except OSError:
    print(f"Port {port} is already in use on host {host}.", file=sys.stderr)
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

is_pid_running() {
  local pid="$1"
  # Detached sample processes are started by this script under the current user,
  # so any kill -0 failure is treated as "not running" for launcher purposes.
  [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1
}

read_pid_file() {
  local pid_file="$1"
  if [[ -f "$pid_file" ]]; then
    tr -d '[:space:]' < "$pid_file"
  fi
}

clear_stale_pid_file() {
  local pid_file="$1"
  local pid
  pid="$(read_pid_file "$pid_file")"

  if [[ -z "$pid" ]]; then
    rm -f "$pid_file"
    return
  fi

  if ! is_pid_running "$pid"; then
    rm -f "$pid_file"
  fi
}

prepare_detached_state() {
  mkdir -p "$STATE_DIR"
  clear_stale_pid_file "$INDEX_PID_FILE"
  clear_stale_pid_file "$BASIC_PID_FILE"
  clear_stale_pid_file "$LAYER1_PID_FILE"
  clear_stale_pid_file "$LAYER2_PID_FILE"
  clear_stale_pid_file "$LAYER3_PID_FILE"
}

ensure_detached_not_running() {
  local index_pid basic_pid layer1_pid layer2_pid layer3_pid
  index_pid="$(read_pid_file "$INDEX_PID_FILE")"
  basic_pid="$(read_pid_file "$BASIC_PID_FILE")"
  layer1_pid="$(read_pid_file "$LAYER1_PID_FILE")"
  layer2_pid="$(read_pid_file "$LAYER2_PID_FILE")"
  layer3_pid="$(read_pid_file "$LAYER3_PID_FILE")"

  if is_pid_running "$index_pid" && is_pid_running "$basic_pid" && is_pid_running "$layer1_pid" && is_pid_running "$layer2_pid" && is_pid_running "$layer3_pid"; then
    echo "Samples are already running in detached mode. Nothing to do."
    echo "Samples index URL: http://localhost:$INDEX_PORT"
    return 1
  fi

  if is_pid_running "$index_pid" || is_pid_running "$basic_pid" || is_pid_running "$layer1_pid" || is_pid_running "$layer2_pid" || is_pid_running "$layer3_pid"; then
    echo "Some detached sample processes are still running (check $STATE_DIR/*.pid), but the full sample set is incomplete." >&2
    echo "Manually stop the remaining sample processes using the PIDs from $STATE_DIR/*.pid files (for example: kill \$(cat $STATE_DIR/index.pid)) and remove the PID files (rm -f $STATE_DIR/*.pid) before starting samples again." >&2
    exit 1
  fi
}

start_index() {
  if (( DETACH_MODE )); then
    nohup python3 -m http.server "$INDEX_PORT" --bind "$BIND_HOST" --directory "$INDEX_DIR" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$INDEX_PID_FILE"
  else
    python3 -m http.server "$INDEX_PORT" --bind "$BIND_HOST" --directory "$INDEX_DIR" &
    pids+=("$!")
  fi
}

start_basic_sample() {
  if (( DETACH_MODE )); then
    nohup dotnet run --project "$BASIC_SAMPLE_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$BASIC_SAMPLE_PORT" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$BASIC_PID_FILE"
  else
    dotnet run --project "$BASIC_SAMPLE_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$BASIC_SAMPLE_PORT" &
    pids+=("$!")
  fi
}

start_layer1_sample() {
  if (( DETACH_MODE )); then
    nohup dotnet run --project "$LAYER1_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER1_PORT" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$LAYER1_PID_FILE"
  else
    dotnet run --project "$LAYER1_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER1_PORT" &
    pids+=("$!")
  fi
}

start_layer2_sample() {
  if (( DETACH_MODE )); then
    nohup dotnet run --project "$LAYER2_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER2_PORT" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$LAYER2_PID_FILE"
  else
    dotnet run --project "$LAYER2_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER2_PORT" &
    pids+=("$!")
  fi
}

start_layer3_sample() {
  if (( DETACH_MODE )); then
    nohup dotnet run --project "$LAYER3_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER3_PORT" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$LAYER3_PID_FILE"
  else
    dotnet run --project "$LAYER3_PROJECT" --no-launch-profile --no-build --urls "http://$BIND_HOST:$LAYER3_PORT" &
    pids+=("$!")
  fi
}

parse_args "$@"

require_command dotnet
require_command python3

if [[ ! -d "$INDEX_DIR" ]]; then
  echo "Missing static sample index directory: $INDEX_DIR" >&2
  exit 1
fi

if (( DETACH_MODE )); then
  if [[ -z "$LOG_FILE" ]]; then
    LOG_FILE="$DEFAULT_LOG_FILE"
  fi

  prepare_detached_state
  if ! ensure_detached_not_running; then
    exit 0
  fi
fi

check_port_free "$INDEX_PORT"
check_port_free "$BASIC_SAMPLE_PORT"
check_port_free "$LAYER1_PORT"
check_port_free "$LAYER2_PORT"
check_port_free "$LAYER3_PORT"

echo "== Sample ports =="
echo "  5100  Static samples index"
echo "  5110  Basic Blazor host/sample"
echo "  5120  Layer 1 JSON viewer sample"
echo "  5130  Layer 2 schema overlay sample"
echo "  5140  Layer 3 projection sample"
echo

echo "Building implemented sample projects..."
dotnet restore "$BASIC_SAMPLE_PROJECT"
dotnet build "$BASIC_SAMPLE_PROJECT" --no-restore
dotnet restore "$LAYER1_PROJECT"
dotnet build "$LAYER1_PROJECT" --no-restore
dotnet restore "$LAYER2_PROJECT"
dotnet build "$LAYER2_PROJECT" --no-restore
dotnet restore "$LAYER3_PROJECT"
dotnet build "$LAYER3_PROJECT" --no-restore

echo "Starting static sample index on http://$BIND_HOST:$INDEX_PORT"
start_index

echo "Starting basic sample on http://$BIND_HOST:$BASIC_SAMPLE_PORT"
start_basic_sample

echo "Starting Layer 1 sample on http://$BIND_HOST:$LAYER1_PORT"
start_layer1_sample

echo "Starting Layer 2 schema overlay sample on http://$BIND_HOST:$LAYER2_PORT"
start_layer2_sample

echo "Starting Layer 3 projection sample on http://$BIND_HOST:$LAYER3_PORT"
start_layer3_sample

echo
echo "Samples index URL: http://localhost:$INDEX_PORT"

if (( DETACH_MODE )); then
  echo "Detached sample processes are running."
  echo "Log file: $LOG_FILE"
  exit 0
fi

trap cleanup EXIT INT TERM

echo "Press Ctrl+C to stop all sample processes."

remaining=${#pids[@]}
while (( remaining > 0 )); do
  if ! wait -n; then
    echo "A sample process exited unexpectedly. Stopping all samples..." >&2
    cleanup
    exit 1
  fi
  ((remaining--))
done
