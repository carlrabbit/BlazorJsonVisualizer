# Milestone 0020 — Normalize engineering scripts and browser runtime workspace

## Status

Implemented.

## Task Mode

Focus-area engineering implementation milestone.

A later implementation agent must treat this milestone as the primary implementation route for normalizing `eng/` scripts, Bun-only frontend tooling, and the TypeScript browser runtime workspace layout.

## Repository Maturity

BlazorJsonVisualizer is in Exploration / Active Design mode. Engineering work should remain lightweight, command-contract driven, and focused on restoring trustworthy validation. This is not product feature work and not release work.

## Goal

Make the canonical engineering scripts correctly restore, build, format, and validate the browser runtime using Bun-only tooling from the correct runtime workspace root.

The normalized browser runtime workspace root is:

```text
src/BlazorJsonVisualizer.Runtime/
```

The implementation must remove npm/npx fallback behavior, remove npm lockfiles, move the existing `src/runtime` workspace to the new root, update package scripts to Bun, and make `./eng/check.sh` catch runtime/frontend failures instead of silently skipping them.

## Problem Statement

Current engineering and runtime files are inconsistent with repository policy:

- `eng/frontend-check.sh` and `eng/frontend-format.sh` look for `package.json` at repository root instead of the actual TypeScript runtime workspace.
- frontend scripts fall back to `npm`/`npx` even though repository rules require Bun.
- `eng/restore.sh`, `eng/check.sh`, and `eng/format.sh` can skip TypeScript/runtime work because they look for root-level runtime tooling files.
- runtime `package.json` scripts still use `npm`, workspace npm commands, and direct Node execution.
- npm lockfiles exist even though `bun.lock` is the canonical lockfile.
- `eng/start-samples.sh` builds the runtime through Bun but still requires `npm`.
- `src/runtime` is a lowercase non-project workspace root beside .NET project roots, causing package-root ambiguity.
- `docs/engineering/typescript-tools.md` still contains a stale npm-transition note that contradicts current agent rules.

The result is false validation confidence: `./eng/check.sh` can pass without actually validating the browser runtime.

## Required Authority Documents

Implementation agents must read:

- `AGENTS.md`
- `.github/copilot-instructions.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/engineering/typescript-tools.md`
- `docs/engineering/browser-runtime-workspace.md`
- `docs/architecture/browser-runtime.md`
- `docs/architecture/runtime-boundaries.md`
- `docs/decisions/0008-use-src-blazorjsonvisualizer-runtime-for-browser-runtime-workspace.md`

Read additional docs only when directly touched:

- `docs/engineering/samples.md` when changing sample launcher behavior.
- `docs/ARCHITECTURE.md` and `docs/DECISIONS.md` when updating architecture or decision indexes.
- `docs/MILESTONES.md` when adding or synchronizing this milestone in the milestone index.

Do not require reading all specs, all milestones, all public docs, or `docs/research/`.

## Scope

### In Scope

- Move the browser runtime workspace from `src/runtime/` to `src/BlazorJsonVisualizer.Runtime/`.
- Update all repository references to the runtime workspace root where needed.
- Keep existing package split under the new root:
  - `runtime-core/`
  - `runtime-dom/`
  - `runtime-worker/`
  - `runtime-blazor/`
- Keep the runtime workspace TypeScript/Bun-based, not a .NET project.
- Remove npm fallback from `eng/` scripts.
- Remove `npm`/`npx`/`node` usage from runtime package scripts where it is part of TypeScript tool execution.
- Remove `package-lock.json` files from runtime/test runtime areas.
- Ensure `bun.lock` is the canonical committed runtime lockfile.
- Ensure `./eng/restore.sh` restores runtime dependencies from the runtime workspace root.
- Ensure `./eng/frontend-check.sh` runs the runtime check from the runtime workspace root and fails clearly when Bun is missing.
- Ensure `./eng/frontend-format.sh` runs runtime formatting from the runtime workspace root and fails clearly when Bun is missing.
- Ensure `./eng/check.sh` includes runtime/frontend verification by invoking the canonical frontend script, not by duplicating root-file detection.
- Ensure `./eng/format.sh` invokes the canonical frontend format script when formatting TypeScript.
- Ensure `eng/start-samples.sh` requires Bun instead of npm and uses the normalized runtime workspace root.
- Add or integrate a lightweight tooling guard that fails on forbidden npm/npx/package-lock usage outside explicitly allowed historical or research contexts.
- Update focused engineering docs and durable architecture/decision docs for the new workspace root.

