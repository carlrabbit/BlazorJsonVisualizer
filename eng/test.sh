#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "test: dotnet test (short-running only)"
dotnet test --no-build --configuration Debug --filter "TestCategory!=Slow&TestCategory!=E2E&TestCategory!=PackageSmoke"
