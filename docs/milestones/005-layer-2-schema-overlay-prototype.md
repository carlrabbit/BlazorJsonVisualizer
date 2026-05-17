# Milestone 005: Layer 2 schema overlay prototype

## Status

Closed. This milestone is implemented in the repository.

## Goal

Add the first Layer 2 prototype: attach JSON Schema metadata to a loaded JSON document, display schema-aware overlays, show validation diagnostics, and expose simple schema-aware editing hints for small to medium documents.

## Scope

- attach schema state to a loaded document session as an overlay over Layer 1
- resolve schema metadata for object properties and array items for the supported subset
- emit schema diagnostics separately from parse diagnostics
- render schema-aware overlay markers, hover metadata, enum hints, and required-property indication in the runtime DOM
- expose schema attach/detach/metadata protocol operations through runtime-blazor and the Blazor shell
- demonstrate schema attach and schema diagnostic events in the sample app

## Non-goals

- full JSON Schema implementation
- remote `$ref` resolution
- schema bundling
- large-file validation strategies
- schema-driven form generation
- projection plugins

## Deliverables

- `docs/specs/schema-overlay-model.md`
- `docs/specs/runtime-protocol.md`
- `docs/architecture/document-model.md`
- `docs/architecture/browser-runtime.md`
- `src/runtime/runtime-core/index.ts`
- `src/runtime/runtime-core/index.test.ts`
- `src/runtime/runtime-dom/index.ts`
- `src/runtime/runtime-blazor/index.ts`
- `src/BlazorJsonVisualizer/Interop/JsonVisualizerJsInterop.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeCommands.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeEventDto.cs`
- `src/BlazorJsonVisualizer/Components/JsonVisualizer.razor`
- `src/BlazorJsonVisualizer.SampleApp/Components/Pages/Home.razor`

## Governing documents

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- `docs/TESTING.md`
- `docs/tbps/create-milestone.md`
- `docs/tbps/start-milestone.md`
- `docs/tbps/finish-milestone.md`
- `docs/tbps/feature-implementation.md`
- `docs/tbps/runtime-contract-change.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/specs/structural-index.md`
- `docs/specs/transaction-model.md`
- `docs/specs/schema-overlay-model.md`
- `docs/architecture/document-model.md`
- `docs/architecture/runtime-boundaries.md`
- `docs/architecture/browser-runtime.md`

## Phases

1. Update schema overlay/runtime protocol/architecture specifications for Layer 2.
2. Implement schema attachment, metadata resolution, diagnostics, and transaction-time schema invalidation in `runtime-core`.
3. Render schema overlays and schema diagnostics in `runtime-dom`.
4. Expose schema protocol calls through runtime-blazor, Blazor interop, component APIs, and the sample app.
5. Validate with fast tests and builds, then close the milestone.

## Exit criteria

- runtime sessions can attach and detach schema overlays for loaded documents
- schema metadata can be resolved for property and array item paths
- missing required property, primitive type mismatch, and enum mismatch diagnostics are emitted as schema diagnostics
- schema overlays are invalidated after Layer 1 transactions
- DOM rendering remains usable without schema while showing schema markers when attached
- sample app can attach schema and display schema diagnostic events
- milestone documentation and implementation remain aligned
