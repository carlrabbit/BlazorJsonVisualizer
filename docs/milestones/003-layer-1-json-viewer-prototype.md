# Milestone 003: Layer 1 JSON Viewer Prototype

## Status

Closed. This milestone is already implemented in the repository.

## Goal

Build the first Layer 1 prototype: load a small JSON document, tokenize it, build an initial structural index, render it through the browser runtime, and support basic folding and navigation. Editing remains out of scope.

## Scope

- parse small JSON documents into a complete in-memory structural index
- accept any valid JSON root value: object, array, string, number, boolean, or null
- emit deterministic diagnostics for invalid JSON documents
- render the document from the TypeScript runtime with indentation and syntax classes
- support folding for object and array nodes
- support reveal-by-path for paths present in the structural index
- keep Blazor as a thin host that mounts the runtime, forwards commands, and receives runtime events
- demonstrate the milestone through the sample Blazor app

## Non-goals

- editing
- schema overlay
- projection plugins
- huge-file chunking
- background worker parsing unless simple to add
- full virtualization
- benchmarking

## Deliverables

- `docs/specs/structural-index.md`
- `docs/specs/viewport-model.md`
- `docs/specs/runtime-protocol.md`
- `docs/architecture/document-model.md`
- `src/runtime/runtime-core/index.ts`
- `src/runtime/runtime-core/index.test.ts`
- `src/runtime/runtime-dom/index.ts`
- `src/runtime/runtime-blazor/index.ts`
- `src/BlazorJsonVisualizer/Interop/JsonVisualizerJsInterop.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeEventDto.cs`
- `src/BlazorJsonVisualizer.SampleApp/Components/Pages/Home.razor`

## Governing documents

- `README.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- `docs/WORKFLOWS.md`
- `docs/TESTING.md`
- `docs/tbps/create-milestone.md`
- `docs/tbps/finish-milestone.md`
- `docs/tbps/feature-implementation.md`
- `docs/tbps/runtime-contract-change.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/specs/structural-index.md`
- `docs/specs/viewport-model.md`
- `docs/architecture/document-model.md`
- `docs/architecture/browser-runtime.md`
- `docs/decisions/0002-use-custom-editor-core.md`
- `docs/decisions/0003-structure-first-json-model.md`

## Phases

1. Define the Layer 1 structure-first behavior in the structural index, viewport, protocol, and document model documents.
2. Implement framework-free JSON parsing, structural indexing, diagnostics, folding, and reveal-by-path in `runtime-core`.
3. Render the document through `runtime-dom`, surface host/runtime interop through `runtime-blazor`, and expose the feature through the Blazor host and sample app.
4. Validate the prototype with fast runtime tests and project builds.

## Exit criteria

- small JSON documents render through the runtime
- the structural index exists and drives folding/navigation behavior
- invalid JSON produces deterministic diagnostics
- Blazor remains a thin host rather than owning JSON rendering internals
- the milestone specs and architecture documents are present and aligned with the implementation
- fast validation remains local and deterministic through `npm run build`, `npm test`, and `dotnet build`
