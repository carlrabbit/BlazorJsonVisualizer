# Milestone 0013 — Department-Scale Prepared Document Storage Engine

## Status

Active milestone implementation specification.

## Goal

Implement the first real prepared document storage engine for huge JSON documents.

The engine must support the prepared document lifecycle defined by Milestone 0012 and provide a pragmatic 80/20 implementation suitable for department-scale usage:

- approximately 100 prepared documents per store;
- approximately 10 concurrent users or sessions in one application process;
- import and export of huge JSON documents without loading the complete document as one string;
- acceptable multi-second search latency for approximately 500 MB JSON documents;
- a replaceable storage abstraction so the default file-backed implementation can later be substituted by a different local, database, or object-storage-backed implementation.

The milestone should deliver a usable default engine, not only interfaces.

## Relationship to Milestone 0012

Milestone 0012 defines the prepared document lifecycle and public contract:

```text
Raw JSON Source
  -> Document Import
  -> Prepared Document
  -> Prepared Document Store
  -> Document Session
  -> Search / Navigation / Editing
  -> Document Export
```

Milestone 0013 implements the first optimized storage engine for that lifecycle.

Milestone 0012 is contract-oriented.
Milestone 0013 is storage-engine-oriented.

## Scope

This milestone implements:

- a storage abstraction layer for prepared document persistence;
- a default file-backed prepared document storage provider;
- a versioned prepared document storage layout;
- streaming import into prepared storage;
- chunked source storage;
- persisted metadata and manifest handling;
- persisted line, structural, and basic search indexes;
- document open, list, metadata, and delete operations;
- read handles for prepared documents;
- a clear concurrency model for departmental use;
- export from prepared document storage;
- cleanup and recovery behavior for failed imports;
- public and internal documentation for the prepared storage engine;
- fast tests for storage-engine behavior;
- explicit long-running validation definitions for huge-file scenarios.

## Non-Goals

This milestone must not implement:

- distributed storage;
- cloud object storage provider implementation;
- database-backed provider implementation;
- multi-process distributed locking;
- collaborative multi-writer editing;
- conflict resolution between concurrent writers;
- schema-aware indexes;
- advanced query language;
- fuzzy search;
- relevance ranking;
- Lucene-style full-text search;
- browser IndexedDB storage;
- complete transaction compaction;
- full editing UI integration;
- Layer 2 schema overlays;
- Layer 3 projections;
- GitHub Pages publication;
- package publishing.

The storage abstraction must allow future provider implementations, but this milestone only implements the default file-backed provider.

## Department-Scale Targets

These are design targets, not hard performance benchmark gates for default fast validation.

| Target | Expectation |
|---|---|
| Prepared documents per store | Approximately 100 |
| Concurrent users or sessions | Approximately 10 in one application process |
| Huge document size | Approximately 500 MB JSON source |
| Import behavior | Streaming; must not load full source as one string |
| Open prepared document | Must not reparse the complete source |
| Search latency | A few seconds is acceptable for 500 MB documents |
| Export behavior | Streaming; must not require a full output string in memory |
| Write concurrency | Single writer per prepared document |
| Read concurrency | Multiple concurrent readers per prepared document |

## Required Reading

Before implementation, read:

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/SPECS.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `docs/WORKFLOWS.md`
- `docs/RESEARCH.md`
- `docs/milestones/milestone-0012-prepared-document-import-storage-indexing-export.md`

After creation or update, also read:

