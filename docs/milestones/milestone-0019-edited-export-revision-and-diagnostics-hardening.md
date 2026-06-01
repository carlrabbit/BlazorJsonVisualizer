# Milestone 0019 — Edited export, revision consistency, and diagnostics hardening

## Status

Planned.

## Task Mode

Focus-area implementation milestone.

A later implementation agent must treat this milestone as the primary implementation route for making edited prepared documents exportable and for hardening Layer 1 degraded-state diagnostics.

## Repository Maturity

BlazorJsonVisualizer remains in Exploration / Active Design mode. This milestone introduces correctness-oriented behavior after controlled editing. It is not release work and must not require release validation.

## Goal

Make Layer 1 prepared-document editing operationally coherent by exporting edited documents correctly, maintaining revision/index consistency, and surfacing degraded states instead of failing silently.

## Problem Statement

Milestone 0018 introduces controlled editing transactions. Once non-zero transactions exist, export, search, row rendering, and diagnostics need stronger behavior. The system must not silently ignore transactions, return stale search results as current, or hide storage/index failures from the viewer.

This milestone combines the previous edited-export/revision work and diagnostics/degraded-state UX work into one correctness milestone.

## Required Authority Documents

Implementation agents must read:

- `AGENTS.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/SPECS.md`
- `docs/specs/document-export.md`
- `docs/specs/transaction-log.md`
- `docs/specs/search-index.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/specs/edited-prepared-document-export.md`
- `docs/specs/layer1-viewer-diagnostics.md`

Read public docs only when changing public behavior or diagnostics:

- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/export-edited-prepared-document.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

## Scope

### In Scope

- Export for prepared documents with supported Layer 1 transactions.
- Changed-region materialization for supported controlled edits.
- Revision consistency between transaction log, runtime session, search results, row windows, and export.
- Explicit index invalidation/stale-state behavior after edits.
- Diagnostics for unsupported export, stale index, failed index, missing index, storage failure, concurrency conflict, revision mismatch, and unsupported operation.
- Viewer/sample degraded-state display.
- Short-running tests for export, revision handling, stale search/index behavior, and diagnostics.

### Out of Scope

- Full arbitrary range-diff export.
- Compaction.
- Schema-aware export normalization.
- Collaborative editing.
- Multi-writer conflict merge.
- Rich visual design pass.
- Full benchmark suite.
- Release/package validation.

## Focus Areas

### Focus Area 1 — Edited export path

Implement export for documents containing supported controlled-edit transactions.

Expected behavior:

- stream unchanged source chunks where possible;
- materialize changed regions from transaction payloads;
- preserve unchanged regions byte-for-byte where practical;
- honor export formatting policy for changed regions where implemented;
- fail clearly for unsupported transaction types.

### Focus Area 2 — Revision consistency

Ensure runtime, storage, transaction log, export, and search result behavior use explicit revision semantics.

Expected behavior:

- export reports the revision exported;
- search results include searched revision;
- row windows include revision;
- reveal refuses or warns on stale result revision;
- transactions do not append against wrong base revision.

### Focus Area 3 — Search/index invalidation after edits

After edits, derived indexes must be updated, marked stale, or rejected explicitly.

The implementation must not return stale search results as current without reporting staleness.

Conservative behavior is acceptable:

```text
edit committed
  -> mark search/path/structural-derived artifacts stale as needed
  -> viewer reports stale capabilities
  -> rebuild remains deferred unless existing infrastructure supports it
```

### Focus Area 4 — Degraded-state diagnostics

Harden diagnostics for prepared-document viewer and editing/export paths.

Diagnostic categories:

- document not ready;
- document not found;
- session not found;
- revision mismatch;
- range outside source bounds;
- unsupported operation;
- missing index;
- stale index;
- failed index;
- storage provider failure;
- decode failure;
- export unsupported transaction;
- concurrency conflict.

### Focus Area 5 — Sample behavior

Update samples to make degraded state visible.

The sample should demonstrate at least:

- clean ready state;
- stale search/index state after edit when relevant;
- edited export success for supported edits or clear unsupported export result;
- diagnostic display for simulated missing/stale/failed index state where practical.

## Direct Documentation Impact

Direct files for this milestone:

- `docs/milestones/milestone-0019-edited-export-revision-and-diagnostics-hardening.md`
- `docs/specs/edited-prepared-document-export.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/export-edited-prepared-document.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

Update these if implementation behavior differs from this plan.

## Deferred Documentation Synchronization

A later documentation synchronization pass should review:

- `README.md`
- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/TERMINOLOGY.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/guides/layer1-controlled-editing.md`
- `public-docs/diagnostics.md`

## Validation Expectations

Focused validation when touching frontend/runtime:

```sh
./eng/frontend-check.sh
```

Focused validation when touching samples:

```sh
./eng/samples.sh
```

Focused validation when touching public docs:

```sh
./eng/public-docs.sh
```

Tier 1:

```sh
./eng/test.sh
```

Tier 2 when practical:

```sh
./eng/check.sh
```

Explicit-only:

```sh
./eng/long-running-tests.sh [--fast]
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

Large edited-document export validation remains explicit-only unless reduced to deterministic short-running fixtures.

## Acceptance Criteria

The milestone is complete when:

- supported controlled-edit transactions can be exported correctly;
- unsupported transactions fail export clearly;
- exported revision is explicit;
- search results, row windows, runtime session state, and export use explicit revision identity;
- stale/missing/failed index states are visible and do not silently produce incorrect behavior;
- viewer, editing, search, and export diagnostics use stable result objects for normal user/request failures;
- samples demonstrate edited export/degraded-state behavior;
- short-running tests cover edited export, revision mismatch, stale search/index state, and diagnostics;
- required validation tiers pass when practical.
