# Engineering

## Purpose

This index covers the concrete engineering substrate for BlazorJsonVisualizer: command contracts, validation tiers, build tooling, toolchain setup, implementation constraints, building blocks, optional modules, samples, public documentation validation, packaging planning, and future release-readiness validation.

The repository is currently in **Exploration / Active Design** mode. Engineering guidance should keep normal implementation lightweight while preserving strong specs and focused validation.

## What belongs here

- canonical `eng/` command documentation
- validation-tier routing and test classification
- .NET build and test setup
- TypeScript tooling setup (Bun, Biome)
- browser runtime workspace layout and command routing
- implementation scope, documentation, and public API constraints
- building block descriptions
- optional module descriptions
- sample project conventions
- packaging and public API validation guidance
- public documentation validation and future release-readiness guidance

## What does not belong here

- product behavioral specs (use `docs/SPECS.md`)
- durable structural architecture (use `docs/ARCHITECTURE.md` only when boundaries need explanation)
- decision rationale (use `docs/DECISIONS.md`)

## Repository Maturity

| Area | Current mode |
|---|---|
| Product behavior | Behavior-rich; specs are authoritative. |
| Architecture | Emerging; document durable runtime/browser/component boundaries only. |
| Public package | Preview/planned; package publication is not active release work. |
| Release readiness | Future work; explicit-only commands may exist but are not normal implementation gates. |
| Process weight | Lightweight; use focused validation before broad gates. |

## Available Documents

| Document | Purpose |
|---|---|
| `docs/engineering/command-contract.md` | Canonical `eng/` command names, purposes, validation tiers, and agent usage rules. |
| `docs/engineering/dotnet.md` | .NET build, test, format, project conventions, and .NET-specific constraints. |
| `docs/engineering/browser-runtime-workspace.md` | Browser runtime workspace root, package split, Bun-only rules, and engineering-script routing expectations. |
| `docs/engineering/typescript-tools.md` | TypeScript tooling: Bun, Biome, tsconfig conventions, and TypeScript architecture constraints. |
| `docs/engineering/building-blocks.md` | Building block catalog for this repository. |
| `docs/engineering/optional-modules.md` | Optional module catalog and activation status. |
| `docs/engineering/samples.md` | Sample project conventions and launch instructions. |
| `docs/engineering/packaging.md` | Planned NuGet packaging and package smoke-test readiness expectations. |
| `docs/engineering/public-documentation.md` | Public documentation preview status, validation model, and command usage. |
| `docs/engineering/release-readiness.md` | Future release-oriented validation flow and explicit-only gate policy. |

## Canonical Commands

| Command | Purpose | Tier |
|---|---|---|
| `./eng/restore.sh` | Restore all dependencies: dotnet restore and Bun install for the browser runtime workspace. | Focused |
| `./eng/build.sh` | Build default projects. | Focused |
| `./eng/test.sh` | Run short-running tests only. | Tier 1 |
| `./eng/format.sh` | Apply formatting: dotnet format and frontend formatting through canonical frontend script. | Focused |
| `./eng/check.sh` | Restore, build, test, verify formatting/tooling, and validate browser runtime/frontend surface. Default completion gate. | Tier 2 |
| `./eng/frontend-check.sh` | Run Bun/Biome/TypeScript checks for the browser runtime workspace. | Focused |
| `./eng/frontend-format.sh` | Apply Bun/Biome formatting for the browser runtime workspace. | Focused |
| `./eng/tooling-guard.sh` | Check active runtime, runtime-test, and engineering surfaces for forbidden npm/npx/package-lock usage. | Focused / Tier 2 |
| `./eng/samples.sh` | Build and validate samples. | Focused |
| `./eng/public-docs.sh` | Validate required public documentation surfaces. | Focused |
| `./eng/long-running-tests.sh [--fast]` | Run explicit long-running tests; `--fast` uses reduced data sizes for validation. | Explicit only |
| `./eng/public-api.sh` | Validate intentional public API surface strategy. | Explicit only |
| `./eng/package-smoke.sh <version>` | Consumer smoke validation for packed packages. | Explicit only |
| `./eng/release-check.sh <version>` | Release-oriented validation gate; no publish. | Explicit only |

See `docs/engineering/command-contract.md` for full details.

## Implementation Constraints

- Implement only what is specified in the referenced spec or milestone.
- Do not infer architecture from code alone when a spec exists.
- Update specs when behavior changes.
- Update terminology when introducing new durable project terms.
- Do not create non-root README files.
- Do not add folder README files under `docs/` or `public-docs/`.
- Use all-caps index documents in `docs/` for folder indexes.
- Keep documentation concise, precise, and cross-referenced.
- Public API changes must be covered by or update the relevant spec.
- Public APIs must document intent, contract, constraints, and failure behavior.
- Prepared-document storage work must preserve the storage-provider abstraction and must not expose the default file-backed layout as a consumer contract.
- Browser runtime tooling must use Bun and Biome from `src/BlazorJsonVisualizer.Runtime/`.
- Active runtime/engineering tooling must not use npm, npx, package-lock files, or Node-based fallback execution.
- Run the smallest relevant validation set before broader gates.
- Do not run long-running tests unless explicitly requested.

## Authority

This document is authoritative for:

- the index of engineering documents under `docs/engineering/`;
- canonical command names;
- validation-tier routing;
- implementation and tooling constraints previously split into separate guardrail documents.

This document is not authoritative for:

- product behavior (use specs);
- durable architecture (use architecture docs when needed);
- project history or non-authoritative research notes.

## Document Contract

When this index changes, review:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/PUBLIC-DOCS.md`
- `docs/TESTING.md`
