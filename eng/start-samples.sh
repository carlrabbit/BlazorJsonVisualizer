#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

INDEX_PORT=5100
BASIC_SAMPLE_PORT=5110
LAYER1_PORT=5120
LAYER2_PORT=5130
LAYER3_PORT=5140
VISUAL_IDENTITY_PORT=5150
# Use 0.0.0.0 by default so forwarded ports work in dev containers/workspaces.
# Override with SAMPLES_BIND_HOST=127.0.0.1 for loopback-only local runs.
BIND_HOST="${SAMPLES_BIND_HOST:-0.0.0.0}"
STATE_DIR="${TMPDIR:-/tmp}/blazor-json-visualizer-samples"
INDEX_PID_FILE="$STATE_DIR/index.pid"
BASIC_PID_FILE="$STATE_DIR/basic.pid"
LAYER1_PID_FILE="$STATE_DIR/layer1.pid"
LAYER2_PID_FILE="$STATE_DIR/layer2.pid"
LAYER3_PID_FILE="$STATE_DIR/layer3.pid"
VISUAL_IDENTITY_PID_FILE="$STATE_DIR/visual-identity.pid"
DEFAULT_LOG_FILE="$STATE_DIR/samples.log"
DETACH_MODE=0
DRY_RUN=0
LOG_FILE=""

INDEX_DIR="$REPO_ROOT/samples/index"
INDEX_SERVER_APP="$REPO_ROOT/eng/SamplesIndexServer.cs"
BASIC_SAMPLE_PROJECT="$REPO_ROOT/src/BlazorJsonVisualizer.SampleApp/BlazorJsonVisualizer.SampleApp.csproj"
BASIC_SAMPLE_DLL="$REPO_ROOT/src/BlazorJsonVisualizer.SampleApp/bin/Debug/net10.0/BlazorJsonVisualizer.SampleApp.dll"
LAYER1_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.Layer1Sample/BlazorJsonVisualizer.Layer1Sample.csproj"
LAYER1_DLL="$REPO_ROOT/samples/BlazorJsonVisualizer.Layer1Sample/bin/Debug/net10.0/BlazorJsonVisualizer.Layer1Sample.dll"
LAYER2_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.SchemaOverlaySample/BlazorJsonVisualizer.SchemaOverlaySample.csproj"
LAYER2_DLL="$REPO_ROOT/samples/BlazorJsonVisualizer.SchemaOverlaySample/bin/Debug/net10.0/BlazorJsonVisualizer.SchemaOverlaySample.dll"
LAYER3_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.ProjectionSample/BlazorJsonVisualizer.ProjectionSample.csproj"
LAYER3_DLL="$REPO_ROOT/samples/BlazorJsonVisualizer.ProjectionSample/bin/Debug/net10.0/BlazorJsonVisualizer.ProjectionSample.dll"
VISUAL_IDENTITY_PROJECT="$REPO_ROOT/samples/BlazorJsonVisualizer.VisualIdentitySample/BlazorJsonVisualizer.VisualIdentitySample.csproj"
VISUAL_IDENTITY_DLL="$REPO_ROOT/samples/BlazorJsonVisualizer.VisualIdentitySample/bin/Debug/net10.0/BlazorJsonVisualizer.VisualIdentitySample.dll"
BASIC_SAMPLE_CONTENT_ROOT="$REPO_ROOT/src/BlazorJsonVisualizer.SampleApp"
LAYER1_CONTENT_ROOT="$REPO_ROOT/samples/BlazorJsonVisualizer.Layer1Sample"
LAYER2_CONTENT_ROOT="$REPO_ROOT/samples/BlazorJsonVisualizer.SchemaOverlaySample"
LAYER3_CONTENT_ROOT="$REPO_ROOT/samples/BlazorJsonVisualizer.ProjectionSample"
VISUAL_IDENTITY_CONTENT_ROOT="$REPO_ROOT/samples/BlazorJsonVisualizer.VisualIdentitySample"
RUNTIME_WORKSPACE_DIR="$REPO_ROOT/src/BlazorJsonVisualizer.Runtime"
RUNTIME_BLAZOR_DIST_FILE="$RUNTIME_WORKSPACE_DIR/runtime-blazor/dist/index.js"
RUNTIME_BLAZOR_WWWROOT_FILE="$REPO_ROOT/src/BlazorJsonVisualizer/wwwroot/runtime-blazor.js"

