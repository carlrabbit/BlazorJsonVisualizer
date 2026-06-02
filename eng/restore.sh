#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

RUNTIME_WORKSPACE_DIR="$REPO_ROOT/src/BlazorJsonVisualizer.Runtime"

eng_step "restore: dotnet restore"
dotnet restore

if [ -f "$RUNTIME_WORKSPACE_DIR/package.json" ]; then
  if ! eng_has bun; then
    echo "Required command not found: bun" >&2
    echo "Install Bun to restore browser runtime dependencies from $RUNTIME_WORKSPACE_DIR." >&2
    exit 1
  fi

  eng_step "restore: bun install"
  bun install --cwd "$RUNTIME_WORKSPACE_DIR" --frozen-lockfile
fi
