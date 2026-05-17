# Viewport Model

## Purpose

Define how the runtime represents and updates the visible portion of a structural JSON document.

## Initial direction

- The viewport is derived from document and folding state.
- Viewport operations must be deterministic and suitable for fast tests.
- Rendering coordination should depend on the viewport model rather than raw text.
