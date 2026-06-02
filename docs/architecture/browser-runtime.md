# Browser Runtime Architecture

## Package split

The browser runtime workspace root is:

```text
src/BlazorJsonVisualizer.Runtime/
```

It contains the workspace `package.json`, `bun.lock`, Biome configuration, TypeScript base configuration, and these TypeScript workspace packages:

- `runtime-core`: framework-free session/protocol logic.
- `runtime-dom`: DOM mounting and rendering shell.
- `runtime-worker`: worker entry points and later background processing.
- `runtime-blazor`: JS interop facade for Blazor.

## Rule

`runtime-core` must not import DOM, Blazor, or framework-specific modules.

The browser runtime workspace is TypeScript/Bun-based. It is not a .NET project even though it lives under `src/` with a project-style folder name. Runtime tests live outside the workspace at `tests/BlazorJsonVisualizer.Runtime.Tests/` and are invoked by the workspace Bun scripts.

## Blazor asset boundary

`runtime-blazor` produces the browser asset consumed by the Blazor package. Build/copy orchestration belongs to canonical `eng/` scripts and sample launchers, not to ad hoc package-root assumptions.

## Schema work

Schema evaluation may initially run in the main runtime for small documents. Later milestones may move schema validation and metadata resolution into workers.