### Out of Scope

- Changing runtime package boundaries beyond the workspace-root move.
- Rewriting runtime implementation behavior.
- Introducing npm compatibility.
- Introducing Node/npm as fallback tooling.
- Introducing Python into `eng/` scripts.
- CI workflow redesign beyond whatever is needed to keep CI calling canonical `eng/` scripts.
- Public package/release validation.
- TBPs, issue templates, or non-root README files.
- Public documentation changes unless a user-facing command or sample workflow is directly changed.

## Focus Areas

### Focus Area 1 — Runtime workspace move

Move the TypeScript runtime workspace:

```text
src/runtime/
```

to:

```text
src/BlazorJsonVisualizer.Runtime/
```

The new root must contain the workspace `package.json`, `bun.lock`, Biome configuration, TypeScript base configuration, and package subdirectories.

Expected final shape:

```text
src/BlazorJsonVisualizer.Runtime/
  package.json
  bun.lock
  biome.json
  tsconfig.base.json
  runtime-core/
  runtime-dom/
  runtime-worker/
  runtime-blazor/
```

If repository implementation discovers a materially better root name during implementation, the agent must update the decision record and all related engineering docs in the same change. Otherwise use `src/BlazorJsonVisualizer.Runtime/`.

### Focus Area 2 — Runtime tests workspace normalization

Normalize runtime tests so canonical Bun commands can run them without npm install or package-lock files.

Recommended shape:

```text
src/BlazorJsonVisualizer.Runtime/tests/
```

or, if keeping test roots separate is already strongly established:

```text
tests/BlazorJsonVisualizer.Runtime.Tests/
```

The chosen shape must be documented in `docs/engineering/browser-runtime-workspace.md` and reflected in package scripts.

Do not leave a separate `tests/runtime/package-lock.json` or npm-managed test package.

### Focus Area 3 — Bun-only package scripts

Update runtime package scripts to use Bun workspaces and Bun execution.

Package scripts must not use:

```text
npm
npx
node
npm install
npm --workspace
```

for TypeScript/runtime tooling.

Acceptable examples:

```json
{
  "scripts": {
    "build": "bun run build:runtime-core && bun run build:runtime-dom && bun run build:runtime-worker && bun run build:runtime-blazor",
    "build:runtime-core": "bun --cwd runtime-core run build",
    "test": "bun run test:runtime-core && bun run test:layer1"
  }
}
```

Direct Bun execution of compiled test files is acceptable when needed, for example:

```sh
bun dist/index.test.js
```

The implementation may choose a cleaner Bun test-runner approach if it stays boring and explicit.

### Focus Area 4 — Canonical `eng/` frontend commands

Update frontend commands so they use the normalized runtime root.

Expected behavior:

- `./eng/frontend-check.sh` fails clearly when the runtime workspace exists but Bun is unavailable.
- `./eng/frontend-check.sh` runs `bun install --frozen-lockfile` only if that command is part of the repository’s chosen frontend check contract; otherwise restoration remains in `./eng/restore.sh`.
- `./eng/frontend-check.sh` runs the runtime check/build/test scripts from `src/BlazorJsonVisualizer.Runtime/`.
- `./eng/frontend-format.sh` runs the runtime format script from `src/BlazorJsonVisualizer.Runtime/`.
- No frontend command falls back to npm or npx.

### Focus Area 5 — Restore, format, and Tier 2 check reliability

Update shared engineering scripts so they route through canonical commands.

Expected behavior:

- `./eng/restore.sh` runs `dotnet restore` and `bun install --cwd src/BlazorJsonVisualizer.Runtime --frozen-lockfile`.
- `./eng/check.sh` invokes `./eng/frontend-check.sh` instead of looking for root `biome.json`.
- `./eng/format.sh` invokes `./eng/frontend-format.sh` when TypeScript formatting is expected.
- Root-level `package.json` or `biome.json` must not be required for runtime validation.

### Focus Area 6 — Sample launcher correction

Update sample launcher behavior where it touches runtime assets.

Expected behavior:

- `eng/start-samples.sh` requires `bun`, not `npm`.
- Runtime build commands point to `src/BlazorJsonVisualizer.Runtime/`.
- Runtime Blazor bundle copy path remains correct.
- `eng/samples.sh` remains focused and can still dry-run the launcher.
- Bash usage in `eng/start-samples.sh` remains allowed if documented as intentional for process orchestration.

