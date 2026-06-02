# Edited Prepared Document Export Specification

## Goal

Define export behavior for prepared documents that contain supported Layer 1 editing transactions.

## Scope

This specification covers transaction-aware export, changed-region materialization, revision reporting, unsupported transaction behavior, and index-state implications.

## Non-Goals

This specification does not define:

- arbitrary diff/patch export;
- compaction;
- schema-aware formatting;
- semantic Layer 2 refactoring export;
- collaborative edit merging;
- package release behavior.

## Relationship to Document Export

`docs/specs/document-export.md` defines the base export API and no-edit export behavior.

This specification extends export to prepared documents with supported Layer 1 transactions.

## Export Principle

Export must not silently ignore transactions.

If a prepared document contains transactions that cannot be materialized, export must fail clearly with an unsupported transaction diagnostic.

## Supported Export Behavior

For supported controlled edits, export must:

- stream unchanged source chunks where possible;
- materialize changed regions from transaction payloads;
- preserve unchanged regions byte-for-byte where practical;
- apply selected formatting policy to changed regions where implemented;
- report exported revision.

The file-backed implementation supports `replaceNodeValue`, `renameProperty`, `insertProperty`, `removeProperty`, `insertArrayItem`, and `removeArrayItem` transaction kinds. It validates the transaction revision chain before writing edited output. The current materialization path uses a parsed JSON tree for the edited result, so unchanged regions are preserved byte-for-byte for no-edit export and normalized for edited export according to the selected writer policy.

## Revision Requirements

Export must use explicit revision identity.

Export result metadata should include:

- prepared document id;
- exported revision;
- transaction count or latest transaction id where available;
- formatting policy used;
- diagnostics if degraded behavior occurred.

## Unsupported Transaction Behavior

If export encounters unsupported transaction kinds, invalid transaction payloads, missing source chunks, or inconsistent revision state, it must fail clearly.

It must not emit partial JSON unless the public API explicitly documents partial export behavior. Partial export is not part of this initial contract.

## Index State Relationship

Export does not require search indexes to be current unless an implementation explicitly depends on them.

However, after edits, derived index states must not be misreported as current if they are stale.

## Authority

This document is authoritative for exporting edited prepared documents with supported Layer 1 transactions.

## Document Contract

When this spec changes, review:

- `docs/specs/document-export.md`
- `docs/specs/transaction-log.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/specs/search-index.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/export-edited-prepared-document.md`
