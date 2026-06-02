# Layer 1 Viewer Diagnostics Specification

## Goal

Define diagnostics and degraded-state behavior for the Layer 1 prepared-document viewer, search, editing, and export paths.

## Scope

This specification covers diagnostic categories, structured result behavior, viewer degraded states, and user-facing diagnostic expectations.

## Non-Goals

This specification does not define:

- visual design styling;
- diagnostic localization;
- storage-provider-specific implementation details;
- release diagnostics catalog stability.

## Diagnostic Principle

Normal user/request failures must return structured results with diagnostics instead of unhandled exceptions.

Infrastructure exceptions may still occur for exceptional failures, but expected conditions such as missing index, stale revision, unsupported operation, and document not ready are normal diagnostic results.

## Diagnostic Categories

Layer 1 must distinguish at least:

| Category | Meaning |
|---|---|
| `documentNotFound` | Prepared document cannot be found. |
| `documentNotReady` | Prepared document exists but is not ready for the requested operation. |
| `sessionNotFound` | Runtime session cannot be found or has been disposed. |
| `revisionMismatch` | Request/result targets a revision different from the current session. |
| `rangeOutOfBounds` | Requested byte range is outside source bounds. |
| `unsupportedOperation` | Operation is not supported by current session/index/provider state. |
| `indexMissing` | Required index does not exist. |
| `indexBuilding` | Required index is still building. |
| `indexStale` | Required index does not match current revision. |
| `indexFailed` | Required index exists in failed state. |
| `storageFailure` | Storage provider failed to serve the operation. |
| `decodeFailure` | Requested range could not be decoded according to encoding policy. |
| `exportUnsupportedTransaction` | Export cannot materialize an existing transaction type. |
| `concurrencyConflict` | Operation conflicts with concurrent write/session behavior. |
| `invalidEditTarget` | Edit target is missing or incompatible with requested edit. |
| `invalidEditPayload` | Edit payload is not valid JSON or violates edit contract. |

## Structured Result Behavior

Runtime operations that can fail normally must return result objects with:

- success flag;
- diagnostic code or category;
- human-readable message suitable for preview UI;
- optional target information;
- revision information when relevant;
- recoverability hint when known.

## Viewer Display Behavior

The viewer must display diagnostics without corrupting viewport state.

Minimum display behavior:

- document/session blocking diagnostics appear in the viewer surface;
- operation diagnostics appear near the initiating control or diagnostics panel;
- stale index/search states are visible before or with search results;
- stale search-result reveal returns a revision-mismatch diagnostic before using stale offsets as current;
- reveal failures identify the target and reason;
- unsupported editing/export states do not imply data loss.

## Degraded Capability Reporting

Runtime metadata must report supported operations and degraded operations.

Examples:

- search unavailable because search index is missing;
- path reveal unavailable because path index is stale;
- folding unavailable because structural index failed;
- edited export unavailable because transaction materialization is unsupported.

After successful controlled edits, the viewer reports stale derived index states for structure, search, and path until rebuilt. Search, rows, folding, and path reveal must return structured missing/stale/failed index diagnostics rather than silently using old derived artifacts as current.

## Authority

This document is authoritative for Layer 1 viewer diagnostic categories and degraded-state behavior.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/prepared-document-viewer-search-workflow.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/specs/edited-prepared-document-export.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`
