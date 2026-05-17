# Structural Index Spec

## Purpose

Defines the initial JSON structural index used by Layer 1 viewing, folding, and navigation.

## Scope

Milestone 003 supports complete in-memory parsing of small JSON documents. Huge-document chunking is a later enhancement.

## Node model

Each structural node has:

- `nodeId: string`
- `kind: "object" | "array" | "property" | "string" | "number" | "boolean" | "null"`
- `startOffset: number`
- `endOffset: number`
- `parentId?: string`
- `firstChildId?: string`
- `nextSiblingId?: string`
- `depth: number`
- `path: string`
- `foldable: boolean`
- `folded: boolean`

## Rules

- Node IDs must remain stable until the document is reloaded.
- Offsets refer to UTF-16 string offsets in Milestone 003.
- Object and array nodes are foldable.
- Primitive value nodes are not foldable.
- Property nodes connect object members to their value nodes.
- Invalid JSON must produce a diagnostic instead of a structural index.

## Non-goals

- Incremental reparsing.
- Chunked structural indexes.
- Stable IDs across edits.
- Schema metadata.

## Edit invalidation rules

After a successful transaction, the runtime must update or rebuild the affected structural index.

Milestone 004 may rebuild the full index for small documents after each transaction. This is acceptable only as a prototype constraint. Fold state may be preserved only for nodes whose exact paths survive the rebuild.