- `docs/specs/prepared-document.md`
- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `docs/specs/transaction-log.md`
- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/file-prepared-document-store.md`
- `docs/specs/prepared-document-storage-format.md`
- `docs/specs/prepared-document-concurrency.md`
- `docs/specs/prepared-document-search-engine.md`

## Terminology

Update `docs/TERMINOLOGY.md` with these terms if they do not already exist.

### Prepared Document Storage Engine

A component that persists prepared document artifacts and provides access to source chunks, manifests, indexes, transaction logs, and export data.

### Prepared Document Storage Provider

A replaceable implementation of the storage abstraction used by the prepared document storage engine.

### File-Backed Prepared Document Store

The default storage provider that stores prepared document artifacts in a versioned directory layout on a filesystem.

### Storage Abstraction

The interface layer that defines the storage operations required by prepared document import, open, indexing, search, transaction logging, export, cleanup, and deletion.

### Storage Object

A named persistent item owned by a storage provider, such as a manifest, chunk, index file, transaction log, or temporary import artifact.

### Storage Lease

A handle that reserves access to a prepared document or storage object for a bounded operation, such as read, write, import, export, or delete.

### Storage Format Version

A version number that identifies the internal prepared document storage layout and record formats.

### Source Chunk

A bounded slice of the imported JSON source stored independently so range reads and streaming export do not require loading the whole source.

### Index Artifact

A persisted derived file or object containing rebuildable index data, such as line offsets, structural nodes, search terms, or path mappings.

### Package Smoke Test

A release-oriented test that consumes packed artifacts as an external user would. Package smoke tests are explicit-only and must not run in the default fast test path.

## Architecture

The prepared document storage architecture has three layers.

```text
Prepared Document APIs
  import, open, list, delete, search, export

Storage Engine
  document lifecycle, manifest, locks, indexes, transactions, recovery

Storage Provider Abstraction
  object read/write, atomic commit, leases, directory/list operations, delete

Default Provider
  file-backed implementation
```

The prepared document API must not expose the default file-backed layout as its public contract.

The file-backed provider is the default implementation, not the permanent abstraction boundary.

## Storage Abstraction Requirements

The storage abstraction must describe the assumptions required by the engine without forcing all future providers to be filesystems.

The abstraction should support object-like operations rather than raw path manipulation.

Required capabilities:

- create a prepared document container;
- write temporary storage objects;
- atomically promote temporary objects to committed objects where practical;
- read committed objects as streams;
- open bounded range reads where supported;
- list document containers;
- list objects inside a document container;
- delete committed objects;
- delete an entire document container;
- acquire read leases;
- acquire write leases;
- detect incomplete or failed imports;
- expose provider capabilities;
- report clear errors for unsupported operations.

The abstraction must not require:

- POSIX paths;
- Windows paths;
- memory-mapped files;
- file handles as public API;
- hard links;
- sparse files;
- filesystem watches;
- cross-process distributed locks;
- transactional filesystem semantics.

## Storage Provider Assumptions

The engine may assume the selected provider supports the following minimum semantics.

### Object Identity

A storage object is addressed by:

```text
DocumentId + ObjectKind + ObjectName
```

The engine must not assume that object names are physical paths.

### Read-After-Commit

After a write operation commits successfully, subsequent reads in the same process must see the committed object.

### Temporary Writes

The provider must support temporary writes that do not appear as committed objects until explicitly committed.

For the file-backed provider, this should be implemented with temporary files and atomic rename where practical.

### Atomic Commit Scope

The minimum atomic operation is a single storage object commit.

The engine must not assume that a group of multiple object commits is atomic.

Multi-object state transitions must be coordinated through the manifest.

### Manifest as State Authority

The manifest is the authoritative state marker for prepared document readiness.

Indexes and chunks may exist before the manifest says they are ready, but consumers must not treat the document as ready until the manifest allows it.

### Delete Semantics

Delete must be safe and explicit.

If a document is open, delete may either:

- fail with a clear active-handle error; or
- mark the document for deletion after handles close.

The default file-backed implementation should initially fail deletion when active handles exist.

### Locking Semantics

The abstraction must support process-local reader/writer coordination.

Future providers may implement stronger locking, but Milestone 0013 only requires one-process coordination.

### Range Reads

The provider should support range reads for large objects.

If a provider cannot support efficient native range reads, it may emulate them by seeking or streaming and discarding data, but it must report this in capabilities.

### Capability Reporting

Expose capabilities such as:

```text
SupportsAtomicObjectCommit
SupportsRangeRead
SupportsConcurrentReaders
SupportsSingleWriterLock
SupportsObjectListing
SupportsTemporaryObjects
```

The engine can then fail early if a provider is insufficient.

## Proposed Storage Abstraction API

Names may be adjusted to match repository conventions, but the design must preserve the abstraction boundary.

```csharp
public interface IPreparedDocumentStorageProvider
{
    ValueTask<PreparedDocumentStorageCapabilities> GetCapabilitiesAsync(
        CancellationToken cancellationToken = default);

