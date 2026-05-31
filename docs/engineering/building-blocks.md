# Building Blocks

## Purpose

This document lists the engineering building blocks selected for BlazorJsonVisualizer.

Building blocks are modular capability packages defined by the engineering guides stored under `docs/research/`. Each block adds specific files, commands, and conventions to the repository.

## Selected Building Blocks

| Block | Name | Status |
|---|---|---|
| BB00 | Repository Base | Active |
| BB01 | .NET Solution | Active |
| BB02 | Shared Build Configuration | Active |
| BB03 | EditorConfig and C# Style | Active |
| BB04 | MTP + TUnit Unit Tests | Active |
| BB05 | Test Policy and Validation Tiers | Active |
| BB07 | GitHub Actions CI | Active |
| BB08 | Agent Instructions | Active |
| BB09 | Bun + Biome | Active |
| BB10 | Blazor Module | Active |
| BB12 | TypeScript Runtime Tools | Active |
| BB13 | Documentation Skeleton | Active |
| BB15 | Samples | Active |
| BB16 | GitHub Copilot | Active |
| BB17 | OpenAI Codex | Active |
| BB19 | Public Documentation | Active |

## Planned / Deferred Building Blocks

| Block | Name | Status |
|---|---|---|
| BB06 | BenchmarkDotNet | Deferred |
| BB11 | Playwright E2E Module | Deferred |
| BB14 | NuGet Packaging | Planned |
| BB18 | GitHub Pages Website | Deferred |
| BB20 | Release Readiness | Planned |

For this repository, public documentation is selected because BlazorJsonVisualizer is intended to expose public Blazor/package-facing usage. NuGet packaging and full release readiness remain planned until package-release implementation is activated.

## Authority

This document is authoritative for:
- which building blocks are active in this repository
- the status of deferred and planned building blocks

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `docs/engineering/optional-modules.md`
- `docs/engineering/release-readiness.md`
