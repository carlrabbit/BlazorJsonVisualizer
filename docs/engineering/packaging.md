# Packaging

## Purpose

Define packaging expectations for BlazorJsonVisualizer and the relationship between packaging metadata and public documentation.

## Current Status

NuGet packaging (BB14) is planned and not yet active.

## Packaging Rules

- Packaging activation must introduce a canonical package command and packaging outputs under documented locations.
- Package README content must be sourced from `public-docs/nuget/package-readme.md`.
- Package behavior and metadata documentation must stay synchronized with `public-docs/packages.md` and `README.md` user-facing sections.
- Package smoke tests are release-only checks and must use `./eng/package-smoke.sh <version>` once BB14 is active.

## Validation

- `./eng/package-smoke.sh <version>` is explicit-only and requires BB14 activation.

## Authority

This document is authoritative for:
- packaging documentation synchronization requirements
- package smoke-test positioning in release readiness

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `docs/engineering/command-contract.md`
- `public-docs/packages.md`
- `public-docs/nuget/package-readme.md`
