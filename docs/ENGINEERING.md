# Engineering

## Purpose

This index covers the concrete engineering substrate for BlazorJsonVisualizer: command contracts, build tooling, toolchain setup, building blocks, optional modules, samples, public documentation validation, packaging planning, and release-readiness validation.

For repository governance, knowledge model, and documentation conventions, see `docs/research/project-setup-guide-v5.md` and the authoritative index documents.

## What belongs here

- canonical `eng/` command documentation
- .NET build and test setup
- TypeScript tooling setup (Bun, Biome)
- building block descriptions
- optional module descriptions
- sample project conventions
- packaging and public API validation guidance
- public documentation validation and release-readiness guidance

## What does not belong here

- product behavioral specs (use `docs/SPECS.md`)
- implementation guardrails (use `docs/GUARDRAILS.md`)
- architectural structure (use `docs/ARCHITECTURE.md`)

## Available Documents

| Document | Purpose |
|---|---|
| `docs/engineering/command-contract.md` | Canonical `eng/` command names, purposes, and agent usage rules. |
| `docs/engineering/dotnet.md` | .NET build, test, format, and project conventions. |
| `docs/engineering/building-blocks.md` | Building block catalog for this repository. |
| `docs/engineering/optional-modules.md` | Optional module catalog and activation status. |
| `docs/engineering/samples.md` | Sample project conventions and launch instructions. |
| `docs/engineering/typescript-tools.md` | TypeScript tooling: Bun, Biome, tsconfig conventions. |
| `docs/engineering/packaging.md` | NuGet packaging and package smoke-test readiness expectations. |
| `docs/engineering/public-documentation.md` | Public documentation validation model and command usage. |
| `docs/engineering/release-readiness.md` | Release-oriented validation flow and explicit-only gate policy. |

## Canonical Commands

| Command | Purpose |
|---|---|
| `./eng/restore.sh` | Restore all dependencies. |
| `./eng/build.sh` | Build default projects. |
| `./eng/test.sh` | Run short-running tests only. |
| `./eng/format.sh` | Apply formatting. |
| `./eng/check.sh` | Restore, build, test, and verify formatting. Default completion gate. |
| `./eng/frontend-check.sh` | Run TypeScript/Biome checks. |
| `./eng/frontend-format.sh` | Apply TypeScript/Biome formatting. |
| `./eng/samples.sh` | Build and validate samples. |
| `./eng/public-docs.sh` | Validate required public documentation surfaces. |
| `./eng/public-api.sh` | Validate intentional public API surface strategy (explicit/release work). |
| `./eng/package-smoke.sh <version>` | Consumer smoke validation for packed packages (explicit only). |
| `./eng/release-check.sh <version>` | Release-oriented validation gate (explicit only, no publish). |

See `docs/engineering/command-contract.md` for full details.

## Authority

This document is authoritative for:
- the index of engineering documents under `docs/engineering/`
- canonical command names

This document is not authoritative for:
- product behavior (use specs)
- project governance (use index documents)

## Document Contract

When this index changes, review:
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/GUARDRAILS.md`
- `docs/PUBLIC-DOCS.md`
