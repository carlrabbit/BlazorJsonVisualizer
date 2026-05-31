# Release Check Workflow

## Purpose

Define the future release-readiness validation workflow without making it part of normal implementation.

## Current Status

Release readiness is future work. The workflow is explicit-only and does not imply that public package publication is active.

## Command

```sh
./eng/release-check.sh <version>
```

## Rules

- Release check is explicit-only and must not run by default in normal development gates.
- Release check must not publish packages.
- Package smoke and public API validation are required only when package/public API maturity changes and those prerequisites are active.
- If a prerequisite module is not active, the command must fail with a clear prerequisite message.

## GitHub Workflow File

- `.github/workflows/release-check.yml`

## Visual Identity Sample

Once release readiness becomes active, release-check should include the Visual Identity sample through the canonical sample validation command.

The workflow must not require screenshot regression tests for this milestone.

When visual identity validation changes, review:

- docs/specs/visual-identity-playground.md
- docs/engineering/samples.md
- docs/engineering/release-readiness.md
- public-docs/samples/visual-identity-playground.md

## Authority

This document is authoritative for future release readiness workflow expectations.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/engineering/release-readiness.md`
- `docs/engineering/command-contract.md`
- `eng/release-check.sh`
- `.github/workflows/release-check.yml`
