# Engineering Guide V4

## Status

Authoritative engineering guide for the default .NET repository profile.

## Purpose

This guide defines an opinionated, AI-agent-friendly engineering setup for professional .NET repositories that may publish NuGet packages and public documentation.

Version 4 extends Engineering Guide V3 with:

- public documentation building block;
- public documentation validation command;
- package smoke testing;
- public API validation;
- release readiness command;
- user-facing documentation checks for NuGet libraries preparing for version 1.0;
- upgrade instructions from V3 to V4.

The default stack remains:

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
- GitHub Copilot
- OpenAI Codex
- GitHub Pages
- public documentation
- release readiness

This guide defines the concrete engineering substrate: repository command contract, build/test/format/benchmark/package/release/documentation validation commands, toolchain pinning, project layout, engineering building blocks, test classification, package validation, public API validation, optional modules, and agent validation expectations.

## Relationship to Project Setup Guide V5

Project Setup Guide V5 defines the repository knowledge model.

Engineering Guide V4 defines the concrete engineering implementation profile.

```text
Project Setup Guide V5 tells the repository how to organize knowledge.
Engineering Guide V4 tells the repository how to build, test, validate, package, document, and release.
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
public-docs/**/
```

Use named documents instead:

```text
docs/ENGINEERING.md
docs/PUBLIC-DOCS.md
docs/engineering/command-contract.md
docs/engineering/samples.md
docs/engineering/site.md
docs/engineering/typescript-tools.md
public-docs/getting-started.md
public-docs/nuget/package-readme.md
public-docs/samples/getting-started.md
```

## Core principles

### Agent-executable over descriptive

Instructions must be executable or directly checkable.

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

Package and release capable repositories may add:

```text
./eng/package.sh
./eng/publish.sh
./eng/package-smoke.sh
./eng/public-api.sh
./eng/public-docs.sh
./eng/release-check.sh
```

Optional modules may add:

```text
./eng/e2e.sh
./eng/frontend-check.sh
./eng/frontend-format.sh
./eng/samples.sh
./eng/site-build.sh
```

### Fast default, explicit release validation

`./eng/check.sh` is the fast development gate.

It should stay safe for local development, CI pull requests, and AI-agent validation.

`./eng/release-check.sh <version>` is the release gate.

It may run package validation, smoke tests, samples, public API checks, and public documentation checks.

### Building blocks, not one giant template

Repositories start small and add capabilities by applying building blocks. A block must define block ID, purpose, when to apply, files to create or modify, packages or tools to add, commands to expose, validation command, and done criteria.

### Tooling must be pinned or explicit

The repository must pin or explicitly define .NET SDK version through `global.json`, package versions through central package management, and JavaScript/TypeScript tooling through `package.json`, `bun.lock`, and `biome.json` when used.

### Optional means absent by default

Blazor, Playwright, TypeScript, NuGet packaging, samples, GitHub Pages, public documentation, and release-readiness scripts are applied only when the repository needs them.

For NuGet libraries preparing for version 1.0, public documentation and release readiness are required.

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
│  ├─ PUBLIC-DOCS.md
│  ├─ WORKFLOWS.md
│  ├─ engineering/
│  ├─ guardrails/
│  └─ workflows/
├─ public-docs/
├─ eng/
├─ src/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ package-smoke/
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

## Folder ownership

