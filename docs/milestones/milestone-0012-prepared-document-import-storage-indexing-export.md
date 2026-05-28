# Milestone 0012 — Prepared Document Import, Storage, Indexing, and Export Contract

## Status

Active milestone implementation specification.

## Goal

Define and implement the first repository-supported contract for preparing huge JSON documents before interactive viewing or editing.

The milestone introduces the concept of a **Prepared Document**: a persistent internal representation created by reading a raw JSON source once, building required metadata and derived indexes, and exposing that prepared representation to the Blazor-facing viewer/editor runtime.

The intended lifecycle is:

```text
Raw JSON Source
  -> Document Import
  -> Prepared Document Store
  -> Prepared Document
  -> Interactive Document Session
  -> Transactions and Derived Index Updates
  -> Document Export
```

This milestone exists because huge JSON documents cannot be treated as ordinary in-memory strings. They require a preparation phase, durable internal state, rebuildable derived indexes, and an explicit export model.

## Problem Statement

Layer 1 currently focuses on interactive runtime behavior: tokenization, structural indexing, viewport rendering, folding, navigation, and fast tests. That is necessary but incomplete for huge files.

For huge documents, a user must first provide or store a source file somewhere. The repository should use that necessary input step to prepare an internal document model.

Without a prepared-document lifecycle:

- huge JSON files would need to be reparsed repeatedly;
- search and path navigation indexes would have unclear ownership;
- interactive edits would have no durable persistence model;
- exporting a changed huge file would be underspecified;
- public documentation would not be able to explain the end-user contract for huge-file workflows.

This milestone provides that missing contract.

## Architectural Position

A huge JSON file is not opened directly as a giant string in the Blazor component.

The user-facing contract is:

```text
For huge JSON documents, import the JSON stream first.
Import creates a prepared document with structural metadata and derived indexes.
The prepared document can be stored, reopened, edited incrementally, and exported back to JSON.
```

The prepared document is the durable unit of huge-document work.

The browser runtime should not own durable prepared-document storage. The browser runtime owns interactive state, viewport behavior, rendering coordination, local navigation state, and client-side caches. The .NET side owns import, prepared-document persistence, export, and the durable transaction log by default.

## Required Reading

Before implementation, read:

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/SPECS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/MILESTONES.md`
- `docs/TBPS.md`
- `docs/GUARDRAILS.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `docs/RESEARCH.md`
- `docs/research/project-setup-guide-v5.md`
- `docs/research/engineering-guide-v4.md`
- `docs/specs/json-tokenizer.md`
- `docs/specs/structural-index.md`
- `docs/specs/document-session.md`
- `docs/specs/viewport-model.md`
- `docs/specs/path-navigation.md`
- `docs/specs/runtime-protocol.md`
- `docs/guardrails/testing.md`
- `docs/guardrails/implementation.md`
- `docs/guardrails/languages/dotnet.md`
- `docs/guardrails/languages/typescript.md`
- `docs/tbps/feature-implementation.md`
- `docs/tbps/create-spec.md`
- `docs/tbps/create-milestone.md`
- `docs/tbps/public-documentation-update.md`

If any referenced document does not exist yet, create or update it as required by this milestone and by repository standards.

## Scope

This milestone covers the first implementation-ready contract for:

- raw JSON source import;
- prepared document identity and metadata;
- prepared document store abstraction;
- prepared document manifest;
- basic source chunk storage model;
- derived index ownership;
- initial search index contract;
- durable transaction log contract;
- prepared document session opening;
- JSON export from prepared state;
- public documentation for huge-file workflows;
- minimal validation and fast tests.

The implementation may be simple and file-backed initially. The important outcome is the stable lifecycle and contract, not an optimized storage engine.

## Non-Goals

This milestone must not implement:

- full optimized storage engine;
- distributed storage;
- cloud object storage provider;
- database-backed prepared-document store;
- browser IndexedDB prepared-document persistence;
- full-text search engine with advanced ranking;
- schema-aware indexes;
- Layer 2 schema overlays;
- Layer 3 projections;
- collaborative editing;
- full compaction engine;
- byte-identical output guarantee for all edited regions;
- arbitrary free-form text editor behavior;
- public package release.