    ValueTask<PreparedDocumentContainer> CreateContainerAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedDocumentContainer?> TryOpenContainerAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<PreparedDocumentContainerInfo> ListContainersAsync(
        CancellationToken cancellationToken = default);

    ValueTask DeleteContainerAsync(
        string documentId,
        CancellationToken cancellationToken = default);
}
```

```csharp
public abstract class PreparedDocumentContainer
{
    public abstract string DocumentId { get; }

    public abstract ValueTask<PreparedDocumentReadLease> AcquireReadLeaseAsync(
        CancellationToken cancellationToken = default);

    public abstract ValueTask<PreparedDocumentWriteLease> AcquireWriteLeaseAsync(
        CancellationToken cancellationToken = default);

    public abstract ValueTask<bool> ObjectExistsAsync(
        PreparedDocumentObjectName name,
        CancellationToken cancellationToken = default);

    public abstract ValueTask<Stream> OpenReadAsync(
        PreparedDocumentObjectName name,
        CancellationToken cancellationToken = default);

    public abstract ValueTask<Stream> OpenRangeReadAsync(
        PreparedDocumentObjectName name,
        long startOffset,
        long length,
        CancellationToken cancellationToken = default);

    public abstract ValueTask<PreparedDocumentObjectWriter> CreateTemporaryObjectAsync(
        PreparedDocumentObjectName name,
        CancellationToken cancellationToken = default);

    public abstract IAsyncEnumerable<PreparedDocumentObjectInfo> ListObjectsAsync(
        CancellationToken cancellationToken = default);
}
```

```csharp
public abstract class PreparedDocumentObjectWriter : IAsyncDisposable
{
    public abstract Stream Stream { get; }

    public abstract ValueTask CommitAsync(
        CancellationToken cancellationToken = default);

    public abstract ValueTask AbortAsync(
        CancellationToken cancellationToken = default);
}
```

```csharp
public sealed record PreparedDocumentStorageCapabilities(
    bool SupportsAtomicObjectCommit,
    bool SupportsRangeRead,
    bool SupportsConcurrentReaders,
    bool SupportsSingleWriterLock,
    bool SupportsObjectListing,
    bool SupportsTemporaryObjects);
```

```csharp
public readonly record struct PreparedDocumentObjectName(string Value);
```

The public prepared document API should use higher-level services and handles. Most application users should not need to use the storage provider directly.

## Default File-Backed Provider

Implement a default file-backed provider.

Suggested name:

```text
FilePreparedDocumentStorageProvider
```

Suggested namespace:

```text
BlazorJsonVisualizer.Storage
```

The provider owns a root directory configured by options.

```csharp
public sealed record FilePreparedDocumentStorageOptions
{
    public required string RootDirectory { get; init; }
    public int SourceChunkSizeBytes { get; init; } = 1024 * 1024;
    public bool CreateRootDirectory { get; init; } = true;
}
```

The provider must keep all generated storage artifacts under the configured root directory.

The provider must reject document IDs or object names that attempt path traversal.

## File-Backed Layout

The initial file-backed layout should be versioned and internal.

Suggested layout:

```text
prepared-documents/
  <document-id>/
    manifest.json
    source/
      chunks/
        0000000000.chunk
        0000000001.chunk
      chunks.index
    indexes/
      lines.index
      tokens.index
      structure.index
      search.index
      paths.index
    transactions/
      log.jsonl
    locks/
    temp/
