#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

RUNTIME_WORKSPACE_DIR="$REPO_ROOT/src/BlazorJsonVisualizer.Runtime"

if [ ! -f "$RUNTIME_WORKSPACE_DIR/package.json" ]; then
  echo "Runtime workspace package.json not found: $RUNTIME_WORKSPACE_DIR/package.json; skipping frontend format"
  exit 0
fi

if ! eng_has bun; then
  echo "Required command not found: bun" >&2
  echo "Install Bun to run browser runtime formatting from $RUNTIME_WORKSPACE_DIR." >&2
  exit 1
fi

eng_step "frontend-format: bun run format"
cd "$RUNTIME_WORKSPACE_DIR"
bun run format
