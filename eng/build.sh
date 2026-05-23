#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "build: dotnet build"
dotnet build --no-restore
