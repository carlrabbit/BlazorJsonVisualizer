# Milestone 002: Runtime Skeleton and Blazor Integration Shell

## Status

Closed. The runtime skeleton, Blazor integration shell, and related specs already exist in the repository.

## Goal

Create the standalone TypeScript runtime skeleton and the minimal Blazor-facing package shell. This milestone proves the boundary: Blazor can mount the browser runtime, pass configuration, and receive events without owning runtime internals.

## Scope

- establish the standalone `src/runtime/` workspace and package split
- define the runtime protocol and document session lifecycle specs
- provide a placeholder DOM runtime mount and temporary runtime-to-host roundtrip event
- provide a Blazor `JsonVisualizer` component that mounts and disposes the runtime
- demonstrate the shell from the sample Blazor app

## Non-goals

- actual JSON parsing
- structural index implementation
- real editor UI
- schema support
- plugin support
- NuGet packaging automation

## Deliverables

- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/architecture/browser-runtime.md`
- `docs/architecture/blazor-integration.md`
- `src/runtime/` workspace with `runtime-core`, `runtime-dom`, `runtime-worker`, and `runtime-blazor`
- `src/BlazorJsonVisualizer/Components/JsonVisualizer.razor`
- sample app usage in `src/BlazorJsonVisualizer.SampleApp/`

## Governing documents

- `README.md`
- `docs/ENGINEERING.md`
- `docs/SPECS.md`
- `docs/WORKFLOWS.md`
- `docs/architecture/runtime-boundaries.md`
- `docs/architecture/browser-runtime.md`
- `docs/architecture/blazor-integration.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/TESTING.md`

## Phases

1. Define the runtime boundary, protocol DTOs, and session lifecycle documentation.
2. Create the standalone TypeScript runtime packages and placeholder DOM mounting shell.
3. Add the Blazor interop facade, `JsonVisualizer` component, and sample app integration.
4. Validate the runtime workspace build/test flow and the independent Blazor project builds.

## Exit criteria

- runtime packages exist under `src/runtime/` and build independently
- the Blazor component mounts the runtime placeholder and can dispose it cleanly
- the runtime emits at least one event back to the Blazor host
- required specs and architecture documents are present and aligned with the implementation
- fast validation remains local and reviewable through `npm run build`, `npm test`, and `dotnet build`
