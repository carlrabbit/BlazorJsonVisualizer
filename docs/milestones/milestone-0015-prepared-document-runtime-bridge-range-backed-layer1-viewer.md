# Milestone 0015 — Prepared Document Runtime Bridge and Range-Backed Layer 1 Viewer

## Status

Planned implementation milestone package.

## Goal

Implement the first end-to-end runtime bridge that opens a prepared document from the .NET prepared-document store and renders it through the Layer 1 browser runtime without loading the whole JSON document as one in-memory string.

This milestone connects the prepared-document import, storage, indexing, and ingestion work to the interactive Layer 1 viewer.

The expected end-to-end path is:

```text
prepared document store
  -> prepared document runtime bridge
  -> range/index/search service DTOs
  -> Blazor host interop boundary
  -> TypeScript Layer 1 runtime
  -> range-backed viewport rendering
  -> folding, search result reveal, and path/offset navigation
```

## Repository Mode and Task Mode

Repository maturity mode: **Exploration / Active Design**.

Task mode: **Implementation from milestone package**.

This milestone requires strong behavioral specs and focused validation. It must not introduce release-readiness requirements, package publication gates, public API baseline enforcement, issue templates, TBPs, or non-root README files.

## Required Authority Documents

Before implementation, read only these authority documents unless the implementation discovers a direct conflict:

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/SPECS.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/document-session.md`
- `docs/specs/viewport-model.md`
- `docs/specs/structural-index.md`
- `docs/specs/path-navigation.md`
- `docs/specs/search-index.md`
- `docs/specs/prepared-document.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/prepared-document-search-engine.md`
- `docs/specs/document-import.md`
- `docs/specs/import-jobs.md`
- `docs/specs/encoding-and-offsets.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/architecture/prepared-document-runtime-boundary.md`

Read public documentation only when changing public-facing opening/viewing behavior or examples:

- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/open-prepared-document.md`

Do not require the implementation agent to read `docs/research/` for this milestone. Research notes are non-authoritative.

## Problem Statement

The repository now has a prepared-document lifecycle, a storage-provider abstraction, a file-backed prepared-document storage engine, and ingestion/import job behavior. However, the interactive Layer 1 viewer still needs a real bridge to open prepared documents without treating them as complete text payloads.

Without this milestone, the system has a durable huge-file backend but cannot yet prove the core user workflow:

```text
import huge JSON once
  -> reopen prepared document
  -> view it through Layer 1
  -> request only needed ranges/index data
  -> search and navigate without reparsing or loading the whole source
```

This milestone must deliver that proof path.

## Scope

Implement:

- a .NET-side prepared-document runtime bridge over the prepared-document store and handles;
- a range-backed runtime session mode distinct from full-text `loadTextDocument` sessions;
- DTOs and interop calls for metadata, text ranges, rendered rows, structural/index access, folding state, search, and reveal;
- a TypeScript Layer 1 prepared-document session that requests data through the bridge instead of owning full source text;
- a range-backed viewport implementation sufficient for prepared documents;
- fold/unfold behavior over prepared structural metadata;
- search request/result/reveal behavior using prepared-document search services;
- path or offset reveal behavior over prepared-document structural/index services;
- error and degraded-state handling for missing/stale/failed indexes;
- Layer 1 sample integration for opening an existing prepared document;
- focused fast tests covering DTOs, bridge behavior, range requests, viewport derivation, folding, search reveal, and error behavior.

## Non-Goals

This milestone must not implement:

- Layer 2 schema overlays;
- Layer 3 projections;
- general-purpose text editing;
- persisted editing transactions;
- transaction replay into runtime editing state;
- collaborative multi-user editing;
- distributed storage;
- cloud/database storage providers;
- full-text ranking, fuzzy search, stemming, or query language;
- pixel-perfect virtualization;
- canvas renderer;
- mobile editing or IME support;
- public package release;
- release validation;
- TBPs or issue templates.

Long-running huge-document tests may be defined or documented as explicit-only validation, but must not run through normal Tier 1 or Tier 2 validation.

## Focus Areas

### Focus Area 1 — Prepared Document Runtime Bridge

Implement the .NET-side runtime bridge defined by `docs/specs/prepared-document-runtime-bridge.md`.

The bridge must adapt prepared-document store and handle operations into runtime-oriented operations. It must not expose physical file paths or file-backed storage layout details. It must operate through prepared-document abstractions and storage-provider-safe handles.

Minimum bridge capabilities:

- open prepared document session;
- get prepared document metadata;
- read bounded source text ranges;
- retrieve structural/range metadata needed for viewport generation;
- call prepared-document search;
- resolve reveal targets by byte offset and, when available, JSON Pointer;
- close/dispose bridge sessions;
- translate storage/import/index errors into runtime diagnostics.

### Focus Area 2 — Prepared Runtime Protocol

Implement the DTO and interop protocol defined by `docs/specs/prepared-document-runtime-protocol.md`.

