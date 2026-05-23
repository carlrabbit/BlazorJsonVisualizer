# Build Workflow

## Purpose

Describes the build automation workflow for BlazorJsonVisualizer.

## Command

```sh
./eng/build.sh
```

This command builds all default projects without restoring dependencies. Prerequisites:
1. Run `./eng/restore.sh` first if dependencies are not yet restored.

## CI Trigger

The CI workflow runs `./eng/check.sh` which includes restore and build.

## What is built

- `src/BlazorJsonVisualizer/` — primary Blazor library
- `src/BlazorJsonVisualizer.SampleApp/` — sample application
- TypeScript runtime is built as part of the .NET build pipeline

## Authority

This document is authoritative for the build workflow spec.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/ENGINEERING.md`
- `.github/workflows/ci.yml`
