# TypeScript Guardrail

## Purpose

This guardrail defines TypeScript-specific constraints for BlazorJsonVisualizer.

## Tooling

- Use Bun, not npm.
- Use Biome, not ESLint or Prettier.
- Commit the Bun lockfile (`bun.lock`).
- Use `biome.json` for linting and formatting configuration.

## TypeScript Compiler Options

Use strict TypeScript options where practical:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

## Architecture Conventions

- Keep TypeScript architecture boring.
- Use explicit interfaces.
- Use concrete DTOs.
- Use discriminated unions.
- Use straightforward modules.
- Avoid hidden global state.
- Prefer pure functions and file-based boundaries.
- Avoid long-running watchers unless explicitly needed.
- Heavy dependencies must be isolated behind small adapter modules.

## Module Conventions

- TypeScript tools must have explicit inputs and outputs.
- Do not add framework-heavy build chains.
- Keep JavaScript interop code small, typed, and isolated.
- Optional TypeScript tooling must remain optional and scoped.

## Validation

- Run `./eng/frontend-check.sh` when touching TypeScript or frontend files.
- Run `./eng/frontend-format.sh` to apply Biome formatting.
- Do not run frontend checks as part of `./eng/test.sh` unless explicitly configured.

## Authority

This document is authoritative for:
- TypeScript tooling choices (Bun, Biome)
- TypeScript compiler option requirements
- TypeScript module and architecture conventions

## Document Contract

When this document changes, review:
- `docs/GUARDRAILS.md`
- `docs/engineering/typescript-tools.md`
- `AGENTS.md`
