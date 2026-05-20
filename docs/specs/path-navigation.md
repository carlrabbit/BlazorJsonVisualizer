# Path Navigation Specification

## Goal

Define Layer 1 path-based navigation and reveal behavior.

## Authority

This document is authoritative for:

- supported path syntax for Layer 1 reveal
- path resolution behavior
- reveal behavior
- failure semantics

This document is not authoritative for:

- schema references
- JSON Schema `$ref` resolution
- search
- editing
- plugin navigation

## Supported Path Syntax

Layer 1 supports JSON Pointer-style paths.

Examples:

```text
/
/properties/name
/items/0
/items/0/id
```

The empty path or `/` refers to the root document node. This is the chosen behavior for this implementation.

## Path Resolution

Path resolution maps a path to a `NodeId` when possible.

Resolution uses the structural index and property names/index positions.

## Array Indexes

Array path segments are decimal zero-based indexes.

Invalid indexes do not resolve.

## Object Properties

Object path segments are property names.

JSON Pointer escaping is supported for:

- `~0` as `~`
- `~1` as `/`

## Reveal Behavior

Reveal should:

1. resolve path to node
2. expand folded ancestors as needed
3. update focused node
4. update viewport so the node is visible

## Failure Semantics

Failed path resolution must not throw for normal user input.

The API returns a result object:

```ts
interface PathRevealResult {
  success: boolean;
  nodeId?: NodeId;
  reason?: "notFound" | "invalidPath" | "notIndexed";
}
```

## Non-Goals

This milestone does not require:

- JSONPath
- search queries
- schema-aware path aliases
- path suggestions
- path history
