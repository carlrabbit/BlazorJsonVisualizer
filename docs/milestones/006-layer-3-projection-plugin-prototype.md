# Milestone 006: Layer 3 projection plugin prototype

## Status

Closed. This milestone is implemented in the repository.

## Goal

Prototype Layer 3 with one projection plugin over a supported schema/layout shape. The first projection is a table view over an array-of-objects structure.

## Scope

- add runtime projection registry support per document session
- implement `table.arrayOfObjects` projection creation for supported source paths
- derive table columns from observed object properties and enrich with schema metadata when available
- map table rows/cells back to source node IDs and structural JSON paths
- convert cell edits into Layer 1 `setPropertyValue` transactions
- render a table projection view in runtime DOM with selection and one edit path
- emit projection lifecycle/selection runtime events
- expose projection protocol operations through runtime-blazor, Blazor interop, and the sample app

## Non-goals

- plugin marketplace
- third-party plugin loading
- dynamic Blazor component plugins
- huge-table virtualization
- advanced table features such as sorting, filtering, grouping, resizing, and copy/paste
- statistical explorer projection

## Deliverables

- `docs/specs/projection-plugin-model.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/schema-overlay-model.md`
- `docs/architecture/plugin-model.md`
- `src/runtime/runtime-core/index.ts`
- `src/runtime/runtime-core/index.test.ts`
- `src/runtime/runtime-dom/index.ts`
- `src/runtime/runtime-blazor/index.ts`
- `src/BlazorJsonVisualizer/wwwroot/runtime-blazor.js`
- `src/BlazorJsonVisualizer/Protocol/RuntimeCommands.cs`
- `src/BlazorJsonVisualizer/Protocol/RuntimeEventDto.cs`
- `src/BlazorJsonVisualizer/Interop/JsonVisualizerJsInterop.cs`
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
- `docs/specs/structural-index.md`
- `docs/specs/transaction-model.md`
- `docs/specs/schema-overlay-model.md`
- `docs/specs/projection-plugin-model.md`
- `docs/architecture/plugin-model.md`
- `docs/architecture/runtime-boundaries.md`
- `docs/architecture/blazor-integration.md`

## Phases

1. Update Layer 3 projection specifications and architecture notes.
2. Implement runtime-core projection registry and `table.arrayOfObjects` projection APIs.
3. Render table projection selection/editing in runtime DOM and synchronize projection events.
4. Expose projection protocol and events through runtime-blazor, Blazor interop, component APIs, and sample app behavior.
5. Validate with fast tests/builds and close the milestone.

## Exit criteria

- a table projection can be created for an array-of-objects path
- projection reads run through structural/projection APIs
- projection edits write through Layer 1 transactions
- projection selection maps back to source JSON node/path
- projection functions without schema and improves with schema metadata
- docs/specs and implementation remain aligned

## Completion notes

- implemented `table.arrayOfObjects` projection creation, selection mapping, and transaction-backed cell edits
- projection lifecycle and selection events are emitted by runtime DOM and surfaced through Blazor interop
- sample app creates a projection on document load and displays projection event fields
