#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

version="${1:-}"
if [ -z "$version" ]; then
  echo "Usage: ./eng/package-smoke.sh <version>" >&2
  exit 1
fi

eng_step "package-smoke: prerequisites"
echo "Package smoke testing requires BB14 NuGet Packaging to be active."
echo "Current status: BB14 is planned; package smoke validation is not yet implemented for version $version." >&2
exit 1
