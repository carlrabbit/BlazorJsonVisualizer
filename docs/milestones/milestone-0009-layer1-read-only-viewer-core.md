# Milestone 009 — Layer 1 Read-Only Viewer Core

## Goal

Implement the first coherent Layer 1 read-only JSON viewing path.

## Governing References

- `docs/specs/json-tokenizer.md`
- `docs/specs/structural-index.md`
- `docs/specs/document-session.md`
- `docs/specs/viewport-model.md`
- `docs/specs/layer1-rendering.md`
- `docs/specs/path-navigation.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/sample-hosting.md`
- `docs/TESTING.md`

## Scope

This milestone covers:

- Layer 1.1 — JSON tokenizer
- Layer 1.2 — Structural index
- Layer 1.3 — Document session model
- Layer 1.4 — Viewport model and read-only rendering
- Layer 1.6 — Folding support
- Layer 1.7 — Path reveal and navigation
- Layer 1.8 — Layer 1 sample app wiring
- Layer 1.9 — Fast tests for Layer 1 core

Layer 1.5 is not listed separately; read-only rendering is covered as part of Layer 1.4.

## Target Flow

```text
JSON text
  -> tokenizer
  -> structural index
  -> document session
  -> viewport model
  -> read-only DOM rendering
  -> folding
  -> path reveal/navigation
  -> Layer 1 sample app
```

## Non-Goals

- Free-form text editing
- Controlled structural editing
- Undo/redo
- JSON Schema validation
- Schema overlays
- Layer 2 features
- Layer 3 projections
- Plugin APIs
- Benchmark infrastructure
- Huge-file stress tests
- CodeMirror or Monaco integration
- `contenteditable`-based editing
- Canvas rendering
- Full JSON object materialization as the canonical runtime model

## Deliverables

### New runtime source files

```text
src/runtime/runtime-core/src/json/tokens.ts
src/runtime/runtime-core/src/json/tokenizer.ts
src/runtime/runtime-core/src/document/nodeIds.ts
src/runtime/runtime-core/src/document/jsonNode.ts
src/runtime/runtime-core/src/document/structuralIndex.ts
src/runtime/runtime-core/src/document/documentSession.ts
src/runtime/runtime-core/src/viewport/viewportTypes.ts
src/runtime/runtime-core/src/viewport/viewportModel.ts
src/runtime/runtime-core/src/navigation/jsonPath.ts
src/runtime/runtime-core/src/navigation/pathReveal.ts
src/runtime/runtime-dom/src/rendering/jsonViewRenderer.ts
src/runtime/runtime-dom/src/rendering/foldingController.ts
src/runtime/runtime-blazor/src/layer1Host.ts
```

### New test files

```text
tests/runtime/json/tokenizer.test.ts
tests/runtime/document/structuralIndex.test.ts
tests/runtime/document/documentSession.test.ts
tests/runtime/viewport/viewportModel.test.ts
tests/runtime/navigation/pathReveal.test.ts
tests/runtime/rendering/jsonViewRenderer.test.ts
```

### New spec docs

```text
docs/specs/json-tokenizer.md
docs/specs/layer1-rendering.md
docs/specs/path-navigation.md
```

### Updated docs

- `docs/SPECS.md` — added new specs
- `docs/TERMINOLOGY.md` — added Layer 1 terms
- `docs/TESTING.md` — added Layer 1 fast test rules
- `docs/specs/structural-index.md` — updated
- `docs/specs/document-session.md` — updated
- `docs/specs/viewport-model.md` — updated
- `docs/specs/runtime-protocol.md` — updated
- `docs/specs/sample-hosting.md` — updated
- `samples/SAMPLES.md` — Layer 1 sample noted
- `README.md` — updated

## Exit Criteria

- [x] JSON tokenizer spec exists and is implemented
- [x] Structural index spec is updated and implemented
- [x] Document session spec is updated and implemented
- [x] Viewport model spec is updated and implemented
- [x] Read-only renderer spec exists and is implemented
- [x] Path navigation spec exists and is implemented
- [x] Layer 1 sample app demonstrates read-only viewing, folding, and path reveal
- [x] Sample index links to the Layer 1 sample
- [x] Fast tests cover tokenizer, structural index, document session, viewport, folding, and path reveal
- [x] Implementation does not introduce Layer 2 or Layer 3 behavior
- [x] Implementation does not rely on a third-party editor core as the canonical Layer 1 model
