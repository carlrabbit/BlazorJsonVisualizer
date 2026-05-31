#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

FAST=0
if [ "${1:-}" = "--fast" ]; then
  FAST=1
  shift
fi

if [ "$#" -ne 0 ]; then
  echo "Usage: ./eng/long-running-tests.sh [--fast]" >&2
  exit 2
fi

if [ "$FAST" -eq 1 ]; then
  eng_step "long-running-tests: dotnet test slow category with fast data"
  BJV_LONG_RUNNING_FAST=1 dotnet test --configuration Debug --filter "TestCategory=Slow"
else
  eng_step "long-running-tests: dotnet test slow category"
  dotnet test --configuration Debug --filter "TestCategory=Slow"
fi
