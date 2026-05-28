# Document Session Specification

## Goal

Define the Layer 1 document session model.

A document session groups source text, tokenizer output, structural index, viewport state, folding state, and revision identity.

## Authority

This document is authoritative for:

- document session lifecycle
- document revision identity
- dirty/read-only state for Layer 1
- relationship between source text, tokenization, and structural index

This document is not authoritative for:

- persistence
- Blazor component lifecycle
- editing transactions beyond read-only placeholders
- schema overlays
- projection plugins

## Session Model

```ts
type DocumentSessionId = string;
type RevisionId = number;

type DocumentSessionMode = "readOnly" | "editable";

interface DocumentSession {
  id: DocumentSessionId;
  revision: RevisionId;
  mode: DocumentSessionMode;
  sourceText: string;
  tokenCount: number;
  rootNodeId: NodeId;
  structuralIndex: StructuralIndex;
  tokens: JsonToken[];
}
```

## Lifecycle

A document session may be:

1. created from source text
2. indexed
3. attached to a viewport
4. disposed

In this milestone, sessions are read-only by default.

## Revision Semantics

The initial revision is `1`.

Read-only viewport actions such as folding or reveal do not change the document revision.

Future editing milestones may increment revision when source text or structural content changes.

## Prepared Document Relationship

For huge-document workflows, a document session may be opened from a prepared document instead of direct full-text load.

The prepared document remains the durable source of truth. The runtime session remains interactive state.

## Source Ownership

For this milestone, the document session owns the source text as a single JavaScript string.

This is intentionally acceptable for the first Layer 1 prototype. Chunked storage is a future optimization and must not be simulated prematurely.

## Invalidation

Creating a new session from different source text creates a new tokenizer output and structural index.

Incremental re-indexing is not required in this milestone.

## Non-Goals

This milestone does not require:

- chunked source storage
- incremental reparsing
- editing transactions
- persistence
- remote streaming
- dirty-state tracking for edits

## Legacy Note

Earlier milestones used a `DocumentSessionRecord` type with lifecycle states (`created`, `mounted`, `document-loaded`, `disposed`) and a `SessionRegistry` in the monolithic runtime-core. That model supports editing, schema overlays, and projections. The Layer 1 modular `DocumentSession` is a read-only, lighter-weight model aligned with the spec above.
