# Engineering Guide V3

## Status

Authoritative engineering guide for the default .NET repository profile.

## Purpose

This guide defines an opinionated, AI-agent-friendly engineering setup for a professional repository.

The default stack is:

- .NET 10
- Microsoft Testing Platform (MTP)
- TUnit
- BenchmarkDotNet
- Bun
- Biome

Optional modules cover:

- Blazor
- Playwright
- TypeScript runtime/browser tooling
- NuGet packaging
- samples
- GitHub Pages

This guide defines the concrete engineering substrate:

- repository command contract;
- build, test, format, benchmark, package, release, and site commands;
- toolchain pinning;
- project layout;
- engineering building blocks;
- test classification;
- optional modules;
- agent validation expectations.

## Relationship to Project Setup Guide V4

Project Setup Guide V4 defines the repository knowledge model.

This guide defines the concrete engineering implementation profile.

```text
Project Setup Guide V4 tells the repository how to organize knowledge.
Engineering Guide V3 tells the repository how to build, test, validate, and package.
```

## README rule

Only the root `README.md` is allowed.

Do not create local README files in:

```text
eng/
samples/
site/
tools/
docs/**/
```

Use named documents under `docs/engineering/` instead:

```text
docs/ENGINEERING.md
docs/engineering/dotnet.md
docs/engineering/command-contract.md
docs/engineering/building-blocks.md
docs/engineering/samples.md
docs/engineering/site.md
docs/engineering/typescript-tools.md
docs/engineering/packaging.md
```

## Core principles

### Agent-executable over descriptive

Instructions must be executable or directly checkable.

Prefer:

```text
Run ./eng/check.sh and ensure it exits with code 0.
```

Avoid:

```text
Make sure the project looks clean.
```

### One canonical command per workflow

Agents must not guess which command to run.

Each repository should expose these canonical commands:

```text
./eng/restore.sh
./eng/build.sh
./eng/test.sh
./eng/format.sh
./eng/check.sh
./eng/benchmark.sh
```

Optional modules may add:

```text
./eng/e2e.sh
./eng/frontend-check.sh
./eng/frontend-format.sh
./eng/package.sh
./eng/publish.sh
./eng/site-build.sh
./eng/samples.sh
```

### Building blocks, not one giant template

Repositories start small and add capabilities by applying building blocks.

A block must define:

- block ID;
- purpose;
- when to apply;
- files to create or modify;
- packages or tools to add;
- commands to expose;
- validation command;
- done criteria.

### Tooling must be pinned or explicit

The repository must pin or explicitly define:

- .NET SDK version through `global.json`;
- package versions through central package management;
- JavaScript/TypeScript tooling through `package.json`, lockfile, and `biome.json` when used.

### Optional means absent by default

Blazor, Playwright, TypeScript, NuGet packaging, samples, and GitHub Pages are optional modules.

Do not add them unless the repository needs them.

## Required repository layout

```text
/
├─ .config/
│  └─ dotnet-tools.json
├─ .github/
│  ├─ workflows/
│  ├─ instructions/
│  └─ copilot-instructions.md
├─ artifacts/
│  └─ .gitkeep
├─ docs/
│  ├─ ENGINEERING.md
│  ├─ GUARDRAILS.md
│  ├─ WORKFLOWS.md
│  ├─ engineering/
│  ├─ guardrails/
│  └─ workflows/
├─ eng/
│  ├─ restore.sh
│  ├─ build.sh
│  ├─ test.sh
│  ├─ format.sh
│  ├─ check.sh
│  ├─ benchmark.sh
│  ├─ common.sh
│  ├─ ci/
│  ├─ local/
│  └─ templates/
├─ src/
├─ tests/
│  ├─ unit/
│  └─ integration/
├─ benchmarks/
├─ samples/
├─ site/
├─ packages/
├─ tools/
├─ .editorconfig
├─ .gitignore
├─ AGENTS.md
├─ Directory.Build.props
├─ Directory.Packages.props
├─ NuGet.config
├─ global.json
└─ README.md
```

Optional modules may add:

```text
tests/e2e/
web/
package.json
bun.lock
biome.json
tsconfig.json
playwright.config.ts
```

## Folder ownership

| Path | Purpose |
|---|---|
| `src/` | Production source projects. |
| `tests/unit/` | Fast unit tests. No network, no database, no browser. |
| `tests/integration/` | Integration tests. May use databases, containers, test hosts, or real infrastructure substitutes. |
| `tests/e2e/` | Optional browser/system tests. Requires Playwright block. |
| `benchmarks/` | BenchmarkDotNet projects only. Not part of normal test execution. |
| `eng/` | Canonical repository commands and reusable engineering scripts. Agents must use these. |
| `eng/ci/` | CI-only helper scripts or workflow fragments. |
| `eng/local/` | Local developer utilities not required in CI. |
| `eng/templates/` | Reusable file templates for generators or agents. |
| `packages/` | Local NuGet packages or packaging output when package publishing is enabled. |
| `samples/` | Small runnable usage examples. No local README. Document in `docs/engineering/samples.md`. |
| `site/` | Optional static project website source for GitHub Pages. No local README. Document in `docs/engineering/site.md`. |
| `tools/` | Repository-local helper tools, generators, scripts, and development utilities. No local README. |
| `docs/` | Human- and agent-readable engineering documentation. |
| `artifacts/` | Local/generated outputs. Usually ignored except for `.gitkeep`. |

## `eng/` folder design

The `eng/` folder is the canonical engineering entry point for humans, CI, and AI agents.

Top-level scripts are the public engineering API. Nested scripts are implementation details.

Top-level scripts should:

- be short;
- compose lower-level helpers;
- avoid duplicated logic;
- avoid hidden side effects;
- fail fast;
- use deterministic command ordering.

CI workflows should call `eng/` scripts instead of embedding repository logic directly.

Scripts should use POSIX shell where practical and work in Linux containers, GitHub Actions, and ChromeOS Linux environments.

## Required command contract

### `eng/restore.sh`

```sh
#!/usr/bin/env sh
set -eu

dotnet restore

if [ -f package.json ]; then
  bun install --frozen-lockfile
fi
```

### `eng/build.sh`

```sh
#!/usr/bin/env sh
set -eu

dotnet build --no-restore
```

### `eng/test.sh`

```sh
#!/usr/bin/env sh
set -eu

dotnet test --no-build --configuration Debug --filter "TestCategory!=Slow&TestCategory!=E2E"
```

If the selected test framework or adapter does not use `TestCategory`, the repository must document and implement the equivalent filter.

### `eng/format.sh`

```sh
#!/usr/bin/env sh
set -eu

dotnet format

if [ -f biome.json ]; then
  bun run format
fi
```

### `eng/check.sh`

```sh
#!/usr/bin/env sh
set -eu

./eng/restore.sh
./eng/build.sh
./eng/test.sh

dotnet format --verify-no-changes

if [ -f biome.json ]; then
  bun run check
fi
```

### `eng/benchmark.sh`

```sh
#!/usr/bin/env sh
set -eu

dotnet run --configuration Release --project benchmarks/PROJECT_NAME.Benchmarks
```

Replace `PROJECT_NAME.Benchmarks` with the actual benchmark project name when the benchmark block is applied.

## Building block overview