pids=()

usage() {
  cat <<'EOF'
Usage: eng/start-samples.sh [--detach] [--dry-run] [--log-file PATH]

  --detach         Start the sample processes in the background and exit.
  --dry-run        Print the build/start plan without running it. Run this after changing the launcher.
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
      --dry-run)
        DRY_RUN=1
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
  if command -v ss >/dev/null 2>&1; then
    if ss -Htanl "sport eq :$port" | grep -q 'LISTEN'; then
      echo "Port $port is already in use by another listening process." >&2
      exit 1
    fi
    return
  fi

  if command -v python3 >/dev/null 2>&1; then
    if python3 - "$port" <<'PY'
import socket
import sys

port = int(sys.argv[1])
with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
    sock.settimeout(0.2)
    sys.exit(0 if sock.connect_ex(("127.0.0.1", port)) == 0 else 1)
PY
    then
      echo "Port $port is already in use by another listening process." >&2
      exit 1
    fi
    return
  fi

  echo "Unable to check whether port $port is free because neither ss nor python3 is available." >&2
  exit 1
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
  clear_stale_pid_file "$VISUAL_IDENTITY_PID_FILE"
}

ensure_detached_not_running() {
  local index_pid basic_pid layer1_pid layer2_pid layer3_pid visual_identity_pid
  index_pid="$(read_pid_file "$INDEX_PID_FILE")"
  basic_pid="$(read_pid_file "$BASIC_PID_FILE")"
  layer1_pid="$(read_pid_file "$LAYER1_PID_FILE")"
  layer2_pid="$(read_pid_file "$LAYER2_PID_FILE")"
  layer3_pid="$(read_pid_file "$LAYER3_PID_FILE")"
  visual_identity_pid="$(read_pid_file "$VISUAL_IDENTITY_PID_FILE")"

  if is_pid_running "$index_pid" && is_pid_running "$basic_pid" && is_pid_running "$layer1_pid" && is_pid_running "$layer2_pid" && is_pid_running "$layer3_pid" && is_pid_running "$visual_identity_pid"; then
    echo "Samples are already running in detached mode. Nothing to do."
    echo "Samples index URL: http://localhost:$INDEX_PORT"
    return 1
  fi

  if is_pid_running "$index_pid" || is_pid_running "$basic_pid" || is_pid_running "$layer1_pid" || is_pid_running "$layer2_pid" || is_pid_running "$layer3_pid" || is_pid_running "$visual_identity_pid"; then
    echo "Some detached sample processes are still running (check $STATE_DIR/*.pid), but the full sample set is incomplete." >&2
    echo "Manually stop the remaining sample processes using the PIDs from $STATE_DIR/*.pid files (for example: kill \$(cat $STATE_DIR/index.pid)) and remove the PID files (rm -f $STATE_DIR/*.pid) before starting samples again." >&2
    exit 1
  fi
}

print_dry_run_command() {
  printf '[dry-run]'
  printf ' %q' "$@"
  printf '\n'
}

run_build_command() {
  if (( DRY_RUN )); then
    print_dry_run_command "$@"
    return
  fi

  "$@"
}

start_process() {
  local pid_file="$1"
  shift
  local command=("$@")

  if (( DRY_RUN )); then
    print_dry_run_command "${command[@]}"
    return
  fi

  if (( DETACH_MODE )); then
    nohup "${command[@]}" >>"$LOG_FILE" 2>&1 &
    echo "$!" > "$pid_file"
  else
    "${command[@]}" &
    pids+=("$!")
  fi
}

start_index() {
  start_process \
    "$INDEX_PID_FILE" \
    dotnet run "$INDEX_SERVER_APP" -- "$INDEX_DIR" "http://$BIND_HOST:$INDEX_PORT"
}

start_basic_sample() {
  start_process \
    "$BASIC_PID_FILE" \
    dotnet "$BASIC_SAMPLE_DLL" --contentRoot "$BASIC_SAMPLE_CONTENT_ROOT" --urls "http://$BIND_HOST:$BASIC_SAMPLE_PORT"
}

