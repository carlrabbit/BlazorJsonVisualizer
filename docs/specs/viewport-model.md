# Viewport Model Spec

## Purpose

Defines how Layer 1 renders a document portion and reacts to folding/navigation.

## Scope

Milestone 003 may use simple DOM rendering. True endless scrolling or chunked virtualization can be deferred.

## Concepts

- Rendered line: a visual row derived from the JSON text and structural index.
- Folded node: a structural node whose children are hidden from the rendered view.
- Reveal path: operation that makes a JSON path visible by expanding ancestors and scrolling/rendering to the target.

## Required operations

### `renderDocument`

Renders loaded JSON text with syntax classes and structural indentation.

### `toggleFold`

Toggles folding for an object or array node.

### `revealPath`

Expands ancestors of the target path and makes the target visible.

## Rules

- Folded child content must not be visible.
- Folding must be driven by the structural index, not regex matching.
- Rendering must tolerate documents with no schema.
- Rendering must not require Blazor to render JSON internals.