| Block | Name | Required | Purpose |
|---|---|---:|---|
| BB00 | Repository Base | Yes | Common repository skeleton and command contract. |
| BB01 | .NET Solution | Yes | Solution, source project, test project structure. |
| BB02 | Shared Build Configuration | Yes | `global.json`, `Directory.Build.props`, central package management. |
| BB03 | EditorConfig and C# Style | Yes | Opinionated formatting, analyzers, and style rules. |
| BB04 | MTP + TUnit Unit Tests | Yes | Fast unit testing foundation. |
| BB05 | Test Guardrails | Yes | Fast/slow/integration/e2e separation. |
| BB06 | BenchmarkDotNet | Recommended | Dedicated benchmark project. |
| BB07 | GitHub Actions CI | Recommended | Build/test/check automation. |
| BB08 | Agent Instructions | Yes | Repository-local operating instructions for AI agents. |
| BB09 | Bun + Biome | Optional | TypeScript/JavaScript tooling. |
| BB10 | Blazor Module | Optional | Blazor application project. |
| BB11 | Playwright E2E Module | Optional | Browser automation tests. |
| BB12 | TypeScript Runtime Tools | Optional | Self-authored TypeScript scripts/runtime utilities. |
| BB13 | Documentation Skeleton | Yes | Minimal docs required for maintainability. |
| BB14 | NuGet Packaging | Optional | NuGet package generation and publishing conventions. |
| BB15 | Samples | Optional | Runnable examples that demonstrate supported usage patterns. |
| BB16 | GitHub Copilot | Optional | Repository instructions for Copilot Chat, coding agent, and code review. |
| BB17 | OpenAI Codex | Optional | Repository instructions and command contracts optimized for Codex. |
| BB18 | GitHub Pages Website | Optional | Static project website deployed through GitHub Pages. |

## Selected building blocks for BlazorJsonVisualizer

BlazorJsonVisualizer should apply at least:

```text
BB00 Repository Base
BB01 .NET Solution
BB02 Shared Build Configuration
BB03 EditorConfig and C# Style
BB04 MTP + TUnit Unit Tests
BB05 Test Guardrails
BB07 GitHub Actions CI
BB08 Agent Instructions
BB09 Bun + Biome
BB10 Blazor Module
BB12 TypeScript Runtime Tools
BB13 Documentation Skeleton
BB15 Samples
BB16 GitHub Copilot
BB17 OpenAI Codex
```

Likely later additions:

```text
BB06 BenchmarkDotNet
BB11 Playwright E2E Module
BB14 NuGet Packaging
BB18 GitHub Pages Website
```

## Important building block rules

- Do not create non-root README files.
- Samples live under `samples/` and are documented in `docs/engineering/samples.md`.
- TypeScript tooling uses Bun and Biome, not npm, ESLint, or Prettier.
- Blazor is the primary UI integration surface, but TypeScript runtime code remains a first-class subsystem.
- E2E tests are opt-in and do not run through `eng/test.sh`.
- Benchmarks are not tests.
- CI uses `./eng/check.sh`.
- Agents must run the smallest relevant validation set and must not run long-running tests unless explicitly requested.

## BB09 — Bun + Biome summary

Apply when the repository needs TypeScript runtime scripts, browser TypeScript assets, Blazor JavaScript interop source files, Playwright tests, or frontend linting/formatting.

Required files:

```text
package.json
biome.json
tsconfig.json
docs/guardrails/languages/typescript.md
```

Required conventions:

- Use Bun, not npm.
- Use Biome, not ESLint/Prettier.
- Commit the Bun lockfile.
- Keep TypeScript optional and scoped.
- Prefer self-authored TypeScript over framework-heavy build chains.

Recommended TS compiler options include:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

## BB10 — Blazor Module summary

Apply when the repository needs a web UI implemented primarily in .NET/Blazor.

Required conventions:

- Blazor is the primary UI framework when this block is applied.
- Do not add a separate SPA framework unless explicitly required.
- JavaScript interop code should be small, typed, and isolated.
- If TypeScript is used for browser interop, also apply BB09.

## BB12 — TypeScript Runtime Tools summary

Apply when the repository needs TypeScript for graph layout processing, code generation, JSON/schema transformations, browser-adjacent asset generation, or local development utilities.

Required conventions:

- TypeScript tools must have explicit inputs and outputs.
- Prefer pure functions and file-based boundaries.
- Avoid hidden global state.
- Avoid long-running watchers unless explicitly needed.
- Heavy dependencies must be isolated behind small adapter modules.

## BB15 — Samples summary

Samples are small runnable examples that demonstrate intended use. They are executable documentation, not tests, benchmarks, or production applications.

Required conventions:

- Samples must be small.
- Samples must compile.
- Samples must reference source projects or published packages intentionally.
- Samples must not contain hidden test assertions.
- Samples must not become a second application architecture.
- Samples must not be required for normal production builds unless explicitly documented.
- Samples should prefer clarity over completeness.