```

Only the manifest and documented high-level behavior are contractually meaningful.

Physical filenames are implementation details unless a spec explicitly says otherwise.

## Manifest

Every prepared document must have a manifest.

The manifest coordinates state transitions across non-atomic multi-object writes.

Suggested schema:

```json
{
  "formatVersion": 1,
  "documentId": "01J...",
  "state": "ready",
  "createdAt": "2026-05-28T00:00:00Z",
  "updatedAt": "2026-05-28T00:00:00Z",
  "sourceLengthBytes": 524288000,
  "sourceHash": "sha256:...",
  "sourceEncoding": "utf-8",
  "sourceChunkSizeBytes": 1048576,
  "latestRevision": 1,
  "indexes": {
    "line": { "version": 1, "state": "ready" },
    "token": { "version": 1, "state": "ready" },
    "structure": { "version": 1, "state": "ready" },
    "search": { "version": 1, "state": "ready" },
    "path": { "version": 1, "state": "notBuilt" }
  },
  "transactions": {
    "state": "ready",
    "count": 0
  }
}
```

Required manifest states:

```text
importing
ready
failed
deleting
```

A document may be opened only when the manifest state is `ready`.

A failed import must leave enough information for diagnostics and cleanup.

## Source Chunk Storage

The imported JSON source must be stored in bounded chunks.

Requirements:

- default chunk size should be 1 MiB or 4 MiB;
- chunk size must be recorded in the manifest;
- source chunks must support streaming export;
- source chunks must support range reads through the storage abstraction;
- source chunk storage must not require loading the full JSON source as one string;
- chunk boundaries must handle UTF-8 decoding boundaries correctly when text decoding is required.

The storage engine may store raw UTF-8 bytes as source chunks.

The line and token indexes must provide enough offset information for text operations.

## Offset Model

The milestone must explicitly define offset semantics.

Recommended model:

- persisted source offsets are byte offsets into the original UTF-8 source;
- browser/runtime text offsets may use UTF-16 code units where needed;
- conversion between persisted byte offsets and UI text offsets must go through documented index services;
- no component may silently mix byte offsets and UTF-16 offsets.

Risks around multi-byte characters and chunk boundaries must be tested.

## Import Pipeline

Implement streaming import from `Stream`.

Minimum import pipeline:

```text
Stream
  -> source chunk writer
  -> line index builder
  -> tokenizer scan
  -> structural index builder
  -> basic search index builder
  -> manifest commit
```

Import must:

- create a temporary container or temporary objects;
- write manifest state as `importing` during import;
- build required storage artifacts;
- commit the manifest as `ready` only after required artifacts are complete;
- mark the document `failed` or clean up temporary artifacts if import fails;
- observe cancellation;
- not expose partially imported documents as ready.

## Prepared Document Store API

The higher-level prepared document store should use the storage provider abstraction.

```csharp
public interface IPreparedJsonDocumentStore
{
    ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        PreparedJsonDocumentImportOptions options,
        CancellationToken cancellationToken = default);

    ValueTask<PreparedJsonDocumentHandle> OpenAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    IAsyncEnumerable<PreparedJsonDocumentInfo> ListAsync(
        CancellationToken cancellationToken = default);

    ValueTask DeleteAsync(
        string documentId,
        CancellationToken cancellationToken = default);
}
```

The store API is the application-facing API.

The storage provider API is the replacement-provider API.

## Prepared Document Handle API

The opened document handle should provide high-level operations.

```csharp
public abstract class PreparedJsonDocumentHandle : IAsyncDisposable
{
    public abstract string DocumentId { get; }
    public abstract long Revision { get; }

    public abstract ValueTask<Stream> OpenSourceRangeAsync(
        long startOffset,
        long length,
        CancellationToken cancellationToken = default);

    public abstract IAsyncEnumerable<PreparedDocumentSearchResult> SearchAsync(
        PreparedDocumentSearchQuery query,
        CancellationToken cancellationToken = default);