| Path | Purpose |
|---|---|
| `src/` | Production source projects. |
| `tests/unit/` | Fast unit tests. No network, no database, no browser. |
| `tests/integration/` | Integration tests. May use databases, containers, test hosts, or real infrastructure substitutes. |
| `tests/package-smoke/` | Tests that consume packed packages from local artifacts. Required for NuGet release readiness. |
| `tests/e2e/` | Optional browser/system tests. Requires Playwright block. |
| `benchmarks/` | BenchmarkDotNet projects only. Not part of normal test execution. |
| `eng/` | Canonical repository commands and reusable engineering scripts. Agents must use these. |
| `packages/` | Local NuGet packages or packaging output when package publishing is enabled. |
| `samples/` | Small runnable examples. No local README. Document in `docs/engineering/samples.md` and `public-docs/samples/`. |
| `site/` | Optional static project website source or generated site shell. No local README. Document in `docs/engineering/site.md`. |
| `tools/` | Repository-local helper tools, generators, scripts, and development utilities. No local README. |
| `docs/` | Internal authoritative engineering and semantic documentation. |
| `public-docs/` | Public consumer-facing documentation source. |
| `artifacts/` | Local/generated outputs. Usually ignored except for `.gitkeep`. |

## `eng/` folder design

The `eng/` folder is the canonical engineering entry point for both humans and AI agents. Top-level scripts are the public engineering API. Nested scripts are implementation details. CI workflows should call `eng/` scripts instead of embedding repository logic directly.

Scripts should use POSIX shell where practical, avoid unnecessary Bash-specific features, avoid machine-local assumptions, work in Linux containers/GitHub Actions/ChromeOS Linux environments, and fail clearly when required tools or secrets are missing.

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

dotnet test --no-build --configuration Debug --filter "TestCategory!=Slow&TestCategory!=E2E&TestCategory!=PackageSmoke"
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

### Release-oriented commands

Package/release repositories may add:

```text
./eng/package.sh <version>
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/public-docs.sh
./eng/release-check.sh <version>
```

`eng/release-check.sh <version>` should run `eng/check.sh`, Release build, package generation, package smoke tests, samples validation, public API validation, and public documentation validation. It must not publish.

## Building block overview

| Block | Name | Required | Purpose |
|---|---|---:|---|
| BB00 | Repository Base | Yes | Common repository skeleton and command contract. |
| BB01 | .NET Solution | Yes | Solution, source project, test project structure. |
| BB02 | Shared Build Configuration | Yes | `global.json`, `Directory.Build.props`, central package management. |
| BB03 | EditorConfig and C# Style | Yes | Opinionated formatting, analyzers, and style rules. |
| BB04 | MTP + TUnit Unit Tests | Yes | Fast unit testing foundation. |
| BB05 | Test Guardrails | Yes | Fast/slow/integration/e2e/package-smoke separation. |
| BB06 | BenchmarkDotNet | Recommended | Dedicated benchmark project. |
| BB07 | GitHub Actions CI | Recommended | Build/test/check automation. |
| BB08 | Agent Instructions | Yes | Repository-local operating instructions for AI agents. |
| BB09 | Bun + Biome | Optional | TypeScript/JavaScript tooling. |
| BB10 | Blazor Module | Optional | Blazor application project. |
| BB11 | Playwright E2E Module | Optional | Browser automation tests. |
| BB12 | TypeScript Runtime Tools | Optional | Self-authored TypeScript scripts/runtime utilities. |
| BB13 | Documentation Skeleton | Yes | Minimal docs required for maintainability. |
| BB14 | NuGet Packaging | Required for NuGet libraries | NuGet package generation and publishing conventions. |
| BB15 | Samples | Recommended for public packages | Runnable examples that demonstrate supported usage patterns. |
| BB16 | GitHub Copilot | Optional | Repository instructions for Copilot. |
| BB17 | OpenAI Codex | Optional | Repository instructions optimized for Codex. |
| BB18 | GitHub Pages Website | Optional | Static project website deployed through GitHub Pages. |
| BB19 | Public Documentation | Required for public packages before 1.0 | Consumer-facing documentation source and validation. |
| BB20 | Release Readiness | Required for public packages before 1.0 | Release gate, package smoke tests, public API checks, public docs checks. |

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
BB19 Public Documentation
```

Likely later additions when public packages are prepared for release:

```text
BB06 BenchmarkDotNet
BB11 Playwright E2E Module
BB14 NuGet Packaging
BB18 GitHub Pages Website
BB20 Release Readiness
```

## Important building block rules

- Do not create non-root README files.
- Samples live under `samples/` and are documented in `docs/engineering/samples.md` and `public-docs/samples/`.
- TypeScript tooling uses Bun and Biome, not npm, ESLint, or Prettier.
- Blazor is the primary UI integration surface, but TypeScript runtime code remains a first-class subsystem.
- E2E tests are opt-in and do not run through `eng/test.sh`.
- Package smoke tests are release-gate only and do not run through `eng/test.sh`.
- Benchmarks are not tests.
- CI uses `./eng/check.sh`.
- Agents must run the smallest relevant validation set and must not run long-running tests unless explicitly requested.

## BB09 — Bun + Biome summary

Apply when the repository needs TypeScript runtime scripts, browser TypeScript assets, Blazor JavaScript interop source files, Playwright tests, frontend linting/formatting, or documentation tooling that explicitly requires TypeScript.

Required conventions:

- Use Bun, not npm.
- Use Biome, not ESLint/Prettier.
- Commit the Bun lockfile.
- Keep TypeScript optional and scoped.
- Prefer self-authored TypeScript over framework-heavy build chains.

Recommended TypeScript compiler options include `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `verbatimModuleSyntax`.