## Terminology to Add or Update

Update `docs/TERMINOLOGY.md` with the following terms.

### Raw JSON Source

The original JSON input stream supplied by the user before repository-specific preparation occurs.

### Prepared Document

A persistent internal representation of an imported JSON source, including source storage, metadata, derived indexes, and change tracking required for efficient viewing, navigation, search, editing, and export.

### Prepared Document Store

The durable storage abstraction responsible for creating, opening, listing, and deleting prepared documents.

### Document Import

The process of reading a raw JSON source once and creating a prepared document.

### Document Export

The process of materializing the current prepared document state as JSON.

### Derived Index

A rebuildable index created from document content or transactions, such as a structural index, line index, path index, or search index.

### Search Index

A derived index used to support search over a prepared document without scanning only visible viewport rows.

### Transaction Log

A durable sequence of edits applied to a prepared document after import or the latest compaction point.

### Compaction

The process of incorporating transactions into a newer prepared representation to reduce replay cost or storage fragmentation.

### Export Policy

A policy that defines how JSON output is generated from prepared document state, especially for unchanged and changed regions.

### Format Preservation

The degree to which exported JSON preserves original source bytes, whitespace, ordering, and formatting.

## User-Facing Contract

The public contract for huge JSON documents is:

```text
For small JSON documents, BlazorJsonVisualizer may open JSON directly.

For huge JSON documents, the JSON source is imported first.
Import creates a prepared document with structural metadata and derived indexes.
The prepared document can be stored, reopened, viewed, searched, edited incrementally, and exported back to JSON.
The original source is not rewritten on every edit. Changes are tracked as transactions and materialized during export or compaction.
```

Initial format-preservation contract:

```text
Unchanged regions should be preserved byte-for-byte where practical.
Changed regions may be normalized according to the selected export policy.
```

The repository must not promise full byte-identical export after edits unless a later spec explicitly defines and validates that behavior.

## Required Documents to Create

Create these specs:

```text
docs/specs/prepared-document.md
docs/specs/document-import.md
docs/specs/prepared-document-store.md
docs/specs/document-export.md
docs/specs/search-index.md
docs/specs/transaction-log.md
```

Create or update this milestone document in the repository:

```text
docs/milestones/milestone-0012-prepared-document-import-storage-indexing-export.md
```

Create or update public documentation:

```text
public-docs/concepts.md
public-docs/getting-started.md
public-docs/samples.md
public-docs/guides/huge-json-documents.md
```

If `public-docs/guides/` does not exist, create it without a README file.

## Required Documents to Update

Update:

```text
docs/SPECS.md
docs/TERMINOLOGY.md
docs/ARCHITECTURE.md
docs/MILESTONES.md
docs/PUBLIC-DOCS.md
docs/ENGINEERING.md
docs/GUARDRAILS.md
docs/guardrails/testing.md
docs/guardrails/implementation.md
docs/specs/runtime-protocol.md
docs/specs/document-session.md
docs/specs/structural-index.md
docs/specs/path-navigation.md
docs/specs/sample-hosting.md
README.md
AGENTS.md
.github/copilot-instructions.md
```

Update additional documents only if directly required by repository standards or by a concrete implementation change.

## Proposed Spec Content — `docs/specs/prepared-document.md`

