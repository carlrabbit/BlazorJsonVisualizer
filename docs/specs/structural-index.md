# Structural Index Specification

## Goal

Define the Layer 1 structural index built from JSON tokenizer output.

The structural index represents JSON node boundaries and parent/child relationships without making the full JavaScript object tree the canonical runtime model.

## Authority

This document is authoritative for:

- JSON node identity
- node kinds
- node offset range semantics
- parent/child relationship semantics
- structural index construction expectations
- folding target semantics

This document is not authoritative for:

- tokenizer lexical behavior
- viewport rendering
- schema overlays
- editing transactions
- persistence

## Node Identity

Each structural node has a stable node identifier within a document session revision.

```ts
type NodeId = string;
```

Node identifiers are runtime identifiers, not persisted external IDs.

## Node Model

```ts
type JsonNodeKind =
  | "document"
  | "object"
  | "array"
  | "property"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "invalid";

interface JsonNode {
  id: NodeId;
  kind: JsonNodeKind;
  startOffset: number;
  endOffset: number;
  parentId?: NodeId;
  depth: number;
  firstChildId?: NodeId;
  nextSiblingId?: NodeId;
  propertyName?: string;
}
```

`startOffset` is inclusive. `endOffset` is exclusive.

A `document` node is the root node for the indexed document.

## Property Nodes

A JSON object property is represented as a `property` node.

The property node owns:

- the property name
- the value node as its child

The property node range covers the property string token through the end of the value node.

## Structural Validity

For valid JSON:

- every non-root node has a parent
- object and array nodes may have children
- property nodes appear only under object nodes
- property nodes have one value child
- primitive nodes have no children

For invalid JSON:

- the structural index may contain `invalid` nodes
- construction should not crash on malformed input where recovery is practical

## Construction Rules

The structural index is built from tokenizer output.

The indexer must not call `JSON.parse` as its canonical implementation.

Using `JSON.parse` in tests as an oracle for small valid snippets is allowed, but the production indexer must preserve source ranges and therefore cannot rely on object materialization.

## Fold State

Fold state is tracked as a `Set<NodeId>` of folded node IDs on the structural index.

Foldable nodes:

- object
- array

Non-foldable nodes:

- document
- property
- string
- number
- boolean
- null
- invalid

## Fast Tests

Fast structural index tests must cover:

- root document node
- object node
- array node
- nested object/array
- property node
- primitive nodes
- parent/child links
- depth
- node ranges
- malformed input recovery

## Legacy Note

Earlier milestones used a `StructuralNodeRecord` type with `foldable`, `folded`, and `path` fields in the monolithic runtime-core index. The Layer 1 modular implementation uses `JsonNode` with fold state managed separately as `foldedNodeIds: Set<NodeId>` on the `StructuralIndex`.

For prepared-document workflows, persisted structure metadata is treated as a derived index and may be rebuilt from prepared source plus transactions.