## BB10 — Blazor Module summary

Apply when the repository needs a web UI implemented primarily in .NET/Blazor.

Required conventions:

- Blazor is the primary UI framework when this block is applied.
- Do not add a separate SPA framework unless explicitly required.
- JavaScript interop code should be small, typed, and isolated.
- If TypeScript is used for browser interop, also apply BB09.

## BB14 — NuGet Packaging summary

Apply when the repository produces reusable libraries distributed as NuGet packages. For NuGet libraries preparing for version 1.0, this block is required.

Required conventions:

- Packages are generated only through `eng/package.sh`.
- Publishing is explicit and never part of normal CI validation.
- Package output goes to `artifacts/nuget` or `packages/`, as documented.
- Package metadata should be centralized where practical.
- Public packages should include source link and symbol packages.
- Public packages should include a package README.
- NuGet package README source should live under `public-docs/nuget/`.

## BB15 — Samples summary

Samples are executable documentation. They are small runnable examples that demonstrate intended use.

Required conventions:

- Samples must be small.
- Samples must compile.
- Samples must reference public packages or public APIs intentionally.
- Release-oriented samples should consume packed packages when practical.
- Samples must not contain hidden test assertions.
- Samples must not become a second application architecture.
- Sample documentation lives in `docs/engineering/samples.md` and `public-docs/samples/`.
- Do not create `samples/README.md`.

## BB19 — Public Documentation summary

Apply when the repository produces a NuGet package, public API, source generator, CLI, web API, public website, or externally consumed artifact. For NuGet libraries preparing for version 1.0, this block is required.

Files to create:

```text
docs/PUBLIC-DOCS.md
docs/tbps/public-documentation-update.md
docs/engineering/public-documentation.md
public-docs/getting-started.md
public-docs/installation.md
public-docs/concepts.md
public-docs/packages.md
public-docs/samples.md
public-docs/diagnostics.md
public-docs/versioning.md
public-docs/release-notes.md
public-docs/api/
public-docs/diagnostics/
public-docs/guides/
public-docs/nuget/
public-docs/samples/
public-docs/website/
eng/public-docs.sh
```

Required conventions:

- Public docs live in `public-docs/`.
- Internal docs live in `docs/`.
- `docs/PUBLIC-DOCS.md` is the authority for public documentation synchronization.
- Do not create README files under `public-docs/`.
- The root `README.md` remains the first-contact user document.
- NuGet package README content must come from `public-docs/nuget/`.
- Diagnostics must be documented by diagnostic ID.
- Samples must be documented from the user perspective.
- Release notes must describe externally visible changes.
- Public docs must use canonical terminology.
- Public docs must not copy internal specs verbatim.