```md
# Prepared Document Specification

## Goal

Define the persistent internal representation created from a raw JSON source before interactive viewing or editing.

## Scope

This specification covers prepared document identity, metadata, manifest structure, derived index ownership, transaction log relationship, and prepared document lifecycle.

## Non-Goals

This specification does not define:

- the complete physical file format;
- optimized storage layout;
- cloud or database persistence;
- browser IndexedDB persistence;
- schema overlays;
- projection plugins.

## Core Model

A prepared document is a durable repository-managed representation of an imported JSON source.

A prepared document may contain:

- source chunks;
- manifest metadata;
- tokenizer output or token index;
- structural index;
- line/offset index;
- search index;
- path index;
- transaction log;
- export metadata;
- optional snapshots or compaction artifacts.

The prepared document is not a JavaScript object tree and is not required to fit fully in memory.

## Identity

```csharp
public readonly record struct PreparedDocumentId(string Value);
```

Prepared document identifiers are stable within a prepared document store.

## Manifest

Each prepared document must have a manifest.

Minimum manifest model:

```json
{
  "formatVersion": 1,
  "documentId": "...",
  "sourceLength": 0,
  "sourceHash": null,
  "createdAt": "2026-01-01T00:00:00Z",
  "latestRevision": 1,
  "indexes": {
    "structure": { "version": 1, "state": "ready" },
    "search": { "version": 1, "state": "ready" }
  },
  "transactions": {
    "count": 0,
    "latestRevision": 1
  }
}
```

The implementation may use a typed model instead of raw JSON internally, but the persisted manifest must be versioned.

## Revision Semantics

The initial prepared document revision is `1`.

Import creates revision `1`.

Read-only operations do not change the revision.

Editing transactions increment the prepared document revision.

## Derived Indexes

Derived indexes are rebuildable artifacts.

A prepared document may be considered openable when required indexes are ready or can be rebuilt.

Index state values:

```text
missing
building
ready
stale
failed
```

## Authority

This document is authoritative for:

- prepared document identity;
- prepared document lifecycle;
- prepared document manifest semantics;
- derived index ownership;
- revision relationship between import and transactions.

This document is not authoritative for:

- tokenizer lexical behavior;
- structural index node semantics;
- viewport behavior;
- public documentation wording.

## Document Contract

When this spec changes, review:

- docs/specs/document-import.md
- docs/specs/prepared-document-store.md
- docs/specs/document-export.md
- docs/specs/search-index.md
- docs/specs/transaction-log.md
- docs/specs/document-session.md
- docs/TERMINOLOGY.md
- docs/PUBLIC-DOCS.md
- public-docs/concepts.md
```

## Proposed Spec Content — `docs/specs/document-import.md`

```md
# Document Import Specification

## Goal

Define how raw JSON sources are imported into prepared documents.

## Scope

This specification covers streaming input, import options, import output, failure semantics, cancellation, and minimum derived artifacts created during import.

## Input Sources

The .NET import API must support `Stream` as the initial input abstraction.

`PipeReader` may be added later, but is not required for the first implementation.

## Public API Shape

Initial API:

```csharp
public interface IJsonDocumentImporter
{
    ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken = default);
}
```

Options:

```csharp
public sealed record JsonDocumentImportOptions
{
    public string? DocumentId { get; init; }
    public bool BuildSearchIndex { get; init; } = true;
    public bool BuildPathIndex { get; init; } = true;
    public bool AllowInvalidJson { get; init; } = false;
}
```

Output:

```csharp
public sealed record PreparedJsonDocumentInfo(
    string DocumentId,
    long SourceLength,
    string? SourceHash,
    JsonDocumentPreparationState State,
    DateTimeOffset CreatedAt);
```

Preparation state:

```csharp
public enum JsonDocumentPreparationState
{
    Preparing,
    Ready,
    Failed
}
```

## Required Import Behavior

Import must:

- read the raw JSON source stream once;
- create a prepared document manifest;
- persist source content or source chunks;
- build or schedule required derived indexes;
- report preparation result;
- honor cancellation where practical;
- avoid materializing the full JSON object tree as the canonical model.

## Invalid JSON

If `AllowInvalidJson` is `false`, invalid JSON should fail import with a structured failure.

If `AllowInvalidJson` is `true`, import may create a prepared document with diagnostic/index state that records invalid regions.

The first implementation may support only `AllowInvalidJson = false` if documented.

## Failure Semantics

Normal import failures should be reported as structured results or typed exceptions. Programmer errors may throw directly.

Import failure must not leave a prepared document in `Ready` state.

Partial artifacts must either be cleaned up or marked as failed.

## Authority

This document is authoritative for:

- import input contract;
- import options;
- import output;
- import failure semantics;
- minimum import artifacts.

This document is not authoritative for:

- exact physical storage layout;
- UI progress presentation;
- export behavior.

## Document Contract

When this spec changes, review:

- docs/specs/prepared-document.md
- docs/specs/prepared-document-store.md
- docs/specs/search-index.md
- docs/ENGINEERING.md
- docs/PUBLIC-DOCS.md
- public-docs/getting-started.md
```

