#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "check: restore"
"$REPO_ROOT/eng/restore.sh"

eng_step "check: build"
"$REPO_ROOT/eng/build.sh"

eng_step "check: test"
"$REPO_ROOT/eng/test.sh"

eng_step "check: dotnet format --verify-no-changes"
dotnet format --verify-no-changes

if [ -f "$REPO_ROOT/biome.json" ]; then
  eng_step "check: biome check"
  if eng_has bun; then
    bun run check
  else
    echo "bun not found; skipping biome check"
  fi
fi

eng_step "check: complete"
