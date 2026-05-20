# Viewport Model Specification

## Goal

Define the Layer 1 viewport model used to render a read-only JSON document view.

The viewport model maps a document session and structural index to a list of visible render rows.

## Authority

This document is authoritative for:

- viewport state
- visible row semantics
- folding state interaction
- reveal-by-node behavior
- render row identity

This document is not authoritative for:

- DOM implementation details
- CSS styling
- schema overlays
- editing
- browser scroll performance guarantees

## Viewport State

```ts
interface ViewportState {
  sessionId: DocumentSessionId;
  firstVisibleRow: number;
  visibleRowCount: number;
  focusedNodeId?: NodeId;
}
```

## Render Row Model

```ts
type RenderRowKind = "node" | "foldPlaceholder" | "diagnostic";

interface RenderRow {
  rowIndex: number;
  kind: RenderRowKind;
  nodeId?: NodeId;
  depth: number;
  text: string;
  folded?: boolean;
}
```

## Visible Rows

Visible rows are derived from the structural index and folding state.

Collapsed descendants of folded object/array nodes must not appear as normal visible rows.

A folded object/array renders as a single node row with `folded: true` and no children rows. The row text shows `{ ... }` or `[ ... ]` to indicate folded content.

## Initial Scope

The first implementation renders all rows and then slices them for viewport calculation.

True large-file virtualization is not required in this milestone, but the public model must not prevent it.

## Reveal Semantics

Reveal by node/path adjusts viewport state so the target node appears in the visible row range.

If the target node is inside a folded ancestor, the reveal operation expands required ancestors.

## Non-Goals

This milestone does not require:

- pixel-perfect virtualization
- variable row height support
- horizontal virtualization
- browser scroll anchoring correctness under edits
- editing cursor semantics

## Legacy Note

Earlier milestones used `ViewportDto` with `width` and `height` properties in the monolithic runtime-core. The Layer 1 modular viewport uses row-based `ViewportState` with `firstVisibleRow` and `visibleRowCount`.
