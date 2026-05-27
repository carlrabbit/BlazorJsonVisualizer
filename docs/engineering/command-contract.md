# Command Contract

## Purpose

This document defines the canonical `eng/` commands for BlazorJsonVisualizer. All contributors, CI workflows, and AI agents must use these commands instead of duplicating command logic.

## Canonical Commands

| Command | Purpose | Default Agent Use |
|---|---|---|
| `./eng/restore.sh` | Restore all dependencies (dotnet restore, bun install). | Yes |
| `./eng/build.sh` | Build default projects without restoring. | Yes |
| `./eng/test.sh` | Run short-running tests only. | Yes |
| `./eng/format.sh` | Apply formatting (dotnet format, biome format). | When requested |
| `./eng/check.sh` | Restore, build, test, and verify formatting/tooling. Completion gate. | Yes |
| `./eng/frontend-check.sh` | Run TypeScript/Biome checks. | When touching TS/frontend |
| `./eng/frontend-format.sh` | Apply TypeScript/Biome formatting. | When requested |
| `./eng/samples.sh` | Build and validate samples. | When touching samples |
| `./eng/public-docs.sh` | Validate public documentation required files and consistency checks. | When public docs change |
| `./eng/package-smoke.sh <version>` | Test packed packages as a consumer. | Explicit only |
| `./eng/public-api.sh` | Validate intentional public API surface. | Explicit or release work |
| `./eng/release-check.sh <version>` | Run release-oriented validation. | Explicit only |

## Agent Rules

- Do not invent commands that are not in this contract.
- Do not embed repository logic in CI workflows; call `eng/` scripts instead.
- `./eng/check.sh` is the default completion gate.
- Long-running tests, e2e tests, benchmarks, and package smoke tests must not run through `./eng/test.sh` or default `./eng/check.sh`.
- Run `./eng/frontend-check.sh` when touching TypeScript or frontend files.
- Run `./eng/samples.sh` when touching sample files.
- `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, and publish commands are explicit-only.

## Authority

This document is authoritative for:
- canonical command names and their purposes
- agent command usage rules

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `eng/check.sh`
- `.github/workflows/ci.yml`
