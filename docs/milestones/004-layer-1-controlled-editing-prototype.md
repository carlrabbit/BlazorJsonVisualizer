# Milestone 004: Layer 1 Controlled Editing Prototype

## Status

Closed. This milestone is implemented in the repository.

## Goal

Add constrained Layer 1 editing through explicit structural transactions. Editing remains structure-first: the runtime owns document mutation, rebuilds or updates its structural index after accepted changes, and emits deterministic change information back to the Blazor host.

## Scope

- add explicit runtime transaction DTOs and validation for Layer 1 edits
- track monotonically increasing document revisions per loaded session
- support primitive value replacement
- support object property add, replace, and remove operations
- support array item insert and remove operations
- rebuild the structural index after accepted prototype edits and preserve fold state by exact surviving paths where practical
- emit deterministic transaction, patch, and rejection events back to the Blazor host
- expose programmatic transaction, undo, and redo calls through the Blazor shell
- demonstrate at least one transaction and patch event through the sample app

## Non-goals

- freeform text editing
- arbitrary DOM mutation as canonical document state
- schema-aware editing
- multi-cursor editing
- rich clipboard behavior
- collaborative editing
- huge-document incremental reparsing

## Deliverables

- `docs/specs/transaction-model.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/specs/structural-index.md`
- `docs/architecture/document-model.md`
- `src/runtime/runtime-core/index.ts`
- `src/runtime/runtime-core/index.test.ts`
- `src/runtime/runtime-dom/index.ts`
- `src/runtime/runtime-blazor/index.ts`
- `src/BlazorJsonVisualizer/Components/JsonVisualizer.razor`
- `src/BlazorJsonVisualizer/Interop/JsonVisualizerJsInterop.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeCommands.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeEventDto.cs`
- `src/BlazorJsonVisualizer.SampleApp/Components/Pages/Home.razor`

## Governing documents

- `README.md`
- `docs/ENGINEERING.md`
- `docs/SPECS.md`
- `docs/WORKFLOWS.md`
- `docs/TESTING.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/specs/structural-index.md`
- `docs/specs/viewport-model.md`
- `docs/specs/transaction-model.md`
- `docs/architecture/document-model.md`
- `docs/decisions/0002-use-custom-editor-core.md`
- `docs/decisions/0003-structure-first-json-model.md`

## Phases

1. Define the transaction model, revision rules, and protocol updates for controlled Layer 1 editing.
2. Implement structural transactions, deterministic rejection, patch production, and minimal undo/redo support in `runtime-core`.
3. Expose programmatic transaction calls through `runtime-dom`, `runtime-blazor`, the Blazor component, and the sample app.
4. Validate the prototype with fast runtime tests, project builds, and sample app verification.

## Exit criteria

- controlled structural transactions mutate small JSON documents without DOM-first mutation
- accepted transactions increment revision and produce host-visible patch information
- invalid transactions are rejected deterministically
- the structural index remains coherent after accepted edits
- the sample app can trigger a transaction and observe `documentPatchProduced`
- milestone specs, architecture notes, and runtime contracts stay aligned with implementation
