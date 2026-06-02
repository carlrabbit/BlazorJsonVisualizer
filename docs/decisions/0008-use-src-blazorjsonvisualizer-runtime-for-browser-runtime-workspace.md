# 0008 — Use `src/BlazorJsonVisualizer.Runtime` for the browser runtime workspace

## Status

Accepted and implemented for Milestone 0020.

## Context

The repository contains a TypeScript browser runtime with multiple workspace packages. It previously lived under:

```text
src/runtime/
```

That path is ambiguous in this repository because `src/` otherwise contains project-like implementation roots such as `src/BlazorJsonVisualizer` and storage-related package roots. A lowercase generic `src/runtime` folder also contributed to engineering-script mistakes: scripts looked for root package files while the actual runtime package root was elsewhere.

A top-level `runtime/` folder would be technically simple, but it would create a separate top-level source tree beside `src/`, which is also awkward for this repository’s current organization.

## Decision

Use the project-style workspace root:

```text
src/BlazorJsonVisualizer.Runtime/
```

The folder contains the TypeScript/Bun browser runtime workspace. It is not a .NET project.

The package split remains:

- `runtime-core`;
- `runtime-dom`;
- `runtime-worker`;
- `runtime-blazor`.

Canonical engineering scripts must use this path as the browser runtime workspace root.

## Consequences

### Positive

- Runtime source remains under `src/` with the other implementation roots.
- The workspace root is explicit and project-like.
- Scripts can use one canonical runtime root instead of probing root-level package files.
- The decision avoids reintroducing npm compatibility while normalizing Bun-only validation.

### Negative

- The folder name looks like a .NET project even though it is a TypeScript workspace.
- Documentation must explicitly state that `src/BlazorJsonVisualizer.Runtime/` is a TypeScript/Bun workspace, not a .NET project.
- Some tooling assumptions may need correction during the move.

## Rejected Alternatives

### Keep `src/runtime/`

Rejected because it is ambiguous beside project-like `src/BlazorJsonVisualizer.*` roots and already contributed to broken script assumptions.

### Move to top-level `runtime/`

Rejected for this repository because it creates a separate top-level implementation tree outside `src/`.

### Use root-level `package.json`

Rejected because it would blur repository-level and runtime-level package ownership and would make root `eng/` scripts depend on package-root probing instead of explicit runtime command routing.

## Authority

This decision is authoritative for the browser runtime workspace root.

## Document Contract

When this decision changes, review:

- `docs/engineering/browser-runtime-workspace.md`
- `docs/engineering/typescript-tools.md`
- `docs/architecture/browser-runtime.md`
- `docs/ENGINEERING.md`
- `eng/restore.sh`
- `eng/frontend-check.sh`
- `eng/frontend-format.sh`
- `eng/check.sh`
- `eng/format.sh`
- `eng/start-samples.sh`
