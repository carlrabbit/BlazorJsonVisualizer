# Command Contract

## Purpose

This document defines the canonical `eng/` commands and validation tiers for BlazorJsonVisualizer. All contributors, CI workflows, and AI agents must use these commands instead of duplicating command logic.

## Validation Tiers

| Tier | Use | Commands |
|---|---|---|
| Focused | Smallest relevant validation for a changed surface. | `./eng/build.sh`, `./eng/frontend-check.sh`, `./eng/samples.sh`, `./eng/public-docs.sh`, targeted documented script usage |
| Tier 1 | Short-running implementation validation. | `./eng/test.sh` |
| Tier 2 | Default completion gate when practical. | `./eng/check.sh` |
| Explicit only | Long-running, release, package, publish, and public API validation. | `./eng/long-running-tests.sh [--fast]`, `./eng/public-api.sh`, `./eng/package-smoke.sh <version>`, `./eng/release-check.sh <version>` |

## Canonical Commands

| Command | Purpose | Default Agent Use |
|---|---|---|
| `./eng/restore.sh` | Restore all dependencies (dotnet restore, bun install). | Focused |
| `./eng/build.sh` | Build default projects without restoring. | Focused |
| `./eng/test.sh` | Run short-running tests only. | Tier 1 |
| `./eng/format.sh` | Apply formatting (dotnet format, biome format). | When requested |
| `./eng/check.sh` | Restore, build, test, and verify formatting/tooling. Default completion gate. | Tier 2 |
| `./eng/frontend-check.sh` | Run TypeScript/Biome checks. | When touching TS/frontend |
| `./eng/frontend-format.sh` | Apply TypeScript/Biome formatting. | When requested |
| `./eng/samples.sh` | Build and validate samples. | When touching samples |
| `./eng/public-docs.sh` | Validate public documentation required files and consistency checks. | When public docs change |
| `./eng/long-running-tests.sh [--fast]` | Run tests marked `TestCategory=Slow`; `--fast` uses minimal data for smoke validation. | Explicit only |
| `./eng/package-smoke.sh <version>` | Test packed packages as a consumer. | Explicit only |
| `./eng/public-api.sh` | Validate intentional public API surface. | Explicit only |
| `./eng/release-check.sh <version>` | Run release-oriented validation without publishing. | Explicit only |

## Test Classification

Short-running tests are small, deterministic tests that complete quickly and have no external dependencies. They may include small parser/tokenizer tests, structural index tests over small snippets, viewport calculation tests, folding/path tests, renderer smoke tests, DTO/protocol contract tests, and small Blazor interop smoke tests.

Long-running tests include stress tests, benchmark runners, huge-document tests, fuzzing harnesses, endurance tests, and large browser automation suites. They must not run automatically unless explicitly requested.

Package smoke tests validate packed artifacts from a consumer perspective. They are excluded from `./eng/test.sh` and `./eng/check.sh` and belong only to explicit package/release validation once packaging maturity changes.

## Agent Rules

- Do not invent commands that are not in this contract.
- Do not embed repository logic in CI workflows; call `eng/` scripts instead.
- Run the smallest relevant validation tier for the change.
- Treat `./eng/check.sh` as Tier 2 and the default completion gate when practical.
- Long-running tests, e2e tests, benchmarks, package smoke tests, public API checks, and release checks must not run through `./eng/test.sh` or default `./eng/check.sh`.
- Run `./eng/frontend-check.sh` when touching TypeScript or frontend files.
- Run `./eng/samples.sh` when touching sample files.
- Run `./eng/public-docs.sh` when touching public docs.
- `./eng/long-running-tests.sh`, `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, `./eng/public-api.sh`, and publish commands are explicit-only.

## Authority

This document is authoritative for:

- canonical command names and their purposes
- validation-tier routing
- short-running, long-running, and package smoke test classification
- agent command usage rules

## Document Contract

When this document changes, review:

- `docs/ENGINEERING.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `eng/check.sh`
- `.github/workflows/ci.yml`
