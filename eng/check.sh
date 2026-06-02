#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

eng_step "check: restore"
"$REPO_ROOT/eng/restore.sh"

eng_step "check: build"
"$REPO_ROOT/eng/build.sh"

eng_step "check: test"
"$REPO_ROOT/eng/test.sh"

eng_step "check: dotnet format --verify-no-changes"
dotnet format --verify-no-changes

eng_step "check: frontend"
"$REPO_ROOT/eng/frontend-check.sh"

eng_step "check: tooling guard"
"$REPO_ROOT/eng/tooling-guard.sh"

eng_step "check: complete"