## Proposed Spec Content — `docs/specs/prepared-document-store.md`

```md
# Prepared Document Store Specification

## Goal

Define the durable abstraction used to create, open, list, and delete prepared documents.

## Scope

This specification covers store responsibilities, handles, local file-backed implementation expectations, and ownership boundaries.

## Store Interface

```csharp
public interface IPreparedJsonDocumentStore
{
    ValueTask<PreparedJsonDocumentInfo?> GetAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(
        CancellationToken cancellationToken = default);

    ValueTask<PreparedJsonDocumentHandle> OpenAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask DeleteAsync(
        string documentId,
        CancellationToken cancellationToken = default);
}
```

## Handle

A prepared document handle represents an opened prepared document.

The handle may expose repository-internal services for source ranges, derived indexes, transaction log access, and export support.

The handle must be disposable if it owns resources.

## Initial Store Implementation

The first implementation should be a local file-backed prepared document store.

Suggested layout:

```text
prepared-documents/
  <document-id>/
    manifest.json
    source.chunks
    tokens.index
    structure.index
    lines.index
    search.index
    transactions.log
    snapshots/
```

Exact file names may change if documented. The manifest must remain the versioned entry point.

## Ownership Boundary

The .NET side owns durable prepared-document storage.

The browser runtime may cache viewport data and ranges but must not be the canonical durable prepared-document store.

## Authority

This document is authoritative for:

- prepared document store responsibilities;
- store interface expectations;
- initial local store boundary;
- durable ownership rules.

This document is not authoritative for:

- browser rendering;
- tokenization details;
- search ranking.

## Document Contract

When this spec changes, review:

- docs/specs/prepared-document.md
- docs/specs/document-import.md
- docs/specs/document-export.md
- docs/specs/document-session.md
- docs/ENGINEERING.md
```

## Proposed Spec Content — `docs/specs/document-export.md`

```md
# Document Export Specification

## Goal

Define how the current prepared document state is materialized as JSON.

## Scope

This specification covers export input, destination stream, formatting policy, changed-region behavior, unchanged-region preservation, and failure semantics.

## Public API Shape

```csharp
public interface IJsonDocumentExporter
{
    ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);
}
```

Options:

```csharp
public sealed record JsonDocumentExportOptions
{
    public JsonExportFormattingPolicy FormattingPolicy { get; init; } =
        JsonExportFormattingPolicy.PreserveUnchangedRegions;
}

public enum JsonExportFormattingPolicy
{
    PreserveUnchangedRegions,
    MinifyChangedRegions,
    PrettyPrintChangedRegions
}
```

## Export Contract

Export materializes the current prepared document state by applying transactions to the imported source representation.

The implementation must not require rewriting the original source file on every edit.

## Format Preservation

Initial contract:

```text
Unchanged regions should be preserved byte-for-byte where practical.
Changed regions may be normalized according to the selected export policy.
```

Full byte-identical export after edits is not guaranteed unless later specs explicitly define it.

## Failure Semantics

Export should fail clearly if:

- the prepared document does not exist;
- the prepared document is not ready;
- required transaction data is missing;
- required source chunks are missing;
- the destination stream is not writable;
- cancellation is requested.

## Authority

This document is authoritative for:

- export API shape;
- export policy semantics;
- changed and unchanged region export contract;
- export failure semantics.

This document is not authoritative for:

- transaction contents;
- UI save behavior;
- storage layout.

## Document Contract

When this spec changes, review:

- docs/specs/prepared-document.md
- docs/specs/transaction-log.md
- docs/PUBLIC-DOCS.md
- public-docs/concepts.md
- public-docs/guides/huge-json-documents.md
```

## Proposed Spec Content — `docs/specs/search-index.md`

