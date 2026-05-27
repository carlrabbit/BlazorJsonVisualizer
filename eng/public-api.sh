#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "public-api: placeholder validation"
echo "Public API baseline strategy is not yet formalized; running minimal build validation only."
dotnet build --no-restore
