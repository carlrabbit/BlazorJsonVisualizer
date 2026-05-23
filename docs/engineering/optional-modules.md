# Optional Modules

## Purpose

This document describes optional engineering modules available for BlazorJsonVisualizer.

Optional modules are not required for the default build, test, and validation flow. They are activated only when a milestone explicitly selects them.

## Active Optional Modules

### BB09 — Bun + Biome (TypeScript Tooling)

**Status:** Active

Required files:
- `package.json`
- `bun.lock`
- `biome.json`
- `tsconfig.json` (or `tsconfig.base.json`)
- `docs/guardrails/languages/typescript.md`

Commands:
- `./eng/frontend-check.sh` — Run Biome checks.
- `./eng/frontend-format.sh` — Apply Biome formatting.

### BB10 — Blazor Module

**Status:** Active

Blazor is the primary UI integration surface. JavaScript interop code is small, typed, and isolated.

### BB12 — TypeScript Runtime Tools

**Status:** Active

The TypeScript browser runtime is a first-class subsystem under `src/runtime/`.

### BB15 — Samples

**Status:** Active

Sample projects live under `samples/`. See `docs/engineering/samples.md`.

## Deferred Optional Modules

### BB06 — BenchmarkDotNet

**Status:** Deferred

Benchmarks belong in `benchmarks/`. The `./eng/benchmark.sh` command will be added when this module is activated.

### BB11 — Playwright E2E Module

**Status:** Deferred

E2E tests are opt-in and will not run through `./eng/test.sh` when activated.

### BB14 — NuGet Packaging

**Status:** Deferred

NuGet packaging will be added when publishing is needed.

### BB18 — GitHub Pages Website

**Status:** Deferred

GitHub Pages will be added when a project website is needed.

## Authority

This document is authoritative for:
- the status of optional modules
- module activation requirements

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `docs/engineering/building-blocks.md`
