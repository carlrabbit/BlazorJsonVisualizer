# BlazorJsonVisualizer

BlazorJsonVisualizer is a Blazor-facing package for a standalone TypeScript browser runtime that visualizes, navigates, and incrementally edits large structured JSON documents.

## Scope

The project targets three layers:

1. Layer 1: high-performance JSON viewing, navigation, folding, search, and controlled editing.
2. Layer 2: JSON Schema based overlays, validation hints, hover information, and schema-aware operations.
3. Layer 3: projection plugins that display supported JSON structures from alternate perspectives, such as tables or statistical explorers.

## Architectural stance

The TypeScript browser runtime is a first-class subsystem. Blazor is the primary user-facing host and packaging surface, but it does not own the runtime internals.

## Layer 1 runtime modules

Milestone 009 introduced modular Layer 1 source files under `src/runtime/*/src/`:

```text
src/runtime/runtime-core/src/json/          — tokenizer
src/runtime/runtime-core/src/document/      — structural index, document session
src/runtime/runtime-core/src/viewport/      — viewport model
src/runtime/runtime-core/src/navigation/    — path navigation
src/runtime/runtime-dom/src/rendering/      — DOM renderer, folding controller
src/runtime/runtime-blazor/src/             — Layer 1 Blazor host
```

## Non-goals

- General-purpose code editing.
- Full IDE behavior.
- Monaco or CodeMirror integration as the canonical editor core.
- Rich text clipboard fidelity.
- First-class IME support for CJK input.
- Multi-user collaboration.

## Samples

Developer samples live under `samples/` and use fixed ports so they can run concurrently in local development and GitHub workspace/dev-container environments.

```bash
scripts/dev/start-samples.sh
```

Then open the samples index on port `5100`.

## Engineering

Canonical commands:

```bash
./eng/restore.sh         # restore dependencies
./eng/build.sh           # build all projects
./eng/test.sh            # run short-running tests
./eng/format.sh          # apply formatting
./eng/check.sh           # restore + build + test + verify (completion gate)
./eng/frontend-check.sh  # TypeScript/Biome checks
./eng/samples.sh         # build and validate samples
```

Older npm-based runtime commands are superseded by the canonical `eng/` scripts.

See [`docs/ENGINEERING.md`](docs/ENGINEERING.md) for the full command contract.

## Documentation

| Document | Purpose |
|---|---|
| [`docs/ENGINEERING.md`](docs/ENGINEERING.md) | Command contracts and engineering setup. |
| [`docs/GUARDRAILS.md`](docs/GUARDRAILS.md) | Project-wide implementation and testing constraints. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Structural system design. |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decision records and rationale. |
| [`docs/MILESTONES.md`](docs/MILESTONES.md) | Implementation phases. |
| [`docs/RESEARCH.md`](docs/RESEARCH.md) | Non-authoritative research and prior guides. |
| [`docs/SPECS.md`](docs/SPECS.md) | Behavioral specs and invariants. |
| [`docs/TBPS.md`](docs/TBPS.md) | Task best practices. |
| [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md) | Canonical vocabulary. |
