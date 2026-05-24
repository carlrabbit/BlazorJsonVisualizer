# .NET Engineering

## Purpose

This document describes the .NET build, test, format, and project conventions for BlazorJsonVisualizer.

## Projects

| Project | Path | Purpose |
|---|---|---|
| BlazorJsonVisualizer | `src/BlazorJsonVisualizer/` | Primary Blazor component library. |
| BlazorJsonVisualizer.SampleApp | `src/BlazorJsonVisualizer.SampleApp/` | Sample Blazor application host. |
| Additional samples | `samples/` | Runnable usage examples. |

## Build Commands

```sh
# Restore dependencies
./eng/restore.sh

# Build all projects
./eng/build.sh

# Run short-running tests
./eng/test.sh

# Apply formatting
./eng/format.sh

# Full check (restore + build + test + format verify)
./eng/check.sh
```

## Test Framework

- TUnit for test authoring.
- Microsoft Testing Platform (MTP) for test execution.
- Filter for default test runs: `--filter "TestCategory!=Slow&TestCategory!=E2E"`

## Shared Build Configuration

- `global.json` pins the .NET SDK version.
- `Directory.Build.props` provides shared MSBuild properties.
- `Directory.Packages.props` provides central package version management.

## Formatting

- `dotnet format` applies formatting.
- CI verifies formatting with `dotnet format --verify-no-changes`.
- `.editorconfig` controls style rules.

## Authority

This document is authoritative for:
- .NET project list and paths
- .NET build and test command details

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `docs/guardrails/languages/dotnet.md`
