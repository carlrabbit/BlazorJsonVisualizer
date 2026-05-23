#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "format: dotnet format"
dotnet format

if [ -f "$REPO_ROOT/biome.json" ]; then
  eng_step "format: biome format"
  if eng_has bun; then
    bun run format
  else
    echo "bun not found; skipping biome format"
  fi
fi
