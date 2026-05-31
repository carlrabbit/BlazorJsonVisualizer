# Prepared Document Specification

## Goal

Define the persistent internal representation created from a raw JSON source before interactive viewing or editing.

## Scope

This specification covers prepared document identity, metadata, manifest structure, derived index ownership, transaction log relationship, and prepared document lifecycle.

## Core Model

A prepared document is a durable repository-managed representation of an imported JSON source.

A prepared document contains:

- source representation;
- manifest metadata;
- derived indexes;
- transaction log metadata.

## Identity

```csharp
public readonly record struct PreparedDocumentId(string Value);
```

Prepared document identifiers are stable within a prepared document store.

## Manifest

Each prepared document must have a versioned manifest as the durable entry point.

Minimum persisted fields:

- `formatVersion`
- `documentId`
- `sourceLength`
- `sourceHash`
- `createdAt`
- `latestRevision`
- `state`
- `indexes`
- `transactions`

## Revision Semantics

- Import creates revision `1`.
- Read-only operations do not change the revision.
- Editing transactions increment the revision.

## Derived Indexes

Derived indexes are rebuildable artifacts.

Index states:

```text
missing
building
ready
stale
failed
```

## Authority

This document is authoritative for:

- prepared document identity;
- prepared document lifecycle;
- prepared document manifest semantics;
- derived index ownership;
- revision relationship between import and transactions.

This document is not authoritative for:

- tokenizer lexical behavior;
- structural index node semantics;
- viewport behavior;
- public documentation wording.

## Document Contract

When this spec changes, review:

- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `docs/specs/transaction-log.md`
- `docs/specs/document-session.md`
- `docs/TERMINOLOGY.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`

## Storage Engine Alignment

Milestone 0013 stores prepared documents through a replaceable storage-provider abstraction. The manifest remains the durable entry point and now records source byte length, UTF-8 source encoding, source chunk size, updated timestamp, line index state, and transaction-log state.

Prepared source offsets persisted by the storage engine are UTF-8 byte offsets. Browser/runtime offsets may use UTF-16 code units only after explicit conversion through index services.
