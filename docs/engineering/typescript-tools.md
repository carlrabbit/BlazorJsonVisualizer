# TypeScript Tools Engineering

## Purpose

This document describes the TypeScript tooling setup for BlazorJsonVisualizer.

## Toolchain

- **Runtime/package manager:** Bun, not npm or Node.
- **Linting/formatting:** Biome, not ESLint or Prettier.
- **Lockfile:** `bun.lock`, committed under the runtime workspace root.

## Runtime Workspace Root

The canonical TypeScript browser runtime workspace root is:

```text
src/BlazorJsonVisualizer.Runtime/
```

Do not use repository-root package discovery for runtime validation. Do not use the former `src/runtime/` path.

## Configuration Files

| File | Purpose |
|---|---|
| `src/BlazorJsonVisualizer.Runtime/package.json` | Runtime workspace configuration and script definitions. |
| `src/BlazorJsonVisualizer.Runtime/bun.lock` | Committed Bun lockfile. |
| `src/BlazorJsonVisualizer.Runtime/biome.json` | Biome linting and formatting configuration. |
| `src/BlazorJsonVisualizer.Runtime/tsconfig.base.json` | Base TypeScript compiler options. |

## TypeScript Compiler Options

The runtime TypeScript configuration should keep strict, explicit options such as:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

## Runtime Structure

```text
src/BlazorJsonVisualizer.Runtime/
  runtime-core/      — framework-free TypeScript: document sessions, structural indexes, transactions, protocol types
  runtime-dom/       — DOM renderer, folding controller, viewport DOM, user interaction capture
  runtime-blazor/    — Blazor JS interop facade and host bridge
  runtime-worker/    — worker entry points and later background processing
```


## Runtime Tests

Runtime TypeScript tests live in:

```text
tests/BlazorJsonVisualizer.Runtime.Tests/
```

The runtime workspace `test` script runs those tests with Bun directly. The runtime test root must not have a separate npm-managed package or `package-lock.json`.

## Commands

```sh
# Check TypeScript/Biome/runtime tests
./eng/frontend-check.sh

# Format TypeScript/Biome
./eng/frontend-format.sh
```

The frontend scripts must execute from `src/BlazorJsonVisualizer.Runtime/` and must use Bun only.

## Forbidden Active Tooling

Active runtime and engineering surfaces must not use:

- `npm`;
- `npx`;
- `package-lock.json`;
- npm workspace commands;
- npm install commands;
- direct `node` execution for normal runtime package scripts.

Historical references may remain only in non-authoritative research or migration history when they are clearly not operational guidance.

## Authority

This document is authoritative for:

- TypeScript toolchain selection;
- TypeScript workspace root;
- TypeScript configuration requirements;
- Bun/Biome runtime command expectations.

## Document Contract

When this document changes, review:

- `docs/ENGINEERING.md`
- `docs/engineering/browser-runtime-workspace.md`
- `docs/engineering/command-contract.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
