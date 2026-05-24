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

## Future Optional Commands

These commands are documented but not yet implemented:

| Command | Purpose |
|---|---|
| `./eng/benchmark.sh` | Run BenchmarkDotNet benchmarks (not part of default test run). |
| `./eng/e2e.sh` | Run end-to-end Playwright tests (opt-in only). |
| `./eng/package.sh` | Build NuGet packages. |
| `./eng/site-build.sh` | Build GitHub Pages site. |

## Agent Rules

- Do not invent commands that are not in this contract.
- Do not embed repository logic in CI workflows; call `eng/` scripts instead.
- `./eng/check.sh` is the default completion gate.
- Long-running tests, e2e tests, and benchmarks must not run through `./eng/test.sh` or `./eng/check.sh`.
- Run `./eng/frontend-check.sh` when touching TypeScript or frontend files.
- Run `./eng/samples.sh` when touching sample files.

## Authority

This document is authoritative for:
- canonical command names and their purposes
- agent command usage rules
- the list of future optional commands

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `eng/check.sh`
- `.github/workflows/ci.yml`
