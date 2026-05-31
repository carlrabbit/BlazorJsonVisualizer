# Milestone 0014 — Data Ingestion Adapters, Diagnostics, and Import Job Lifecycle

## Status

Planned implementation milestone package.

## Goal

Implement the public-facing data ingestion layer around the prepared-document system.

Milestones 0012 and 0013 define the prepared-document lifecycle, the prepared-document store, and the department-scale storage engine. This milestone defines and implements how application users provide raw JSON sources, start and observe imports, receive diagnostics, cancel preparation, handle failed imports, and obtain a prepared document that can be opened later.

The implementation must deliver an ingestion orchestration layer, not another storage engine. The storage engine remains responsible for durable prepared-document artifacts. The ingestion layer owns source adapters, import jobs, progress, cancellation semantics, diagnostics, encoding policy, and public workflow documentation.

## Repository Mode and Task Mode

Repository maturity mode: **Exploration / Active Design**.

Task mode: **Implementation from milestone package**.

This milestone must use strong specs and focused validation, but must not introduce release-readiness requirements. Package smoke tests, public API baselines, release checks, long-running validation, and publish workflows are explicit-only unless a later task requests them.

## Required Authority Documents

Before implementation, read only these authority documents unless the implementation discovers a direct conflict:

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/SPECS.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/specs/prepared-document.md`
- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `docs/specs/transaction-log.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/file-prepared-document-store.md`
- `docs/specs/prepared-document-storage-format.md`
- `docs/specs/prepared-document-concurrency.md`
- `docs/specs/prepared-document-search-engine.md`
- `docs/specs/data-ingestion.md`
- `docs/specs/ingestion-sources.md`
- `docs/specs/import-jobs.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/encoding-and-offsets.md`

Read `docs/PUBLIC-DOCS.md`, `public-docs/guides/huge-json-documents.md`, `public-docs/guides/import-huge-json.md`, and `public-docs/diagnostics/import-diagnostics.md` when changing public-facing ingestion behavior, diagnostics, or examples.

Do not require the implementation agent to read `docs/research/` unless a later task explicitly asks for methodology/history context. Research notes are non-authoritative.

## Problem Statement

Huge JSON workflows still lack a first-class ingestion experience.

The prepared-document system can describe a durable internal document, and the storage engine can persist prepared artifacts. However, an application user also needs to know:

- where raw JSON may come from;
- how imports are started;
- how long-running preparation reports progress;
- how cancellation behaves;
- how invalid input and operational warnings are reported;
- how encoding, byte offsets, line/column mapping, and diagnostics behave;
- what happens to failed or cancelled imports;
- how a successful import produces an openable prepared document.

Without this milestone, applications would call low-level import/store APIs directly and each host would invent its own source model, progress model, error vocabulary, cancellation semantics, and user-facing import documentation.

## Scope

Implement:

- source-adapter abstractions for JSON ingestion sources;
- default adapters for stream-based sources and file-path sources;
- a Blazor/browser-upload adapter when the repository already has or introduces the required Blazor surface in this milestone;
- import job creation, status, progress, cancellation, and final result semantics;
- import diagnostics with stable diagnostic codes;
- UTF-8-first encoding and byte-offset policy;
- import lifecycle integration with the prepared-document store and storage engine;
- failed/cancelled import cleanup rules;
- import result API that distinguishes success, warning, failure, and cancellation;
- focused fast tests for source adapters, import jobs, diagnostics, encoding policy, and cancellation;
- preview public documentation for importing huge JSON and understanding import diagnostics.

## Non-Goals

This milestone must not implement:

- a new prepared-document storage engine;
- cloud object storage provider implementation;
- database-backed ingestion provider;
- distributed background job processing;
- cross-process job scheduling;
- resumable upload protocol;
- browser IndexedDB prepared-document persistence;
- invalid-JSON best-effort viewer mode;
- schema-aware ingestion;
- Layer 2 schema overlay features;
- Layer 3 projection features;
- collaborative multi-user editing;
- public package release;
- release validation;
- issue templates or TBPs.

Long-running import stress tests may be defined or stubbed for explicit-only validation, but must not run through the normal Tier 1 or Tier 2 validation paths.

## Focus Areas

### Focus Area 1 — Ingestion Source Abstraction

Implement the source abstraction defined by `docs/specs/ingestion-sources.md`.

The implementation must support raw JSON input with metadata and lifecycle semantics instead of accepting only anonymous streams everywhere. The source abstraction must expose display name, optional length, optional content type, open-read behavior, and ownership/disposal expectations.

Minimum default source adapters:

- stream source over a caller-provided `Stream`;
- file-path source over a readable local file;
- optional Blazor/browser upload source only if it can be implemented without weakening runtime boundaries.

### Focus Area 2 — Import Job Lifecycle

Implement the import-job model defined by `docs/specs/import-jobs.md`.

The job lifecycle must represent queued, source opening, reading, chunking, indexing, finalizing, ready, failed, and cancelled states. Jobs may run in-process; no distributed background processor is required. The job model must expose stable status snapshots and progress values suitable for Blazor UI polling or event-driven status updates.

### Focus Area 3 — Import Diagnostics

Implement the diagnostic model defined by `docs/specs/import-diagnostics.md`.

Diagnostics must be stable enough for public documentation. Exceptions remain for infrastructure failures; diagnostics describe source/document findings and recoverable import concerns. Diagnostic codes must be explicit strings and must have public explanations.

### Focus Area 4 — Encoding and Offset Policy

Implement the encoding and offset rules defined by `docs/specs/encoding-and-offsets.md`.

The first supported policy is UTF-8-first. UTF-8 with BOM is accepted. Other encodings are rejected unless the implementation explicitly adds an opt-in path with diagnostics and tests. Durable storage/index offsets are byte offsets. Public diagnostics may include byte offset, line, column, and optional JSON Pointer where known.

### Focus Area 5 — Integration with Prepared Document Import and Storage

Integrate ingestion jobs with the existing prepared-document import/store abstractions.

The ingestion layer must not bypass the prepared-document store. Successful jobs must produce a prepared document result that can be opened through the prepared-document store. Failed and cancelled jobs must not publish a ready prepared document.

### Focus Area 6 — Public Workflow Documentation

Add/update only directly affected preview public docs included in this package:

- `public-docs/guides/import-huge-json.md`
- `public-docs/diagnostics/import-diagnostics.md`

These docs must clearly separate currently implemented behavior from planned behavior. They must not imply package release readiness.

## Expected API Shape

Names may be adjusted to match repository conventions, but the implementation must preserve the following concepts.

```csharp
public interface IJsonIngestionSource
{
    string DisplayName { get; }
    long? Length { get; }
    string? ContentType { get; }