```md
# Search Index Specification

## Goal

Define the first search index contract for prepared JSON documents.

## Scope

This specification covers search index ownership, minimum indexed content, rebuildability, query behavior, and update relationship to transactions.

## Search Index Role

Search indexes are derived artifacts of a prepared document.

They are not canonical JSON truth and may be rebuilt from source chunks plus transactions.

## Initial Indexed Content

The first implementation should support at least:

- property-name search;
- string-literal search;
- primitive literal search where practical;
- offset/range result mapping;
- node id mapping when structural index data is available.

Advanced full-text ranking is not required.

## Result Model

```csharp
public sealed record JsonSearchResult(
    string DocumentId,
    long StartOffset,
    long EndOffset,
    string? NodeId,
    string PreviewText);
```

## Query Contract

The first query model may be simple substring search.

Search must not be limited to visible viewport rows.

Search may be case-sensitive by default if documented.

## Index State

Search index state follows derived-index states:

```text
missing
building
ready
stale
failed
```

If the search index is stale after transactions, search may:

- rebuild before searching;
- search source plus transaction overlay;
- return a clear stale-index failure.

The chosen behavior must be documented.

## Authority

This document is authoritative for:

- search index ownership;
- minimum search behavior;
- search result shape;
- search index state semantics.

This document is not authoritative for:

- viewport highlighting;
- schema-aware search;
- ranking algorithms.

## Document Contract

When this spec changes, review:

- docs/specs/prepared-document.md
- docs/specs/structural-index.md
- docs/specs/path-navigation.md
- public-docs/concepts.md
```

## Proposed Spec Content — `docs/specs/transaction-log.md`

```md
# Transaction Log Specification

## Goal

Define durable change tracking for prepared documents.

## Scope

This specification covers transaction log purpose, revision relationship, append-only behavior, replay role, and compaction boundary.

## Transaction Log Role

The transaction log records edits applied to a prepared document after import or the latest compaction point.

The transaction log enables:

- durable incremental changes;
- export without rewriting the original source on every edit;
- rebuilding derived indexes;
- future undo/redo or history features if later selected.

## Initial Contract

The first implementation may support no-op or simple replacement transactions sufficient to prove persistence and export wiring.

A transaction must include:

- transaction id;
- base revision;
- resulting revision;
- timestamp;
- operation payload;
- affected source/document range where applicable.

## Append Behavior

Transactions are appended in revision order.

A transaction must not silently apply to the wrong base revision.

## Compaction

Compaction is out of scope for the first implementation, but the transaction log must not prevent future compaction.

A later compaction process may produce a new source representation and reset or checkpoint the transaction log.

## Authority

This document is authoritative for:

- durable transaction log purpose;
- revision relationship;
- basic transaction metadata;
- compaction boundary.

This document is not authoritative for:

- complete editing operation catalog;
- undo/redo behavior;
- UI editing gestures.

## Document Contract

When this spec changes, review:

- docs/specs/prepared-document.md
- docs/specs/document-export.md
- docs/specs/document-session.md
- docs/specs/runtime-protocol.md
```

## Runtime and API Implementation Expectations

The first implementation should create a minimal .NET-side service layer and connect it to the runtime architecture without over-optimizing.

Suggested .NET files or equivalent:

```text
src/BlazorJsonVisualizer/PreparedDocuments/PreparedDocumentId.cs
src/BlazorJsonVisualizer/PreparedDocuments/PreparedJsonDocumentInfo.cs
src/BlazorJsonVisualizer/PreparedDocuments/JsonDocumentImportOptions.cs
src/BlazorJsonVisualizer/PreparedDocuments/JsonDocumentExportOptions.cs
src/BlazorJsonVisualizer/PreparedDocuments/IJsonDocumentImporter.cs
src/BlazorJsonVisualizer/PreparedDocuments/IPreparedJsonDocumentStore.cs
src/BlazorJsonVisualizer/PreparedDocuments/IJsonDocumentExporter.cs
src/BlazorJsonVisualizer/PreparedDocuments/FilePreparedJsonDocumentStore.cs
src/BlazorJsonVisualizer/PreparedDocuments/FileJsonDocumentImporter.cs
src/BlazorJsonVisualizer/PreparedDocuments/FileJsonDocumentExporter.cs
```

