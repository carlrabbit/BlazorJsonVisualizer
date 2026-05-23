#!/usr/bin/env sh
# Common helpers for eng/ scripts.
set -eu

# Resolve repository root relative to this script.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Print a header for each major step.
eng_step() {
  echo ""
  echo "==> $*"
}

# Check whether a command is available.
eng_has() {
  command -v "$1" >/dev/null 2>&1
}