    ValueTask<Stream> OpenReadAsync(
        CancellationToken cancellationToken = default);
}
```

```csharp
public interface IJsonImportJobManager
{
    ValueTask<JsonImportJobHandle> StartAsync(
        IJsonIngestionSource source,
        JsonImportRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportJobStatus?> GetStatusAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportResult> WaitForCompletionAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask CancelAsync(
        string jobId,
        CancellationToken cancellationToken = default);
}
```

```csharp
public sealed record JsonImportDiagnostic(
    JsonImportDiagnosticSeverity Severity,
    string Code,
    string Message,
    long? ByteOffset = null,
    long? Line = null,
    long? Column = null,
    string? JsonPointer = null);
```

## Direct Documentation Impact

The implementation change must update these documents in the same change if behavior or naming differs from this package:

- `docs/specs/data-ingestion.md`
- `docs/specs/ingestion-sources.md`
- `docs/specs/import-jobs.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/encoding-and-offsets.md`
- `public-docs/guides/import-huge-json.md`
- `public-docs/diagnostics/import-diagnostics.md`

If new durable terms are introduced, update `docs/TERMINOLOGY.md` in the same change.

If the implementation changes prepared-document import/store/export behavior, update the directly affected prepared-document specs in the same change.

## Deferred Documentation Synchronization

Do not perform broad synchronization unless the task explicitly includes it.

The implementation PR should note that a later documentation synchronization pass should review:

- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/getting-started.md`
- `public-docs/concepts.md`
- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`

These are synchronization surfaces, not blockers for implementing the milestone unless the current change directly modifies their authority.

## Validation Expectations

Use the validation tiers defined by `docs/engineering/command-contract.md`.

### Focused validation

Run focused checks for the changed surface where practical:

- `./eng/build.sh` for .NET implementation changes;
- `./eng/public-docs.sh` when public docs in this package are changed;
- `./eng/frontend-check.sh` only if Blazor/TypeScript/browser integration is touched.

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

### Explicit-only validation

Do not run by default:

```bash
./eng/long-running-tests.sh [--fast]
./eng/public-api.sh
./eng/package-smoke.sh <version>
./eng/release-check.sh <version>
```

Explicit-only validation may include reduced-size import tests, 100 MB/500 MB import tests, many-document tests, and concurrent-session tests, but these must remain outside default Tier 1/Tier 2 validation unless a later task explicitly changes test policy.

## Required Fast Tests

Implement short-running tests for:

- stream source metadata and open-read behavior;
- file-path source metadata and open-read behavior using small temporary files;
- import job status transitions for successful small input;
- cancellation before source open;
- cancellation during import using a controllable test source;
- invalid JSON import failure when invalid JSON is not allowed;
- UTF-8 with BOM handling;
- unsupported encoding rejection or diagnostic behavior;
- diagnostic code creation and public-message stability;
- successful import result containing a prepared document reference;
- failed/cancelled import not publishing a ready prepared document.

All required fast tests must use small deterministic inputs and must not create huge documents.

## Explicit-Only Validation Definitions

Define or document explicit-only validation for:

- 100 MB import smoke test;
- 500 MB import smoke test;
- cancellation during large import;
- 100 prepared-document imports over a test store;
- 10 concurrent status readers while one import runs;
- import diagnostics over large malformed input.

These may be added as skipped/manual/explicit tests if the repository has the required mechanism. They must not be executed by normal `./eng/test.sh` or `./eng/check.sh`.

## Acceptance Criteria

The milestone is complete when:

- ingestion sources are implemented behind a stable abstraction;
- import jobs expose lifecycle status, progress, cancellation, completion, and result behavior;
- import diagnostics use stable codes and are documented;
- encoding and offset semantics are implemented and tested;
- successful import produces an openable prepared document through the prepared-document store;
- failed and cancelled imports do not publish ready prepared documents;
- public preview docs explain huge JSON import and diagnostics without implying release readiness;
- required fast tests pass;
- Tier 1 validation passes;
- Tier 2 validation is run when practical or an explicit reason is recorded;
- release/package/public API validation is not required for this milestone.

## Implementation Notes

Prefer simple in-process job management for the first implementation.

Progress values may be approximate. When source length is unknown, report bytes read and current step without a percentage.

The ingestion layer may store recent job status in memory. Durable job history is not required unless the storage engine already provides an appropriate manifest/status model.

The source abstraction should not expose file paths as a required public concept. File-path source is a default adapter, not the universal ingestion model.