Suggested runtime protocol additions:

```text
OpenPreparedDocument
ClosePreparedDocument
GetPreparedDocumentInfo
RequestSourceRange
RequestSearch
RevealSearchResult
```

Do not expose internal store file formats as public API unless explicitly required.

## Testing Requirements

All tests created by this milestone are short-running unless explicitly marked otherwise.

Required fast tests:

- import small JSON stream into prepared document;
- manifest is created;
- prepared document can be listed;
- prepared document can be opened;
- structural/index metadata is created or marked ready;
- search index can return simple property/string results or a documented placeholder behavior;
- transaction log exists and starts at revision 1 or empty state;
- export without edits produces valid JSON;
- cancellation and invalid input behavior are covered at small scale;
- delete removes prepared document artifacts.

Do not add huge-file stress tests in this milestone. Huge-file validation belongs to a later explicit long-running workflow.

## Public Documentation Requirements

Update public documentation so users understand the huge-file lifecycle.

At minimum, document:

- small document direct-open path, if supported;
- huge document import path;
- prepared document concept;
- prepared document storage responsibility;
- search/index preparation;
- transaction-based editing concept;
- export concept;
- initial format preservation limitations;
- that release readiness may not be complete yet if package publishing is not implemented.

Suggested public wording:

```text
Huge JSON files are imported before they are opened interactively. Import creates a prepared document with structural metadata and derived indexes. The prepared document can be reopened, searched, edited incrementally, and exported back to JSON. The original source is not rewritten on every edit.
```

## Engineering Requirements

Update engineering documentation only where the prepared document workflow affects commands or validation.

If a new sample is added, update:

```text
docs/engineering/samples.md
public-docs/samples.md
public-docs/samples/
eng/samples.sh
```

If new public API is added, update public API documentation and ensure public API validation strategy is not contradicted.

Do not add release readiness implementation unless directly required by existing repository standards.

## Suggested Execution Order

1. Update terminology.
2. Create prepared-document specs.
3. Update spec indexes and related existing specs.
4. Create minimal .NET service contracts.
5. Implement file-backed prepared document store.
6. Implement stream import for small/medium files.
7. Persist manifest and source representation.
8. Add minimal derived index ownership and search-index placeholder or simple implementation.
9. Add transaction log initial structure.
10. Add export without edits and simple transaction-aware export if feasible.
11. Update public documentation.
12. Add fast tests.
13. Update milestone index and documentation contracts.

## Validation

Run the smallest relevant validation set from repository command contracts.

Expected validation includes:

```text
./eng/restore.sh
./eng/build.sh
./eng/test.sh
./eng/public-docs.sh
./eng/check.sh
```

Run `./eng/public-docs.sh` only if public documentation support exists as part of the V5/V4 upgrade.

Do not run long-running tests, benchmarks, package smoke tests, or release checks unless explicitly requested.

If validation fails, document:

- exact command;
- relevant output summary;
- whether failure is pre-existing or introduced;
- follow-up required.

## Exit Criteria

This milestone is complete when:

- prepared document terminology exists;
- all required specs exist and are indexed;
- the milestone document is added under `docs/milestones/` and `docs/MILESTONES.md` is updated;
- a minimal import API accepts a `Stream` and creates a prepared document;
- a prepared document manifest is persisted;
- a prepared document store can get, list, open, and delete prepared documents;
- import creates or records required derived index states;
- search index ownership is implemented or clearly represented as a rebuildable placeholder;
- transaction log structure exists;
- export can materialize the current prepared document state as JSON for at least the no-edit case;
- public docs explain the huge-file prepared-document lifecycle;
- fast tests cover import, store, manifest, opening, export, and failure behavior;
- no non-root README files are introduced;
- validation results are recorded.

## Labels

Suggested GitHub labels:

```text
milestone
layer-1
architecture
specification
public-docs
implementation
```