### Focus Area 7 — Tooling guard

Add a lightweight guard to prevent reintroduction of npm/npx/package-lock usage.

Acceptable implementation options:

- add a new canonical helper script such as `eng/tooling-guard.sh` and call it from `eng/check.sh`; or
- integrate the guard into an existing `eng/` script if this keeps command-contract complexity low.

The guard should fail on runtime/engineering violations such as:

```text
package-lock.json
npm run
npm install
npm --workspace
npx
node dist/
```

The guard may ignore `docs/research/` and historical milestone notes if the implementation documents those exclusions.

Do not use inline Python for this guard. Use shell, dotnet, or Bun/TypeScript.

### Focus Area 8 — Documentation updates

Update only directly affected authority docs:

- `docs/milestones/milestone-0020-normalize-engineering-scripts-and-browser-runtime-workspace.md`
- `docs/engineering/browser-runtime-workspace.md`
- `docs/engineering/typescript-tools.md`
- `docs/engineering/command-contract.md`
- `docs/ENGINEERING.md`
- `docs/architecture/browser-runtime.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0008-use-src-blazorjsonvisualizer-runtime-for-browser-runtime-workspace.md`
- `docs/DECISIONS.md`
- `docs/MILESTONES.md`

Do not perform broad public-documentation synchronization unless implementation changes user-facing public documentation.

## Direct Documentation Impact

Direct files for this milestone:

- `docs/milestones/milestone-0020-normalize-engineering-scripts-and-browser-runtime-workspace.md`
- `docs/engineering/browser-runtime-workspace.md`
- `docs/engineering/typescript-tools.md`
- `docs/engineering/command-contract.md`
- `docs/ENGINEERING.md`
- `docs/architecture/browser-runtime.md`
- `docs/ARCHITECTURE.md`
- `docs/decisions/0008-use-src-blazorjsonvisualizer-runtime-for-browser-runtime-workspace.md`
- `docs/DECISIONS.md`
- `docs/MILESTONES.md`

Implementation must update these documents if the actual command names, runtime root, or validation behavior differs from this plan.

## Deferred Documentation Synchronization

A later documentation synchronization pass should review:

- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/engineering/samples.md`
- `docs/workflows/build.md`
- `docs/workflows/release.md`
- any sample documentation that mentions runtime workspace paths

Do not include public docs unless public consumer behavior changes.

## Validation Expectations

Use the validation tiers in `docs/engineering/command-contract.md`.

### Focused validation

For this milestone, the focused validations are mandatory unless impractical:

```sh
./eng/restore.sh
./eng/frontend-check.sh
./eng/frontend-format.sh
./eng/samples.sh
```

If a tooling guard script is added, run it directly or through `./eng/check.sh` according to the implemented command contract.

### Tier 1

Run short-running implementation validation:

```sh
./eng/test.sh
```

### Tier 2

Before declaring the milestone complete when practical:

```sh
./eng/check.sh
```

`./eng/check.sh` must include runtime/frontend verification after this milestone.

### Explicit-only validation

Do not require:

```sh
./eng/long-running-tests.sh [--fast]
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

This milestone is not release work.

## Acceptance Criteria

The milestone is complete when:

- the runtime workspace has moved from `src/runtime/` to `src/BlazorJsonVisualizer.Runtime/`;
- runtime package scripts no longer use npm, npx, npm workspaces, npm install, or direct Node execution for TypeScript/runtime tooling;
- runtime npm lockfiles are removed;
- `bun.lock` is the runtime lockfile;
- canonical frontend scripts run from the correct runtime workspace root;
- canonical frontend scripts fail clearly when Bun is missing instead of falling back to npm/npx;
- `./eng/restore.sh` restores runtime dependencies from the normalized runtime workspace root;
- `./eng/check.sh` validates the runtime/frontend surface instead of silently skipping it;
- `./eng/format.sh` and `./eng/frontend-format.sh` format the runtime from the correct root;
- `eng/start-samples.sh` requires Bun, not npm, and builds/copies runtime assets from the normalized root;
- a tooling guard prevents reintroduction of npm/npx/package-lock usage in active runtime/engineering surfaces;
- directly affected engineering, architecture, decision, and milestone docs are updated;
- no non-root README files, TBPs, issue templates, or broad public docs are introduced;
- focused validation, Tier 1, and Tier 2 pass when practical.
