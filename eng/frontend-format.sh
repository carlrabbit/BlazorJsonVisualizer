#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

if [ ! -f "$REPO_ROOT/package.json" ]; then
  echo "No package.json found; skipping frontend format"
  exit 0
fi

eng_step "frontend-format: biome format"
if eng_has bun; then
  cd "$REPO_ROOT"
  bun run format
else
  cd "$REPO_ROOT"
  npm run format 2>/dev/null || npx biome format --write . 2>/dev/null || echo "frontend format skipped: bun not found"
fi