    public abstract ValueTask ExportAsync(
        Stream destination,
        PreparedJsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);
}
```

The handle must not expose physical file paths as its contract.

## Indexes

Persist the following indexes.

### Line Index

The line index maps line numbers and source offsets.

It must support:

- source offset to line/column lookup;
- line to source offset lookup;
- previews around search results;
- diagnostics reporting;
- export/debug support.

### Structural Index

The persisted structural index must support:

- node id;
- node kind;
- parent id;
- depth;
- start offset;
- end offset;
- child or traversal relationships;
- property name reference when applicable.

The format may be binary or line-based, but it must be versioned.

### Search Index

The first search index should be deliberately simple.

It should support:

- literal search;
- case-sensitive and case-insensitive mode;
- property-name search;
- string-value search;
- result limits;
- continuation/paging;
- previews based on source ranges.

It does not need:

- fuzzy search;
- stemming;
- ranking;
- query language;
- cross-document search;
- schema-aware search.

Suggested query type:

```csharp
public sealed record PreparedDocumentSearchQuery(
    string Text,
    bool IgnoreCase = true,
    PreparedDocumentSearchScope Scope = PreparedDocumentSearchScope.AllText,
    int MaxResults = 100,
    string? ContinuationToken = null);
```

Suggested result type:

```csharp
public sealed record PreparedDocumentSearchResult(
    string DocumentId,
    long Revision,
    long StartOffset,
    long EndOffset,
    string Preview,
    string? JsonPointer);
```

`JsonPointer` may be null if the path index is not available.

## Concurrency Model

Use the 80/20 concurrency model:

```text
many concurrent readers
single writer per prepared document
document-level write lock
different documents may be written concurrently
```

Rules:

- multiple users may open, read, and search the same prepared document;
- only one write operation may commit at a time per document;
- delete must fail while active handles exist, unless a later spec introduces delayed deletion;
- export must observe a consistent revision;
- search must identify the revision it searched;
- index rebuilds must use per-document write coordination;
- no collaborative merge/conflict resolution is required.

The first implementation only requires process-local coordination.

## Transaction Persistence

This milestone should create a durable transaction log format, even if advanced editing integration remains later.

Minimum transaction behavior:

- transaction log file or object exists;
- transaction log has a versioned record format;
- transaction append increments document revision;
- transaction metadata can be read during open;
- export can export unmodified documents;
- if a simple transaction type is implemented, export must apply it correctly.

Recommended first transaction type if included:

```text
ReplaceNodeValue
```

If actual modification transactions are deferred, the milestone must explicitly document that the transaction log is structurally implemented but editing integration is deferred.

## Export

Export is required.

Minimum export behavior:

- export unmodified prepared documents by streaming source chunks;
- export must not build the complete output as one string;
- export must report the revision it exports;
- export must fail clearly if transactions exist but transaction application is not yet supported;
- export must honor cancellation.

If transaction application is implemented, unchanged regions should stream from source chunks and changed regions should be materialized from transaction records.

## Cleanup and Recovery

The engine must define and implement cleanup behavior.

Requirements:

- import writes temporary objects first;
- failed import does not expose a ready document;
- cancelled import cleans up temporary objects where practical;
- ready documents can be listed;
- failed or incomplete documents can be detected;
- delete removes a document safely;
- delete while open fails clearly;
- incompatible storage format versions fail clearly.

## Public Documentation Impact

Update public documentation to explain the huge-document lifecycle.

Update or create:

- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`
- `public-docs/getting-started.md`
- `public-docs/samples.md`
- `public-docs/diagnostics.md`
- `public-docs/api/`

The public docs should explain:

```text
Import once.
Open prepared document many times.
Search/navigation use prepared indexes.
Edits are stored as transactions.
Export materializes JSON.
```

The public docs must not expose internal file layout as a public contract.

## Required Specs to Create

Create these specs:

- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/file-prepared-document-store.md`
- `docs/specs/prepared-document-storage-format.md`
- `docs/specs/prepared-document-concurrency.md`
- `docs/specs/prepared-document-search-engine.md`

## Required Specs to Update

Update these specs from Milestone 0012:

- `docs/specs/prepared-document.md`
- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `docs/specs/transaction-log.md`

Also update:

- `docs/SPECS.md`
- `docs/ARCHITECTURE.md`
- `docs/MILESTONES.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`

## Proposed Spec Content: `docs/specs/prepared-document-storage-abstraction.md`

```md
# Prepared Document Storage Abstraction

