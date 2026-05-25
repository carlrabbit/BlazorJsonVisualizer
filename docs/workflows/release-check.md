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

## Authority

This document is authoritative for release readiness workflow expectations.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/engineering/release-readiness.md`
- `docs/engineering/command-contract.md`
- `eng/release-check.sh`
