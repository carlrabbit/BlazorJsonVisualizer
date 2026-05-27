# Release Workflow

## Purpose

Describe repository-local expectations for preparing and publishing a versioned release.

## Command model

- Fast development gate: `./eng/check.sh`
- Explicit release readiness gate: `./eng/release-check.sh <version>`

## Initial direction

- Releases must align with repository specs and documented runtime boundaries.
- Packaging concerns belong to the Blazor host rather than the runtime core.
- Release automation can evolve in later milestones without redefining architecture authority.
- Publishing must happen only after explicit release-readiness validation passes.

## GitHub Workflow File

- `.github/workflows/release.yml`

## Authority

This document is authoritative for the release workflow model.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/workflows/release-check.md`
- `docs/engineering/release-readiness.md`
- `.github/workflows/release.yml`