## BB20 — Release Readiness summary

Apply when the repository publishes NuGet packages, public APIs, source generators, analyzers, tools, websites, or release notes. For NuGet libraries preparing for version 1.0, this block is required.

Files to create:

```text
eng/release-check.sh
eng/package-smoke.sh
eng/public-api.sh
docs/engineering/release-readiness.md
docs/workflows/release-check.md
tests/package-smoke/
```

Required validation flow:

```text
1. ./eng/check.sh
2. dotnet build -c Release
3. ./eng/package.sh <version>
4. ./eng/package-smoke.sh <version>
5. ./eng/samples.sh
6. ./eng/public-api.sh
7. ./eng/public-docs.sh
```

Release checks validate packages, public API, samples, and public docs. Release checks must not publish.

## Agent repository creation workflow

An AI agent creating or upgrading a repository should determine required blocks, create/update repository skeleton, create/update .NET solution and projects, add shared build configuration, add `.editorconfig`, add TUnit/MTP test projects, add optional Bun/Biome tooling only if selected, add optional Blazor/Playwright modules only if selected, add packaging/samples/public docs/release readiness if selected or required, add docs and agent instructions, confirm no non-root README files exist, run `./eng/check.sh`, and run `./eng/release-check.sh <version>` for release-ready package work.

Agents must not declare the repository complete until the applicable validation command succeeds or the failure is explicitly documented with the exact failing command and output summary.

## Completion checklist

A generated base repository is complete only when applicable items are true:

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
- Default test command excludes slow/e2e/package-smoke tests.
- Bun/Biome files exist only if BB09 was selected.
- Blazor project exists only if BB10 was selected.
- Samples exist only if BB15 was selected.
- Public documentation exists if BB19 was selected.
- Release readiness commands exist if BB20 was selected.
- `./eng/check.sh` succeeds.
- `./eng/release-check.sh <version>` succeeds when release readiness applies.

## Upgrade guide from Engineering Guide V3

1. Add the public documentation block: `docs/PUBLIC-DOCS.md`, `docs/engineering/public-documentation.md`, `public-docs/`, and `eng/public-docs.sh`.
2. Add the release readiness block: `docs/engineering/release-readiness.md`, `docs/workflows/release-check.md`, `eng/release-check.sh`, `eng/package-smoke.sh`, `eng/public-api.sh`, and `tests/package-smoke/`.
3. Extend command contract with `./eng/public-docs.sh`, `./eng/package-smoke.sh`, `./eng/public-api.sh`, and `./eng/release-check.sh <version>`.
4. Update `docs/guardrails/testing.md` to add `PackageSmoke` as release-gate-only.
5. Update `docs/engineering/packaging.md` with package README, package smoke tests, release gate, and package metadata synchronization.
6. Add public API validation via `./eng/public-api.sh` and an intentional public API baseline strategy.
7. Update samples documentation under `docs/engineering/samples.md` and `public-docs/samples/`.
8. Update website documentation if GitHub Pages is used.
9. Make root README user-first for public packages.
10. Add public documentation impact sections to issue templates.
11. Add or update `docs/workflows/public-docs.md`, `docs/workflows/release-check.md`, and `docs/workflows/release.md`.
12. Store Engineering Guide V3 as `docs/research/engineering-guide-v3.md` if history is needed.

## Final V4 model

Engineering Guide V4 keeps the strong parts of V3 and adds the release-oriented surface needed for public NuGet libraries:

- `public-docs/` as consumer-facing documentation source;
- `docs/PUBLIC-DOCS.md` as synchronization authority;
- `eng/public-docs.sh` for public documentation validation;
- `eng/package-smoke.sh` for packed-package consumer validation;
- `eng/public-api.sh` for public API control;
- `eng/release-check.sh` as the release gate;
- BB19 Public Documentation;
- BB20 Release Readiness.