## Goal

Define the replaceable storage-provider abstraction used by the prepared document storage engine.

## Scope

This spec defines provider capabilities, object identity, temporary writes, object commit semantics, read/write leases, range reads, listing, deletion, and provider error behavior.

## Non-Goals

This spec does not define the file-backed storage layout, the prepared document public API, or distributed locking.

## Invariants

- The engine uses storage objects, not physical paths, as the abstraction boundary.
- A provider must not expose partially committed objects as ready.
- The manifest coordinates multi-object state transitions.
- The minimum atomic operation is one storage object commit.
- The provider reports capabilities explicitly.

## Required Capabilities

- create/open/list/delete containers;
- open committed objects for read;
- create temporary objects;
- commit or abort temporary objects;
- acquire read leases;
- acquire write leases;
- list storage objects;
- support or emulate range reads;
- report unsupported operations clearly.

## Authority

This document is authoritative for the prepared document storage-provider abstraction.
```

## Proposed Spec Content: `docs/specs/file-prepared-document-store.md`

```md
# File Prepared Document Store

## Goal

Define the default file-backed provider for prepared document storage.

## Scope

This spec defines root directory ownership, path safety, temporary file handling, atomic rename usage, document directory layout, file cleanup, and file-backed provider limitations.

## Invariants

- All files are stored under the configured root directory.
- Document IDs and object names must not allow path traversal.
- Temporary files must not be treated as committed objects.
- Ready state is determined by the manifest.
- Delete while open fails clearly.

## Authority

This document is authoritative for the default file-backed provider behavior.
```

## Proposed Spec Content: `docs/specs/prepared-document-storage-format.md`

```md
# Prepared Document Storage Format

## Goal

Define the versioned internal storage artifacts used by prepared documents.

## Scope

This spec defines manifest state, format versioning, source chunks, index artifacts, transaction log artifacts, temporary artifacts, and compatibility behavior.

## Manifest States

- importing
- ready
- failed
- deleting

## Invariants

- Documents may be opened only when manifest state is ready.
- Incompatible format versions fail clearly.
- Source chunks are immutable after import.
- Derived indexes are rebuildable unless explicitly marked required.
- The manifest is the state authority.

## Authority

This document is authoritative for internal prepared document storage format semantics.
```

## Proposed Spec Content: `docs/specs/prepared-document-concurrency.md`

```md
# Prepared Document Concurrency

## Goal

Define the concurrency model for department-scale prepared document storage.

## Rules

- Multiple readers may access one prepared document concurrently.
- One writer may commit to one prepared document at a time.
- Different documents may be written concurrently.
- Delete while open fails clearly.
- Export observes one consistent revision.
- Search reports the revision it searched.
- Process-local coordination is sufficient for the first implementation.

## Non-Goals

- distributed locking
- collaborative editing
- merge/conflict resolution
- cross-process write coordination

## Authority

This document is authoritative for prepared document concurrency behavior.
```

## Proposed Spec Content: `docs/specs/prepared-document-search-engine.md`

```md
# Prepared Document Search Engine

## Goal

Define the first persisted search index and search behavior for prepared documents.

## Scope

This spec covers literal search, property-name search, string-value search, case handling, paging, previews, offsets, and revision reporting.

## Non-Goals

- fuzzy search
- ranking
- stemming
- query language
- schema-aware search
- cross-document search

## Invariants

- Search indexes are derived artifacts.
- Search results identify document id and revision.
- Search supports result limits and continuation.
- Search must not require rendering rows.
- Search may take a few seconds for large documents.

## Authority

