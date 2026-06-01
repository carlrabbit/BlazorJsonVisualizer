# 0007 — Use controlled structural edits before freeform text editing in Layer 1

## Status

Accepted for Milestone 0018.

## Context

BlazorJsonVisualizer targets huge JSON documents, prepared-document storage, range-backed viewing, and incremental updates. Arbitrary text editing over huge prepared documents would require complex offset mapping, reparsing, conflict handling, and export behavior.

The project can provide practical editing value earlier by supporting controlled structural operations that produce validated transactions.

## Decision

Layer 1 prepared-document editing will start with controlled structural edit commands instead of freeform text editing.

Supported commands are intentionally limited to operations that can be validated against structural metadata and appended as durable transactions.

Freeform text editing, arbitrary byte-range replacement, and schema-aware refactorings are deferred.

## Consequences

### Positive

- Editing can use the prepared-document transaction model safely.
- Export and index invalidation can reason about operation kinds.
- UI can avoid promising general-purpose text editor behavior.
- The system remains aligned with structure-first JSON manipulation.

### Negative

- Users cannot initially make arbitrary textual edits.
- Some valid JSON changes require multiple controlled operations or remain unsupported.
- Public docs must communicate the difference between controlled editing and text editing.

## Rejected Alternatives

### Freeform text editing first

Rejected because it would force the most complex offset/reparse/export problems before the structure-first model is proven.

### Arbitrary range replacement first

Rejected because range replacement can corrupt JSON structure unless surrounded by substantial validation and reindexing machinery.

### Schema-aware editing first

Rejected because Layer 2 depends on stable Layer 1 prepared-document editing primitives.

## Authority

This decision is authoritative for the first Layer 1 editing direction.

## Document Contract

When this decision changes, review:

- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/specs/edited-prepared-document-export.md`
- `docs/specs/transaction-log.md`
- `public-docs/guides/layer1-controlled-editing.md`
