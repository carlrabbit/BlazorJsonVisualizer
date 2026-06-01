# Milestone 0017 — Layer 1 prepared-document viewer and search completion

## Status

Planned.

## Task Mode

Focus-area implementation milestone.

A later implementation agent must treat this milestone as the primary implementation route for completing the read-only range-backed Layer 1 viewer and user-facing prepared-document search workflow.

## Repository Maturity

BlazorJsonVisualizer is in Exploration / Active Design mode. This milestone must preserve lightweight implementation flow, behavior-rich specs, preview public docs, and focused validation. This is not release work.

## Goal

Make the range-backed Layer 1 prepared-document viewer usable end-to-end for imported/prepared huge JSON documents, including bounded viewport loading, folding, search workflow, result reveal, index-state reporting, and the Layer 1 sample path.

## Problem Statement

Earlier milestones established prepared-document storage, ingestion, runtime bridge, and range-backed viewer foundations. This milestone turns those foundations into a coherent read-only user workflow:

```text
open prepared document
  -> see metadata and initial viewport
  -> scroll through bounded row windows
  -> fold and unfold structural nodes
  -> search beyond visible rows
  -> page search results
  -> reveal result or JSON Pointer/offset
  -> understand missing/stale/failed index states
```

The milestone does not introduce editing. Editing belongs to Milestone 0018.

## Required Authority Documents

Implementation agents must read:

- `AGENTS.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/SPECS.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/viewport-model.md`
- `docs/specs/path-navigation.md`
- `docs/specs/search-index.md`
- `docs/specs/prepared-document-viewer-search-workflow.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `docs/architecture/prepared-document-runtime-boundary.md`

Read public docs only when changing public behavior or sample-facing documentation:

- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/guides/layer1-prepared-document-search.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

Do not require reading all milestones, all public docs, all architecture docs, or `docs/research/`.

## Scope

### In Scope

- Prepared-document viewer opening and metadata display.
- Bounded initial viewport loading for prepared documents.
- Bounded row-window loading on scroll.
- Folding/unfolding behavior over available structural metadata.
- Offset reveal, JSON Pointer reveal, and search-result reveal.
- Search UI/runtime workflow using prepared-document search services, not visible-row scanning.
- Paged search results and continuation behavior.
- Index-state and operation-support reporting.
- Viewer diagnostic states for missing, stale, failed, or unsupported indexes.
- Layer 1 sample app path demonstrating import/select/open/search/reveal.
- Short-running tests for DTOs, row windows, search workflow, reveal behavior, and diagnostics.

### Out of Scope

- Editing and transaction creation.
- Edited export.
- Transaction replay.
- Compaction.
- Layer 2 schema overlays.
- Layer 3 projections.
- Pixel-perfect virtualization.
- Variable row-height virtualization.
- Large 500 MB default tests.
- Release/package validation.

## Focus Areas

### Focus Area 1 — Prepared document open experience

Implement the public and sample-facing path to open a prepared document without loading the full JSON source into browser memory.

Expected behavior:

- open by prepared document id or prepared document reference;
- show document id, revision, byte length, state, encoding policy, and index states where available;
- display operation availability for search, folding, offset reveal, path reveal, and export;
- fail normal user/request errors through diagnostics, not unhandled exceptions.

### Focus Area 2 — Bounded viewport behavior

Implement row-window loading for prepared-document sessions.

Expected behavior:

- initial row window is bounded;
- scroll requests bounded additional windows;
- cache remains bounded;
- revision and fold-state changes invalidate relevant cached rows;
- browser runtime never receives the entire prepared document as one string.

The implementation may use a simple fixed-height virtual list and spacer model. Advanced virtualization is deferred.

### Focus Area 3 — Folding and reveal behavior

Implement folding/unfolding when structural metadata is available.

Expected behavior:

- folding hides descendants from normal visible row responses;
- reveal may expand folded ancestors when structural metadata allows it;
- fold commands return explicit unsupported/diagnostic results when structural metadata is missing, stale, failed, or unsupported;
- fold state remains session-local unless a later milestone explicitly persists it.

### Focus Area 4 — Prepared-document search workflow

Implement the Layer 1 search workflow over the prepared-document search service.

Expected behavior:

- literal search with case-sensitive/case-insensitive options where supported;
- bounded max results;
- continuation token or equivalent paging;
- result preview;
- revision identity on results;
- explicit index-state/degraded-state behavior;
- no fallback to searching only visible rows.

### Focus Area 5 — Search-result, offset, and path reveal

Implement result reveal behavior.

Expected behavior:

- reveal resolves to a row window or diagnostic result;
- successful reveal focuses or marks the result row;
- reveal expands folded ancestors when structural metadata allows it;
- normal failure is non-throwing and includes a reason.

### Focus Area 6 — Layer 1 sample path

Update the Layer 1 sample to exercise the complete read-only prepared-document workflow.

Expected sample capabilities:

- choose or import a prepared document through existing ingestion/storage surfaces;
- open prepared document in the range-backed viewer;
- scroll through rows;
- fold/unfold;
- search and page results;
- reveal a result;
- display diagnostics/index states.

## Direct Documentation Impact

Direct files for this milestone:

- `docs/milestones/milestone-0017-layer1-prepared-document-viewer-and-search-completion.md`
- `docs/specs/prepared-document-viewer-search-workflow.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/layer1-prepared-document-search.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

Update these if implementation behavior differs from this plan.

## Deferred Documentation Synchronization

A later documentation synchronization pass should review:

- `README.md`
- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/PUBLIC-DOCS.md`
- `docs/TERMINOLOGY.md`
- `public-docs/getting-started.md`
- `public-docs/concepts.md`
- `public-docs/samples.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/open-prepared-document.md`

Do not broaden this milestone into full documentation synchronization.

## Validation Expectations

Use the validation tiers in `docs/engineering/command-contract.md`.

### Focused validation

Use when touching TypeScript/frontend/viewer code:

```sh
./eng/frontend-check.sh
```

Use when touching samples:

```sh
./eng/samples.sh
```

Use when touching public docs:

```sh
./eng/public-docs.sh
```

### Tier 1

Run short-running implementation tests:

```sh
./eng/test.sh
```

### Tier 2

Before declaring the milestone complete when practical:

```sh
./eng/check.sh
```

### Explicit-only validation

Do not run by default:

```sh
./eng/long-running-tests.sh [--fast]
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

Huge-document scrolling/search tests are explicit-only unless reduced to short-running deterministic fixtures.

## Acceptance Criteria

The milestone is complete when:

- a prepared document can be opened in the Layer 1 viewer without loading the full source into the browser as one string;
- initial viewport and scroll-driven row-window loading are bounded;
- folding/unfolding works when structural metadata is available and fails clearly otherwise;
- search runs through prepared-document search services and never only visible rows;
- search results are bounded and pageable;
- search-result, offset, and JSON Pointer reveal return success/failure result objects;
- index states and degraded capabilities are visible to the viewer and sample;
- the Layer 1 sample demonstrates the read-only prepared-document workflow;
- short-running tests cover the main DTO, viewport, search, reveal, and diagnostic paths;
- required validation tiers pass when practical.
