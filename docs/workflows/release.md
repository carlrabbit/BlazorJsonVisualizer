# Release Workflow

## Purpose

Describe repository-local expectations for eventual versioned releases.

## Current Status

Release publication is future work. Public package publication is preview/planned, and release-readiness validation is explicit-only.

## Command model

- Normal implementation completion gate: `./eng/check.sh` (Tier 2)
- Future explicit release readiness gate: `./eng/release-check.sh <version>`

## Initial direction

- Releases must align with repository specs and documented runtime boundaries.
- Packaging concerns belong to the Blazor host rather than the runtime core.
- Release automation can evolve in later milestones without redefining architecture authority.
- Publishing must happen only after explicit release-readiness validation passes once release readiness is active.

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