start_layer1_sample() {
  start_process \
    "$LAYER1_PID_FILE" \
    dotnet "$LAYER1_DLL" --contentRoot "$LAYER1_CONTENT_ROOT" --urls "http://$BIND_HOST:$LAYER1_PORT"
}

start_layer2_sample() {
  start_process \
    "$LAYER2_PID_FILE" \
    dotnet "$LAYER2_DLL" --contentRoot "$LAYER2_CONTENT_ROOT" --urls "http://$BIND_HOST:$LAYER2_PORT"
}

start_layer3_sample() {
  start_process \
    "$LAYER3_PID_FILE" \
    dotnet "$LAYER3_DLL" --contentRoot "$LAYER3_CONTENT_ROOT" --urls "http://$BIND_HOST:$LAYER3_PORT"
}

start_visual_identity_sample() {
  start_process \
    "$VISUAL_IDENTITY_PID_FILE" \
    dotnet "$VISUAL_IDENTITY_DLL" --contentRoot "$VISUAL_IDENTITY_CONTENT_ROOT" --urls "http://$BIND_HOST:$VISUAL_IDENTITY_PORT"
}

parse_args "$@"

if (( ! DRY_RUN )); then
  require_command dotnet
  require_command bun
fi

if [[ ! -d "$INDEX_DIR" ]]; then
  echo "Missing static sample index directory: $INDEX_DIR" >&2
  exit 1
fi

if [[ ! -f "$INDEX_SERVER_APP" ]]; then
  echo "Missing samples index server app: $INDEX_SERVER_APP" >&2
  exit 1
fi

if (( DETACH_MODE )); then
  if [[ -z "$LOG_FILE" ]]; then
    LOG_FILE="$DEFAULT_LOG_FILE"
  fi

  if (( ! DRY_RUN )); then
    prepare_detached_state
    if ! ensure_detached_not_running; then
      exit 0
    fi
  fi
fi

if (( ! DRY_RUN )); then
  check_port_free "$INDEX_PORT"
  check_port_free "$BASIC_SAMPLE_PORT"
  check_port_free "$LAYER1_PORT"
  check_port_free "$LAYER2_PORT"
  check_port_free "$LAYER3_PORT"
  check_port_free "$VISUAL_IDENTITY_PORT"
fi

echo "== Sample ports =="
echo "  5100  Static samples index"
echo "  5110  Basic Blazor host/sample"
echo "  5120  Layer 1 JSON viewer sample"
echo "  5130  Layer 2 schema overlay sample"
echo "  5140  Layer 3 projection sample"
echo "  5150  Visual Identity Playground"
echo

if (( DRY_RUN )); then
  echo "Dry run: commands below are printed only. No builds will run and no sample processes will start."
  echo
fi

echo "Building implemented sample projects..."
run_build_command bun install --cwd "$RUNTIME_WORKSPACE_DIR" --frozen-lockfile
run_build_command bun run --cwd "$RUNTIME_WORKSPACE_DIR" build
run_build_command cp "$RUNTIME_BLAZOR_DIST_FILE" "$RUNTIME_BLAZOR_WWWROOT_FILE"
run_build_command dotnet restore "$BASIC_SAMPLE_PROJECT"
run_build_command dotnet build "$BASIC_SAMPLE_PROJECT" --no-restore
run_build_command dotnet restore "$LAYER1_PROJECT"
run_build_command dotnet build "$LAYER1_PROJECT" --no-restore
run_build_command dotnet restore "$LAYER2_PROJECT"
run_build_command dotnet build "$LAYER2_PROJECT" --no-restore
run_build_command dotnet restore "$LAYER3_PROJECT"
run_build_command dotnet build "$LAYER3_PROJECT" --no-restore
run_build_command dotnet restore "$VISUAL_IDENTITY_PROJECT"
run_build_command dotnet build "$VISUAL_IDENTITY_PROJECT" --no-restore

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

echo "Starting Visual Identity Playground on http://$BIND_HOST:$VISUAL_IDENTITY_PORT"
start_visual_identity_sample

echo
echo "Samples index URL: http://localhost:$INDEX_PORT"

if (( DRY_RUN )); then
  if (( DETACH_MODE )); then
    echo "Dry run log file: $LOG_FILE"
  fi
  echo "Dry run complete. Run this after changing eng/start-samples.sh."
  exit 0
fi

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
