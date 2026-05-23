# .NET Guardrail

## Purpose

This guardrail defines .NET-specific constraints for BlazorJsonVisualizer.

## SDK and Toolchain

- Pin the .NET SDK version through `global.json`.
- Pin package versions through central package management (`Directory.Packages.props`).
- Use `Directory.Build.props` for shared build configuration.
- Use `NuGet.config` when custom feeds are needed.

## Project Conventions

- Use the solution file for multi-project builds.
- Test projects must reference the tested source project.
- Do not mix production and test code in the same project.
- Blazor is the primary UI integration surface; do not replace it with a separate SPA framework.

## Formatting and Style

- Use `dotnet format` for formatting.
- Use `.editorconfig` for style configuration.
- CI must verify formatting with `dotnet format --verify-no-changes`.

## Test Conventions

- Use TUnit as the test framework.
- Use Microsoft Testing Platform (MTP) for test execution.
- Filter out slow and E2E tests from default test runs with: `--filter "TestCategory!=Slow&TestCategory!=E2E"`
- Benchmarks are not tests; they belong in the `benchmarks/` folder.

## Validation

- `./eng/restore.sh` restores .NET dependencies.
- `./eng/build.sh` builds without restoring.
- `./eng/test.sh` runs short-running tests only.
- `./eng/format.sh` applies formatting.
- `./eng/check.sh` is the default completion gate.

## Authority

This document is authoritative for:
- .NET toolchain pinning requirements
- .NET project conventions
- .NET formatting and style requirements
- .NET test framework selection

## Document Contract

When this document changes, review:
- `docs/GUARDRAILS.md`
- `docs/engineering/dotnet.md`
- `AGENTS.md`
