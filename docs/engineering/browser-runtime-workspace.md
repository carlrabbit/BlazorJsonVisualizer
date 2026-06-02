# Browser Runtime Workspace Engineering

## Purpose

This document defines the canonical TypeScript browser runtime workspace layout and engineering-script expectations for BlazorJsonVisualizer.

## Authority

This document is authoritative for:

- browser runtime workspace root;
- browser runtime package split;
- Bun-only runtime package/tool execution;
- runtime test workspace placement;
- `eng/` script expectations for runtime restore, build, check, format, and sample asset generation.

## Runtime Workspace Root

The canonical browser runtime workspace root is:

```text
src/BlazorJsonVisualizer.Runtime/
```

This root is intentionally project-like so it can sit beside other `src/BlazorJsonVisualizer.*` implementation areas without using a lowercase generic `src/runtime` folder.

The runtime workspace is a TypeScript/Bun workspace, not a .NET project.

## Expected Layout

```text
src/BlazorJsonVisualizer.Runtime/
  package.json
  bun.lock
  biome.json
  tsconfig.base.json
  runtime-core/
  runtime-dom/
  runtime-worker/
  runtime-blazor/
```

Runtime tests should be placed in one of the following explicitly documented locations:

```text
src/BlazorJsonVisualizer.Runtime/tests/
```

or:

```text
tests/BlazorJsonVisualizer.Runtime.Tests/
```

The implementation must choose one location and keep package scripts, engineering commands, and docs consistent with that choice.

## Package Split

| Package | Responsibility |
|---|---|
| `runtime-core` | Framework-free TypeScript: document sessions, structural indexes, transactions, protocol types, navigation, viewport logic. |
| `runtime-dom` | DOM rendering, folding controller, viewport DOM, user interaction capture. |
| `runtime-worker` | Worker entry points and later background processing. |
| `runtime-blazor` | Blazor JS interop facade and host bridge. |

`runtime-core` must not import DOM, Blazor, or framework-specific modules.

## Toolchain Rules

The runtime workspace uses:

- Bun for package management, workspace scripts, and script execution;
- Biome for formatting and linting;
- TypeScript compiler configuration from the workspace root.

The runtime workspace must not use:

- `npm`;
- `npx`;
- `package-lock.json`;
- npm workspace commands;
- npm install commands;
- direct `node` execution for normal TypeScript/runtime package scripts.

Use Bun equivalents instead.

## Engineering Script Contract

Canonical engineering scripts must route runtime operations through this workspace root.

Expected behavior:

- `./eng/restore.sh` runs Bun install in `src/BlazorJsonVisualizer.Runtime/`.
- `./eng/frontend-check.sh` runs runtime check/build/test commands from `src/BlazorJsonVisualizer.Runtime/`.
- `./eng/frontend-format.sh` runs runtime formatting from `src/BlazorJsonVisualizer.Runtime/`.
- `./eng/check.sh` invokes the canonical frontend check and must not duplicate root-level `biome.json` detection.
- `./eng/format.sh` invokes the canonical frontend format command when TypeScript formatting is expected.
- `eng/start-samples.sh` builds runtime assets from this root and copies the `runtime-blazor` bundle into the Blazor package wwwroot location.

If the runtime workspace exists and Bun is missing, frontend commands must fail clearly. They must not fall back to npm or npx.

## Tooling Guard

The repository should include a lightweight guard that fails when active runtime/engineering surfaces reintroduce npm/npx/package-lock usage.

The guard should check active source, runtime, tests, and `eng/` files. It may exclude `docs/research/` and historical documentation when documented.

The guard must use shell, dotnet, or Bun/TypeScript. It must not use inline Python.

## Document Contract

When this document changes, review:

- `docs/engineering/typescript-tools.md`
- `docs/engineering/command-contract.md`
- `docs/ENGINEERING.md`
- `docs/architecture/browser-runtime.md`
- `docs/decisions/0008-use-src-blazorjsonvisualizer-runtime-for-browser-runtime-workspace.md`
- `eng/restore.sh`
- `eng/frontend-check.sh`
- `eng/frontend-format.sh`
- `eng/check.sh`
- `eng/format.sh`
- `eng/start-samples.sh`
