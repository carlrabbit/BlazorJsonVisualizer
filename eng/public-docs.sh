#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "public-docs: validate required files"

required_files="
$REPO_ROOT/public-docs/getting-started.md
$REPO_ROOT/public-docs/installation.md
$REPO_ROOT/public-docs/concepts.md
$REPO_ROOT/public-docs/packages.md
$REPO_ROOT/public-docs/samples.md
$REPO_ROOT/public-docs/diagnostics.md
$REPO_ROOT/public-docs/versioning.md
$REPO_ROOT/public-docs/release-notes.md
"

for file in $required_files; do
  if [ ! -f "$file" ]; then
    echo "Missing required public docs file: $file" >&2
    exit 1
  fi
done

if find "$REPO_ROOT/public-docs" -type f -name 'README.md' | grep . >/dev/null 2>&1; then
  echo "Disallowed README.md found under public-docs/. Use named documents instead." >&2
  find "$REPO_ROOT/public-docs" -type f -name 'README.md' >&2
  exit 1
fi

eng_step "public-docs: complete"
