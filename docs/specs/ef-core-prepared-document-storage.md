# EF Core Prepared Document Storage Specification

## Goal

Define the behavior of the EF Core prepared document storage backend.

## Scope

This specification covers:

- EF Core backend role within the prepared-document storage architecture;
- required entity categories;
- lifecycle behavior;
- import, open, list, delete, search, and export behavior;
- concurrency expectations;
- provider-neutral constraints;
- diagnostics and failure semantics.

## Non-Goals

This specification does not define:

- the SQL Server optimization SQL details;
- distributed locks;
- multi-node coordination;
- release validation;
- package publication.

## Backend Role

The EF Core backend is a prepared-document storage implementation.

It must implement the same public prepared-document store lifecycle as other providers:

```text
import
  -> ready prepared document
  -> open handle
  -> range reads / search / export
  -> delete
```

The backend must not expose EF Core entities as the primary consumer API. Consumers interact with prepared-document storage services and handles.

## Provider-Neutral Model

The provider-neutral EF Core model must avoid SQL Server-only requirements.

The model may use relational concepts such as keys, indexes, relationships, and concurrency tokens where EF Core supports them generally, but provider-specific optimizations belong in provider-specific migration helpers or scripts.

## Required Entity Categories

The backend must persist entity categories equivalent to:

| Category | Purpose |
|---|---|
| Prepared document | Manifest-level metadata, lifecycle state, format version, source hash, length, revision. |
| Source chunk | Bounded binary source chunks that support range reads and streaming export. |
| Index artifact | Persisted derived index metadata or blob payloads such as line, structural, search, and path index data. |
| Structural node | Normalized structural index records when the backend chooses row-based structural storage. |
| Search entry | Normalized search data for bounded literal search. |
| Transaction | Durable transaction records and revision tracking. |
| Import job | Import lifecycle status and progress, when using EF-backed job persistence. |
| Diagnostic | Import/storage diagnostics and public diagnostic payloads. |

The implementation may combine or split tables if the behavior remains equivalent and documented.

## Source Chunk Storage

The backend must store source content as bounded chunks.

The backend must not require the full source document to be held as one .NET string or one database row for normal import, search, or export behavior.

Source chunks must include at least:

- document id;
- chunk index or equivalent ordering key;
- start byte offset;
- length;
- binary content.

## Manifest and Document State

Prepared document metadata must include at least:

- document id;
- storage format version;
- lifecycle state;
- source length;
- optional source hash;
- created timestamp;
- updated timestamp;
- latest revision;
- index states or references.

A document must become visible as ready only after required artifacts are persisted consistently.

## Import Behavior

Import through the EF Core backend must:

- stream source content into bounded chunks;
- persist document metadata;
- persist required index artifacts or explicit missing/skipped index states;
- persist import diagnostics;
- avoid publishing a ready document after failed or cancelled imports;
- clean partial rows where practical or mark failure clearly.

## Open/List/Delete Behavior

Open must fail clearly when:

- the document does not exist;
- the document is not ready;
- the storage format version is unsupported;
- required artifacts are missing;
- the database schema is missing or incompatible.

List must return document metadata without loading source chunks or index blobs.

Delete must remove all owned rows for the document and must respect active session/write behavior defined by the prepared-document concurrency specs.

## Search Behavior

The EF Core backend must provide bounded search behavior consistent with `docs/specs/search-index.md` and `docs/specs/prepared-document-search-engine.md`.

Minimum search behavior:

- literal text search over persisted source or persisted search entries;
- bounded result count;
- UTF-8 byte offsets;
- revision reported with results;
- explicit failure or degradation when search indexes are missing or stale.

The backend must not silently return viewport-only search results.

## Export Behavior

Export must stream persisted source chunks for unmodified prepared documents.

If transaction application is not supported for modified documents, export must fail clearly instead of silently ignoring transactions.

The backend must not build the complete exported JSON document as one string for normal export.

## Concurrency Behavior

The EF Core backend must support department-scale concurrent read behavior:

```text
many readers
single writer per prepared document
independent documents may proceed independently
```

The backend may use optimistic concurrency, document-level write coordination, or provider-specific locking internally.

The public behavior must report concurrency conflicts clearly.

## Diagnostics

The backend must distinguish infrastructure failures from stable diagnostics where diagnostic identifiers are exposed.

Expected diagnostic categories:

- missing model configuration;
- missing schema or tables;
- missing required DbSet contract;
- unsupported provider capability;
- duplicate document id;
- invalid document state;
- missing artifact;
- concurrency conflict;
- SQL Server optimization not available or not applied.

## Authority

This document is authoritative for:

- EF Core prepared-document storage behavior;
- provider-neutral entity category expectations;
- EF Core import/open/search/export semantics;
- EF Core backend failure semantics.

## Document Contract

When this spec changes, review:

- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/document-import.md`
- `docs/specs/import-jobs.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/diagnostics/ef-core-storage-diagnostics.md`
