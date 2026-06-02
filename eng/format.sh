#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "format: dotnet format"
dotnet format

eng_step "format: frontend"
"$REPO_ROOT/eng/frontend-format.sh"
