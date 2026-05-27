# Release Check Workflow

## Purpose

Define release-readiness validation that runs before publishing.

## Command

```sh
./eng/release-check.sh <version>
```

## Rules

- Release check is explicit-only and must not run by default in normal development gates.
- Release readiness validates package smoke tests, public API, samples, public docs, and release notes before publishing.
- Release check must not publish packages.
- If a prerequisite module is not active, the command must fail with a clear prerequisite message.

## GitHub Workflow File

- `.github/workflows/release-check.yml`

## Visual Identity Sample

The release-check workflow must include the Visual Identity sample through the canonical sample validation command.

The workflow must not require screenshot regression tests for this milestone.

When visual identity validation changes, review:

- docs/specs/visual-identity-playground.md
- docs/engineering/samples.md
- docs/engineering/release-readiness.md
- public-docs/samples/visual-identity-playground.md

## Authority

This document is authoritative for release readiness workflow expectations.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/engineering/release-readiness.md`
- `docs/engineering/command-contract.md`
- `eng/release-check.sh`
- `.github/workflows/release-check.yml`