The protocol must use explicit DTOs and must not expose internal .NET storage types or TypeScript runtime classes across the boundary.

The protocol must distinguish:

- full-text Layer 1 sessions;
- prepared-document range-backed Layer 1 sessions.

Existing `loadTextDocument` behavior may remain for small documents and samples. Prepared-document sessions must use `openPreparedDocumentSession` or equivalent naming rather than passing the full document text.

### Focus Area 3 — Range-Backed Layer 1 Viewer

Implement the behavior defined by `docs/specs/range-backed-layer1-viewer.md`.

The Layer 1 runtime must be able to render prepared documents by requesting bounded data from the bridge. The first implementation may use simple row windows and cached ranges, but it must not require the full source text as a single JavaScript string.

Minimum visible behavior:

- render an initial viewport for a prepared document;
- scroll or move the viewport by requesting additional rows/ranges;
- fold and unfold object/array nodes using prepared structural metadata;
- reveal a search result by byte offset;
- reveal a JSON Pointer when path metadata exists;
- show explicit diagnostics when required indexes are missing, stale, or failed.

### Focus Area 4 — Search and Navigation Integration

Connect prepared-document search to the Layer 1 viewer.

Search must not scan only visible rows. It must call the prepared-document search service and return bounded results with offsets, previews, revision identity, and optional path/node metadata.

Reveal behavior must:

1. map the result to a prepared-document location;
2. expand folded ancestors when structural data is available;
3. update the viewport so the target is visible;
4. report a clear non-throwing failure when the target cannot be resolved.

### Focus Area 5 — Layer 1 Sample Integration

Update the Layer 1 sample so it can demonstrate the prepared-document runtime path.

The sample may use a small prepared document by default, but the path must be the same path used for huge documents:

```text
open prepared document
  -> request metadata
  -> render viewport
  -> search
  -> reveal result
  -> fold/unfold
```

The sample must not fake prepared-document behavior by loading the whole source text through the old full-text API.

### Focus Area 6 — Public Preview Documentation

Add or update only directly affected preview public documentation included in this package:

- `public-docs/guides/open-prepared-document.md`

The public guide must describe the intended prepared-document open/view workflow without implying package release readiness. It must clearly separate small-document full-text loading from huge-document prepared-document opening.

## Expected API Shape

Names may be adjusted to match repository conventions, but the implementation must preserve the concepts.

```csharp
public interface IPreparedDocumentRuntimeBridge
{
    ValueTask<PreparedRuntimeSessionInfo> OpenAsync(
        PreparedRuntimeOpenRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRuntimeDocumentMetadata> GetMetadataAsync(
        string runtimeSessionId,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRuntimeTextRange> ReadTextRangeAsync(
        string runtimeSessionId,
        PreparedRuntimeTextRangeRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRuntimeRowsResult> GetRowsAsync(
        string runtimeSessionId,
        PreparedRuntimeRowsRequest request,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<PreparedRuntimeSearchResult> SearchAsync(
        string runtimeSessionId,
        PreparedRuntimeSearchRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedRuntimeRevealResult> RevealAsync(
        string runtimeSessionId,
        PreparedRuntimeRevealRequest request,
        CancellationToken cancellationToken = default);

    ValueTask CloseAsync(
        string runtimeSessionId,
        CancellationToken cancellationToken = default);
}
```

```ts
interface PreparedDocumentRuntimeClient {
  openPreparedDocumentSession(request: PreparedOpenRequestDto): Promise<PreparedOpenResultDto>;
  getPreparedDocumentMetadata(sessionId: string): Promise<PreparedDocumentMetadataDto>;
  getPreparedRows(request: PreparedRowsRequestDto): Promise<PreparedRowsResultDto>;
  readPreparedTextRange(request: PreparedTextRangeRequestDto): Promise<PreparedTextRangeDto>;
  searchPreparedDocument(request: PreparedSearchRequestDto): Promise<PreparedSearchResultPageDto>;
  revealPreparedLocation(request: PreparedRevealRequestDto): Promise<PreparedRevealResultDto>;
  closePreparedDocumentSession(sessionId: string): Promise<void>;
}
```

## Required DTO Semantics

The implementation must define DTOs for:

- prepared open request/result;
- prepared document metadata;
- text range request/result;
- rendered row request/result;
- structural node summaries;
- fold state updates;
- search query/result page;
- reveal request/result;
- runtime diagnostics;
- index state reporting.

DTOs must include revision identity where stale results would otherwise be ambiguous.

Source and index offsets crossing the .NET/prepared-document boundary are UTF-8 byte offsets unless a DTO explicitly states otherwise. Browser text/range rendering may use string slices produced by the bridge, but durable offsets must remain byte-offset-based.

## Direct Documentation Impact

The implementation change must update these documents in the same change if behavior or naming differs from this package:

- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/architecture/prepared-document-runtime-boundary.md`
- `public-docs/guides/open-prepared-document.md`

If implementation changes existing protocol names or semantics, update `docs/specs/runtime-protocol.md` in the same change.

If implementation changes existing document session, viewport, structural index, search, or path navigation behavior, update the directly affected specs in the same change.

If new durable terms are introduced, update `docs/TERMINOLOGY.md` in the same change.

## Deferred Documentation Synchronization

Do not perform broad synchronization unless the task explicitly includes it.

The implementation PR should note that a later documentation synchronization pass should review:

- `docs/SPECS.md`
- `docs/ARCHITECTURE.md`
- `docs/MILESTONES.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/samples.md`
- `public-docs/getting-started.md`
- `public-docs/concepts.md`
- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`

These are synchronization surfaces, not blockers for implementing the milestone unless the current change directly modifies their authority.

## Validation Expectations

Use the validation tiers defined by `docs/engineering/command-contract.md`.

### Focused Validation

Run focused checks for the changed surface where practical:

- `./eng/build.sh` for .NET/Blazor implementation changes;
- `./eng/frontend-check.sh` when TypeScript runtime or browser integration changes;
- `./eng/samples.sh` when sample files change;
- `./eng/public-docs.sh` when public docs in this package change.

### Tier 1

Run:

```bash
./eng/test.sh
```

Tier 1 must cover short-running tests only.

### Tier 2

Run when practical before declaring completion:

```bash
./eng/check.sh
```

If Tier 2 is not practical, record the reason and the focused/Tier 1 validation that was run.

### Explicit-Only Validation

Do not run by default:

```bash
./eng/long-running-tests.sh [--fast]
./eng/public-api.sh
./eng/package-smoke.sh <version>
./eng/release-check.sh <version>
```

Explicit-only validation may include reduced-size or generated large prepared documents, long scroll simulations, large search smoke tests, and concurrent runtime sessions. These must remain outside default Tier 1/Tier 2 validation unless a later task explicitly changes test policy.

## Required Fast Tests

Implement short-running tests for:

- opening a prepared runtime session over a small prepared document;
- rejecting unknown document identifiers with explicit runtime diagnostics;
- metadata DTO serialization and revision identity;
- bounded text range reads using small source chunks;
- row request behavior for a small prepared document;
- fold/unfold behavior through prepared structural metadata;
- search request/result DTO behavior using small deterministic input;
- reveal-by-search-result offset behavior;
- reveal-by-JSON-Pointer success and failure behavior when path metadata exists;
- missing/stale/failed index diagnostics;
- session close/dispose behavior;
- TypeScript prepared-document runtime client DTO handling;
- Layer 1 sample smoke behavior if sample validation has test hooks.

All required fast tests must use small deterministic inputs and must not create huge documents.

## Explicit-Only Validation Definitions

Define or document explicit-only validation for:

- opening a prepared document generated from approximately 100 MB JSON;
- opening a prepared document generated from approximately 500 MB JSON;
- search over a large prepared document;
- scrolling/range-window smoke test over a large prepared document;
- 10 concurrent read-only prepared runtime sessions over one or more prepared documents;
- missing index recovery/degraded-state behavior over a large prepared document.

These may be added as skipped/manual/explicit tests if the repository has the required mechanism. They must not be executed by normal `./eng/test.sh` or `./eng/check.sh`.

## Acceptance Criteria

The milestone is complete when:

- a prepared document can be opened through a runtime bridge without loading the whole source as one string;
- the bridge uses prepared-document store/handle abstractions and does not expose file-backed layout details;
- the TypeScript Layer 1 runtime can open a range-backed prepared-document session;
- the Layer 1 viewer can render a prepared-document viewport from bounded range/index requests;
- fold/unfold works for prepared-document structural nodes;
- prepared-document search results can be requested and revealed;
- path or offset reveal returns explicit success/failure results without normal user-input exceptions;
- missing/stale/failed index states produce clear runtime diagnostics;
- the Layer 1 sample demonstrates the prepared-document open/view path without faking it through full-text load;
- directly affected specs and public preview documentation are aligned with implementation behavior;
- required fast tests pass;
- Tier 1 validation passes;
- Tier 2 validation is run when practical or an explicit reason is recorded;
- release/package/public API validation is not required for this milestone.

## Implementation Notes

Prefer a simple bridge implementation first. The bridge may compute row windows server-side, client-side, or through a hybrid approach as long as the chosen boundary is documented in `docs/specs/range-backed-layer1-viewer.md` and does not require the browser to own the full source text.

The first implementation may use row-index windows rather than pixel-perfect virtualization.

The first implementation may degrade gracefully when optional indexes are missing, but the degradation must be explicit and tested. It must not silently scan the whole huge source from the browser.

Search results should be paged or bounded. Returning all matches from a huge document in one response is out of scope.

Prepared-document sessions are read-only in this milestone. Editing and transaction persistence are reserved for later milestones.
