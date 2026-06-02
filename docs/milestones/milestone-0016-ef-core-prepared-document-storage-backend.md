# Milestone 0016 — EF Core prepared document storage backend

## Status

Implemented / synchronized.

## Task Mode

Completed focus-area implementation milestone.

This document is retained as milestone history and routing context. Current behavioral authority is held by the specs listed below.

## Repository Maturity

BlazorJsonVisualizer remains in Exploration / Active Design mode. The implementation is behavior-rich and documented through specs and preview public documentation. This milestone did not change release readiness or package-publication maturity.

## Goal

Implemented an EF Core prepared-document storage backend with user-owned DbContext integration, provider-neutral model configuration, and opt-in SQL Server storage optimizations.

## Completion Note

EF Core backend source projects now use the concrete repository project names `BlazorJsonVisualizer.Storage.EFCore` and `BlazorJsonVisualizer.Storage.EFCore.SqlServer`. Public docs must not use placeholder package names for these source projects.

## Current Authority Documents

Implementation and follow-up documentation agents should use these documents as current authority:

- `AGENTS.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/SPECS.md`
- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `docs/decisions/0006-user-owned-ef-core-dbcontext-for-prepared-document-storage.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
- `public-docs/diagnostics/ef-core-storage-diagnostics.md`

Do not use `docs/research/` as operational authority for this milestone.

## Direct Documentation Impact

Resolved in this synchronization pass.

The relevant index and public documentation surfaces have been updated where needed so they no longer describe this milestone as only planned.

## Deferred Documentation Synchronization

No milestone-specific documentation synchronization remains deferred.

Future release-readiness, package smoke, public API baseline, and versioned release notes remain outside this milestone and must only be performed by an explicit release/public-package task.

## Validation Guidance

Documentation-only synchronization should use documentation-safe validation when practical:

```sh
./eng/public-docs.sh
./eng/format.sh --verify
```

A broader Tier 2 check remains available before merging when practical:

```sh
./eng/check.sh
```

Release/public-package validation remains explicit-only:

```sh
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```