If samples are part of the supported surface, add:

```text
eng/samples.sh
```

## BB16 — GitHub Copilot summary

Repository-wide Copilot instructions live in `.github/copilot-instructions.md`.

Path-specific instructions live under `.github/instructions/` when needed.

Copilot instructions must point to `AGENTS.md`, `docs/ENGINEERING.md`, and `docs/GUARDRAILS.md`, and must not duplicate the whole setup guide.

## BB17 — OpenAI Codex summary

`AGENTS.md` is the primary Codex instruction file.

The first validation command must be:

```sh
./eng/check.sh
```

Long-running or expensive commands must be explicitly marked.

Cloud-safe and local-only workflows must be distinguished.

## Agent repository creation workflow

An AI agent creating or upgrading a repository should:

1. Determine required blocks.
2. Create or update the repository skeleton.
3. Create/update .NET solution and projects.
4. Add shared build configuration.
5. Add `.editorconfig`.
6. Add TUnit/MTP test projects.
7. Add optional Bun/Biome tooling only if selected.
8. Add optional Blazor/Playwright modules only if selected.
9. Add docs and agent instructions.
10. Confirm no non-root README files exist.
11. Run `./eng/check.sh`.
12. Fix all failures or document exact failures.

Agents must not declare the repository complete until `./eng/check.sh` succeeds or the failure is explicitly documented with the exact failing command and output summary.

## Completion checklist

A generated or upgraded base repository is complete only when all applicable items are true:

- `global.json` exists and pins .NET 10 SDK.
- `Directory.Build.props` exists.
- `Directory.Packages.props` exists.
- `.editorconfig` exists.
- `AGENTS.md` exists.
- Root `README.md` lists canonical commands.
- No non-root README files exist.
- `docs/ENGINEERING.md` exists.
- `docs/GUARDRAILS.md` exists.
- `docs/guardrails/testing.md` exists.
- `docs/guardrails/implementation.md` exists.
- `docs/engineering/dotnet.md` exists.
- `eng/` scripts exist and are executable.
- Solution builds.
- Unit tests run through MTP/TUnit where applicable.
- Default test command excludes slow/e2e tests.
- Bun/Biome files exist because TypeScript tooling is selected.
- Blazor project exists because the Blazor module is selected.
- Samples exist because the samples module is selected.
- GitHub Copilot instructions exist because the Copilot module is selected.
- Codex-safe guidance exists because the Codex module is selected.
- `./eng/check.sh` succeeds or failure is documented.

## Upgrade guide from Engineering Guide V2

1. Move the guide into docs as `docs/engineering/dotnet.md` and store old versions as research if needed.
2. Remove local README files and convert them to named docs.
3. Replace `docs/TESTING.md` with `docs/guardrails/testing.md`, workflow specs, and engineering command-contract references.
4. Replace `docs/PACKAGING.md` with `docs/engineering/packaging.md`, `docs/workflows/package.md`, and `docs/workflows/release.md` when packaging is selected.
5. Make `docs/ENGINEERING.md` an index; detailed engineering profile belongs in `docs/engineering/dotnet.md`.
6. Update `AGENTS.md` and Copilot instructions to include engineering and guardrail routing.
7. Align issue templates with `docs/ENGINEERING.md`, `docs/GUARDRAILS.md`, and relevant TBPs.

## Final model

Engineering Guide V3 keeps:

- canonical `eng/` scripts;
- explicit command contracts;
- building blocks;
- .NET 10 setup;
- MTP + TUnit;
- BenchmarkDotNet;
- Bun + Biome;
- optional Blazor and Playwright;
- test guardrails;
- GitHub Actions using `eng/check.sh`;
- agent-friendly validation.

It changes documentation structure to match Project Setup Guide V4:

- no non-root README files;
- engineering docs under `docs/engineering/`;
- guardrails under `docs/guardrails/`;
- workflow intent under `docs/workflows/`;
- root README only;
- `docs/ENGINEERING.md` as the engineering index.
