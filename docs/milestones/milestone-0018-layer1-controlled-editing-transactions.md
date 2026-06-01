# Milestone 0018 — Layer 1 controlled editing transactions

## Status

Planned.

## Task Mode

Focus-area implementation milestone.

A later implementation agent must treat this milestone as the primary implementation route for adding constrained Layer 1 editing over prepared documents.

## Repository Maturity

BlazorJsonVisualizer remains in Exploration / Active Design mode. This milestone must keep editing intentionally constrained, behavior-driven, and validated by short-running tests. It is not release work.

## Goal

Add the first controlled Layer 1 editing operations for prepared documents by producing validated structural transactions instead of arbitrary text mutations.

## Problem Statement

The project intentionally delayed editing until prepared-document import, storage, runtime bridge, and read-only viewer behavior were stable. Layer 1 now needs controlled edits that preserve the prepared-document model and can later support consistent export, search invalidation, and diagnostics.

This milestone introduces the first transaction-producing edit commands but does not require final edited export. Edited export and degraded-state hardening are handled by Milestone 0019.

## Required Authority Documents

Implementation agents must read:

- `AGENTS.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/SPECS.md`
- `docs/specs/transaction-model.md`
- `docs/specs/transaction-log.md`
- `docs/specs/document-session.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `docs/decisions/0007-layer1-controlled-structural-edits-before-freeform-text-editing.md`

Read public docs only when changing public behavior or sample-facing documentation:

- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/layer1-controlled-editing.md`

## Scope

### In Scope

- Controlled edit command model for prepared-document Layer 1 sessions.
- First transaction types for primitive value replacement, property rename, property insert/remove, and array item insert/remove where the structural index can support them.
- Base-revision checks.
- Transaction validation before append.
- Explicit unsupported-operation responses when an edit cannot be represented safely.
- Dirty-state and revision reporting.
- Index invalidation markers after edits.
- Session update behavior after successful commit.
- Short-running tests for transaction validation and append behavior.

### Out of Scope

- Freeform text editing.
- Arbitrary text range replacement.
- Multi-cursor editing.
- Drag/drop restructuring.
- Schema-aware editing.
- Layer 2 refactorings.
- Final edited export behavior.
- Compaction.
- Collaborative/multi-writer merge semantics.
- Persisted fold state.
- Large-document default tests.

## Focus Areas

### Focus Area 1 — Edit command and transaction DTOs

Define runtime/backend DTOs for supported edit commands and resulting transactions.

Initial command categories:

- replace primitive node value;
- rename object property;
- insert object property;
- remove object property;
- insert array item;
- remove array item.

Commands must identify the base revision and target node/path/offset using prepared-document metadata available to the runtime.

### Focus Area 2 — Validation and unsupported behavior

Every edit command must validate before transaction append.

Validation must reject:

- stale base revision;
- missing target;
- incompatible target kind;
- invalid JSON value payload;
- unsupported structural metadata;
- missing required index;
- document not ready;
- read-only session.

Normal validation failures must return structured results with diagnostics.

### Focus Area 3 — Transaction append and revision behavior

Successful edits must append durable transactions through the prepared-document transaction log abstraction.

Expected behavior:

- append in revision order;
- do not silently apply to the wrong base revision;
- advance document/session revision;
- report updated dirty state;
- return changed ranges/nodes where available.

### Focus Area 4 — Runtime session update

After a successful edit, the runtime must update or invalidate affected cached rows and indexes.

First implementation may choose conservative invalidation over complex incremental row patching.

### Focus Area 5 — UI affordances

Add minimal Layer 1 editing affordances only where safe.

Acceptable UI shape:

- edit value action for primitive rows;
- rename property action for property rows;
- add/remove actions for simple object/array contexts;
- confirmation or validation panel as needed.

The UI must not imply arbitrary text editing support.

## Direct Documentation Impact

Direct files for this milestone:

- `docs/milestones/milestone-0018-layer1-controlled-editing-transactions.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/decisions/0007-layer1-controlled-structural-edits-before-freeform-text-editing.md`
- `public-docs/guides/layer1-controlled-editing.md`

Update these if implementation behavior differs from this plan.

## Deferred Documentation Synchronization

A later documentation synchronization pass should review:

- `README.md`
- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/TERMINOLOGY.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/open-prepared-document.md`

## Validation Expectations

Use the validation tiers in `docs/engineering/command-contract.md`.

Focused validation when touching frontend/runtime:

```sh
./eng/frontend-check.sh
```

Focused validation when touching samples:

```sh
./eng/samples.sh
```

Tier 1:

```sh
./eng/test.sh
```

Tier 2 when practical:

```sh
./eng/check.sh
```

Explicit-only:

```sh
./eng/long-running-tests.sh [--fast]
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

## Acceptance Criteria

The milestone is complete when:

- Layer 1 exposes controlled edit commands but not freeform text editing;
- supported edit commands produce validated structural transactions;
- stale revisions and unsupported targets fail clearly;
- successful transactions append durably and advance revision;
- cached row/index state is updated or invalidated safely;
- UI affordances are minimal and do not imply arbitrary text editing;
- short-running tests cover validation, append, revision, cache invalidation, and diagnostics;
- required validation tiers pass when practical.
