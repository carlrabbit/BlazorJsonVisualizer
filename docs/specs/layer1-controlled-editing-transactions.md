# Layer 1 Controlled Editing Transactions Specification

## Goal

Define the first controlled Layer 1 editing model for prepared documents.

## Scope

This specification covers edit commands, transaction generation, validation, revision behavior, index invalidation, runtime update behavior, and unsupported-operation behavior.

## Non-Goals

This specification does not define:

- arbitrary text editing;
- arbitrary byte-range replacement;
- schema-aware Layer 2 editing;
- plugin projections;
- edited export implementation;
- compaction;
- collaborative conflict resolution.

## Editing Principle

Layer 1 editing must produce validated structural transactions.

Layer 1 must not introduce freeform text editing for prepared documents in the first controlled editing milestone.

## Supported Edit Commands

Initial edit commands may include:

- `replaceNodeValue` for primitive values;
- `renameProperty` for object property names;
- `insertProperty` for object insertion;
- `removeProperty` for object removal;
- `insertArrayItem` for array insertion;
- `removeArrayItem` for array removal.

The implementation may start with a smaller subset if unsupported commands return explicit results and docs/specs are updated accordingly.

## Command Requirements

Every edit command must include:

- runtime session id;
- prepared document id;
- base revision;
- target node id, JSON Pointer, or equivalent stable target;
- payload for the edit;
- optional user-facing edit label.

## Validation Requirements

Commands must validate:

- document is ready;
- session is writable;
- base revision matches current revision;
- target exists;
- target kind supports the requested operation;
- payload is valid JSON where applicable;
- required structural metadata exists and is not failed/stale beyond accepted policy.

Validation failure must return structured diagnostics.

## Transaction Requirements

Successful commands append transactions in revision order.

A transaction must include:

- transaction id;
- base revision;
- resulting revision;
- operation kind;
- target identity;
- normalized payload;
- affected byte/node ranges where available;
- timestamp or ordering metadata where the existing transaction log requires it.

## Index Invalidation

After a successful edit, derived indexes must be updated, invalidated, or marked stale according to available infrastructure.

Conservative invalidation is acceptable.

The system must not silently use stale search/path/structural data as current after edits.

## Runtime Update Behavior

After successful commit, the runtime must:

- update session revision;
- mark document dirty where applicable;
- invalidate affected row/range/search caches;
- request fresh rows for affected visible ranges or display a reload/degraded state;
- report diagnostics for any unsupported refresh path.

## Authority

This document is authoritative for first-generation Layer 1 controlled editing behavior.

## Document Contract

When this spec changes, review:

- `docs/specs/transaction-model.md`
- `docs/specs/transaction-log.md`
- `docs/specs/document-session.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/edited-prepared-document-export.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/layer1-controlled-editing.md`
