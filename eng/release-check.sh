#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

version="${1:-}"
if [ -z "$version" ]; then
  echo "Usage: ./eng/release-check.sh <version>" >&2
  exit 1
fi

eng_step "release-check: version $version"

eng_step "release-check: fast gate"
"$REPO_ROOT/eng/check.sh"

eng_step "release-check: public docs"
"$REPO_ROOT/eng/public-docs.sh"

eng_step "release-check: samples"
if [ -d "$REPO_ROOT/samples" ]; then
  "$REPO_ROOT/eng/samples.sh"
fi

eng_step "release-check: public api"
"$REPO_ROOT/eng/public-api.sh"

eng_step "release-check: package smoke prerequisite"
if ! grep -q "| BB14 | NuGet Packaging | Active |" "$REPO_ROOT/docs/engineering/building-blocks.md"; then
  echo "Cannot run package smoke checks: BB14 NuGet Packaging is not active." >&2
  echo "Activate BB14 before using ./eng/release-check.sh for publish readiness." >&2
  exit 1
fi

"$REPO_ROOT/eng/package-smoke.sh" "$version"