This document is authoritative for first-generation prepared document search behavior.
```

## Implementation Areas

Implementation may use repository-appropriate project and namespace names, but it should include these areas:

```text
Storage abstraction
Default file-backed provider
Prepared document store
Import pipeline
Manifest handling
Source chunk storage
Line index
Structural index persistence
Search index persistence
Transaction log persistence
Export service
Concurrency/lease handling
Cleanup/recovery
Tests
Documentation
```

Suggested namespaces:

```text
BlazorJsonVisualizer.Documents
BlazorJsonVisualizer.Storage
BlazorJsonVisualizer.Import
BlazorJsonVisualizer.Export
BlazorJsonVisualizer.Search
```

If the repository is not ready for package splits, use namespace separation first and defer package/project separation.

## Testing

### Fast Tests

Fast tests must be small and deterministic.

Required fast test coverage:

- storage provider path/object-name safety;
- manifest creation and state transitions;
- import of small JSON documents;
- source chunk boundary reads;
- UTF-8 boundary handling around chunks;
- line index lookup;
- structural index persistence and reload;
- search over small documents;
- open/list/delete behavior;
- delete fails while handle is open;
- failed import cleanup;
- cancelled import cleanup where practical;
- export unchanged document;
- concurrent read handles;
- single-writer lock behavior.

### Explicit Long-Running Tests

Long-running tests are explicit-only and must not run through `eng/test.sh` or `eng/check.sh` by default.

Define but do not run by default:

- 100 MB import smoke test;
- 500 MB import smoke test;
- 100 prepared documents in one store;
- 10 concurrent users/sessions;
- large search latency smoke test;
- large export smoke test.

Long-running tests are wired to `./eng/long-running-tests.sh` and the manual long-running workflow. Use `./eng/long-running-tests.sh --fast` to exercise the slow-category inventory with reduced data sizes during infrastructure validation.

## Validation

Minimum default validation:

```text
./eng/restore.sh
./eng/build.sh
./eng/test.sh
./eng/public-docs.sh
./eng/check.sh
```

Run additional validation only when relevant:

```text
./eng/frontend-check.sh    # if TypeScript/frontend files changed
./eng/samples.sh           # if samples changed
```

Do not run these unless explicitly requested:

```text
./eng/release-check.sh <version>
./eng/package-smoke.sh <version>
./eng/benchmark.sh
./eng/e2e.sh
```

If any validation command cannot run because the repository has not yet implemented the corresponding command, document the exact failing command and explain whether the failure is expected or must be fixed.

## Risks

Track these risks explicitly:

- byte offsets versus UTF-16 offsets;
- UTF-8 decoding boundaries across chunks;
- atomic import failure recovery;
- search index size growth;
- transaction/export correctness;
- file locking differences across operating systems;
- delete while document is open;
- storage abstraction leaking file-specific assumptions;
- accidental treatment of internal file layout as public API;
- long-running tests accidentally entering the default validation path.

## Acceptance Criteria

This milestone is complete when:

- storage abstraction spec exists;
- file-backed provider spec exists;
- storage format spec exists;
- concurrency spec exists;
- search engine spec exists;
- required 0012 specs are updated;
- terminology is updated;
- documentation indexes are updated;
- public docs explain the huge-document lifecycle;
- a replaceable storage provider abstraction exists;
- a default file-backed storage provider exists;
- the file-backed provider uses a versioned internal layout;
- import streams JSON into prepared storage without loading the full source as one string;
- source chunks are persisted and range-readable;
- manifest state controls document readiness;
- line, structural, and basic search index artifacts are persisted;
- prepared documents can be listed, opened, and deleted;
- delete while open fails clearly;
- multiple readers and a single writer per document are enforced in process;
- search returns paged results with offsets, previews, document id, and revision;
- export streams an unmodified prepared document;
- transaction log persistence exists or its deferred editing integration is explicitly documented;
- failed and cancelled imports do not expose ready documents;
- fast tests cover the required storage behavior;
- long-running tests are defined but not part of default validation;
- default validation passes or failures are documented with exact commands and output summaries.

## Document Contract

When this milestone changes, review:

- `docs/MILESTONES.md`
- `docs/SPECS.md`
- `docs/ARCHITECTURE.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
