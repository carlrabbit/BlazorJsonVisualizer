#!/usr/bin/env sh
set -eu
. "$(dirname "$0")/common.sh"

if [ ! -d "$REPO_ROOT/samples" ]; then
  echo "No samples directory found; skipping"
  exit 0
fi

eng_step "samples: build sample projects"
for proj in "$REPO_ROOT"/samples/*/*.csproj; do
  [ -f "$proj" ] || continue
  echo "  building $proj"
  dotnet build "$proj" --no-restore
done

eng_step "samples: validate dry run"
if [ -f "$REPO_ROOT/eng/start-samples.sh" ]; then
  bash "$REPO_ROOT/eng/start-samples.sh" --dry-run
fi
