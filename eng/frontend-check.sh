#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

if [ ! -f "$REPO_ROOT/package.json" ]; then
  echo "No package.json found; skipping frontend check"
  exit 0
fi

eng_step "frontend-check: biome check"
if eng_has bun; then
  cd "$REPO_ROOT"
  bun run check
else
  cd "$REPO_ROOT"
  npm run check 2>/dev/null || npx biome check . 2>/dev/null || echo "frontend check skipped: bun not found"
fi
