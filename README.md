# BlazorJsonVisualizer

BlazorJsonVisualizer is a Blazor-facing package for a standalone TypeScript browser runtime that visualizes, navigates, and incrementally edits large structured JSON documents.

## Scope

The project targets three layers:

1. Layer 1: high-performance JSON viewing, navigation, folding, search, and controlled editing.
2. Layer 2: JSON Schema based overlays, validation hints, hover information, and schema-aware operations.
3. Layer 3: projection plugins that display supported JSON structures from alternate perspectives, such as tables or statistical explorers.

## Architectural stance

The TypeScript browser runtime is a first-class subsystem. Blazor is the primary user-facing host and packaging surface, but it does not own the runtime internals.

## Non-goals

- General-purpose code editing.
- Full IDE behavior.
- Monaco or CodeMirror integration as the canonical editor core.
- Rich text clipboard fidelity.
- First-class IME support for CJK input.
- Multi-user collaboration.

## Samples

Developer samples live under `samples/` and use fixed ports so they can run concurrently in local development and GitHub workspace/dev-container environments.

Use:

```bash
scripts/dev/start-samples.sh
```

Then open the samples index on port `5100`.
