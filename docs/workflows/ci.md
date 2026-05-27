# CI Workflow

## Purpose

Describe the default automated validation expected for normal repository changes.

## Initial direction

- CI should run fast deterministic validation by default.
- Long-running tests must stay opt-in.
- Documentation-only milestones may validate structure and links without package builds.

## GitHub Workflow File

- `.github/workflows/ci.yml`
