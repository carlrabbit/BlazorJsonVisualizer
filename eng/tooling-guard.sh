#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "tooling-guard: scan active tooling surfaces"

violations=""

append_violation() {
  if [ -z "$violations" ]; then
    violations="$1"
  else
    violations="$violations
$1"
  fi
}

while IFS= read -r file; do
  [ -n "$file" ] || continue
  append_violation "$file: forbidden package-lock.json file"
done <<EOF_FILES
$(find "$REPO_ROOT" \
  -path "$REPO_ROOT/.git" -prune -o \
  -path "$REPO_ROOT/docs/research" -prune -o \
  -path "$REPO_ROOT/docs/milestones" -prune -o \
  -path '*/bin' -prune -o \
  -path '*/obj' -prune -o \
  -path '*/node_modules' -prune -o \
  -name package-lock.json -type f -print)
EOF_FILES

scan_files=$(find "$REPO_ROOT/eng" "$REPO_ROOT/src/BlazorJsonVisualizer.Runtime" "$REPO_ROOT/tests/BlazorJsonVisualizer.Runtime.Tests" \
  -path '*/dist' -prune -o \
  -path '*/node_modules' -prune -o \
  ! -name tooling-guard.sh -type f \( -name '*.sh' -o -name '*.json' -o -name '*.ts' -o -name '*.js' -o -name '*.md' \) -print)

if [ -n "$scan_files" ]; then
  matches=$(printf '%s\n' "$scan_files" | xargs rg -n --no-heading 'npm run|npm install|npm --workspace|\bnpx\b|node dist/' || true)
  if [ -n "$matches" ]; then
    append_violation "$matches"
  fi
fi

if [ -n "$violations" ]; then
  echo "Forbidden npm/npx/package-lock tooling usage found:" >&2
  printf '%s\n' "$violations" >&2
  exit 1
fi

eng_step "tooling-guard: complete"
