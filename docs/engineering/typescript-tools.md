# TypeScript Tools Engineering

## Purpose

This document describes the TypeScript tooling setup for BlazorJsonVisualizer.

## Toolchain

- **Runtime:** Bun (not npm or Node)
- **Linting/Formatting:** Biome (not ESLint or Prettier)
- **Lockfile:** `bun.lock` (committed)

## Configuration Files

| File | Purpose |
|---|---|
| `package.json` | Root workspace configuration and script definitions. |
| `bun.lock` | Committed Bun lockfile. |
| `biome.json` | Biome linting and formatting configuration. |
| `tsconfig.base.json` | Base TypeScript compiler options. |

## TypeScript Compiler Options

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
src/runtime/
  runtime-core/      — framework-free TypeScript: document sessions, structural indexes, transactions, protocol types
  runtime-dom/       — DOM renderer, folding controller
  runtime-blazor/    — Layer 1 Blazor host
  runtime-worker/    — worker utilities
```

## Commands

```sh
# Check TypeScript/Biome
./eng/frontend-check.sh

# Format TypeScript/Biome
./eng/frontend-format.sh
```

## Migration Note

The TypeScript tooling is transitioning from npm to Bun. During the transition:
- Existing `package.json` scripts remain functional.
- New commands use Bun.
- `./eng/frontend-check.sh` uses Bun when `bun.lock` is present, otherwise falls back to npm.

## Authority

This document is authoritative for:
- TypeScript toolchain selection (Bun, Biome)
- TypeScript configuration requirements

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `AGENTS.md`
- `AGENTS.md`
