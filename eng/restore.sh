#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "restore: dotnet restore"
dotnet restore

if [ -f "$REPO_ROOT/package.json" ]; then
  eng_step "restore: bun install"
  if eng_has bun; then
    bun install --frozen-lockfile
  else
    echo "bun not found; skipping frontend restore"
  fi
fi
