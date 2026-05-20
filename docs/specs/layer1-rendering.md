# Layer 1 Rendering Specification

## Goal

Define the read-only DOM rendering behavior for the Layer 1 JSON viewer.

## Authority

This document is authoritative for:

- read-only JSON rendering expectations
- DOM renderer responsibilities
- relationship between render rows and visible output
- folding UI behavior at a behavioral level

This document is not authoritative for:

- CSS theme details
- schema overlays
- controlled editing
- plugin projections

## Rendering Input

The renderer consumes render rows from the viewport model.

The renderer must not parse JSON independently.

## Rendering Output

The renderer displays JSON as structured, monospaced, read-only rows.

Each rendered row should preserve enough metadata to map visible UI interactions back to the underlying node where applicable.

Suggested DOM metadata:

```html
<div data-row-index="0" data-node-id="n1" data-depth="0">{ ... }</div>
```

## Read-Only Constraint

The Layer 1 renderer must not use `contenteditable`.

Text editing is out of scope for this milestone.

## Folding UI

Foldable object/array rows should expose a visible folding affordance.

Activating the affordance toggles fold state through the runtime model, not through ad hoc DOM mutation.

## Selection Scope

This milestone may support simple node selection or focused-node indication.

Text selection may rely on native browser plain text selection where it works, but the implementation must not build editing semantics on top of browser selection.

## Styling

Styling should be minimal and deterministic.

The viewer should be usable in the sample app without requiring a frontend framework.

## Non-Goals

This milestone does not require:

- syntax theme customization
- schema hover rendering
- inline editors
- plugin regions
- canvas rendering
- advanced accessibility semantics
