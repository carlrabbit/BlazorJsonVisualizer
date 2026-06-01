# Milestone 0016 — EF Core prepared document storage backend

## Status

Planned.

## Task Mode

Milestone authoring output for a later focus-area implementation task.

The implementation task must use this milestone as the primary implementation route and must not reconstruct planning context from chat history.

## Repository Maturity

BlazorJsonVisualizer is currently in Exploration / Active Design mode with behavior-rich specs, emerging architecture, and preview public documentation.

This milestone adds a storage-provider implementation and public integration surface. It is not release work and must not require release validation, package smoke validation, or public API baseline validation unless explicitly requested later.

## Goal

Implement an EF Core prepared document storage backend that can persist prepared-document artifacts through a user-owned `DbContext`, while preserving the prepared-document storage abstraction and allowing opt-in SQL Server 2022 and SQL Server 2025 optimization migrations.

The backend must support the prepared-document lifecycle already defined by the repository:

```text
raw JSON source
  -> import job
  -> prepared document artifacts
  -> open/read/search/export through the prepared-document store abstraction
```

## Problem Statement

The repository already has a prepared-document storage abstraction and a default file-backed storage direction. Consumers also need a database-backed option that fits normal application persistence models.

The EF Core backend must not force consumers to inherit from a library-owned `DbContext`. Instead, consumers must be able to implement an explicit DbSet contract on their own context so EF Core can discover the required entity types and so migrations remain application-owned.

The library may provide an optional reference context for samples/tests, but the public integration contract is a user-owned DbContext plus model-builder configuration.

## Required Authority Documents

Implementation agents must read these documents before starting:

- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/SPECS.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/prepared-document-storage-engine.md`
- `docs/specs/document-import.md`
- `docs/specs/import-jobs.md`
- `docs/specs/document-export.md`
- `docs/specs/search-index.md`
- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `docs/decisions/0006-user-owned-ef-core-dbcontext-for-prepared-document-storage.md`

Read public docs only for the public documentation focus area:

- `docs/PUBLIC-DOCS.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
- `public-docs/diagnostics/ef-core-storage-diagnostics.md`

Do not require the implementation agent to read all specs, all milestones, all public docs, or research files by default.

## Scope

### In Scope

- EF Core storage backend implementing the existing prepared-document store/storage-provider lifecycle.
- User-owned DbContext integration through an explicit DbSet contract interface.
- Provider-neutral entity types and model-builder configuration.
- Optional reference context only for samples/tests or documentation, not as the required consumer integration model.
- Import-job, diagnostic, document, source-chunk, index-artifact, search, transaction, and export persistence required by the current prepared-document lifecycle.
- Department-scale behavior consistent with prior storage-engine milestones: approximately 100 prepared documents, approximately 10 concurrent users/sessions, and acceptable multi-second search behavior for large documents.
- SQL Server 2022 optimization migration helper(s) and/or SQL script(s) that are opt-in.
- SQL Server 2025 optimization migration helper(s) and/or SQL script(s) that are opt-in and must not be required for correctness.
- Focused EF Core tests using a local relational provider suitable for short-running validation.
- Provider-specific SQL generation or migration-script tests that do not require a running SQL Server instance by default.
- Public preview documentation for EF Core storage usage and SQL Server optimization choices.

### Out of Scope

- Replacing the default file-backed provider.
- Making EF Core storage the only prepared-document storage backend.
- Forcing consumers to inherit from a library-owned `DbContext`.
- Distributed locking.
- Multi-node coordination.
- Automatic migration execution.
- Requiring SQL Server for normal test validation.
- Requiring SQL Server full-text search.
- Requiring SQL Server 2025 native JSON features for correctness.
- Release validation, package smoke validation, publishing, or public API baseline enforcement.
- Non-root README files, TBPs, issue templates, or broad process documentation.

## Focus Areas

### Focus Area 1 — Project and package shape

Create the implementation area for EF Core storage without destabilizing existing storage abstractions.

Expected implementation shape:

```text
src/
  BlazorJsonVisualizer.Storage.EFCore/
    ... provider-neutral EF Core storage backend ...
  BlazorJsonVisualizer.Storage.EFCore.SqlServer/
    ... SQL Server migration helpers and SQL scripts, if separated ...

tests/
  BlazorJsonVisualizer.Storage.EFCore.Tests/
  BlazorJsonVisualizer.Storage.EFCore.SqlServer.Tests/
```

A different project layout is acceptable if it follows existing repository conventions and keeps provider-neutral EF Core storage separate from SQL Server-specific optimizations.

### Focus Area 2 — User-owned DbContext contract

Implement a public interface equivalent to:

```csharp
public interface IBlazorJsonVisualizerStorageDbContext
{
    DbSet<PreparedJsonDocumentEntity> PreparedJsonDocuments { get; }
    DbSet<PreparedJsonDocumentSourceChunkEntity> PreparedJsonDocumentSourceChunks { get; }
    DbSet<PreparedJsonDocumentIndexArtifactEntity> PreparedJsonDocumentIndexArtifacts { get; }
    DbSet<PreparedJsonDocumentStructuralNodeEntity> PreparedJsonDocumentStructuralNodes { get; }
    DbSet<PreparedJsonDocumentSearchEntryEntity> PreparedJsonDocumentSearchEntries { get; }
    DbSet<PreparedJsonDocumentTransactionEntity> PreparedJsonDocumentTransactions { get; }
    DbSet<PreparedJsonDocumentImportJobEntity> PreparedJsonDocumentImportJobs { get; }
    DbSet<PreparedJsonDocumentDiagnosticEntity> PreparedJsonDocumentDiagnostics { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
```

The final names may vary to match repository naming conventions, but the contract must require the DbSets needed by the backend.

Consumers must be documented to expose public DbSet properties or call the provided model-builder extension so entity discovery and migrations are reliable.

Explicit interface implementation alone is not sufficient as the only guidance because the consumer needs EF Core model discovery and migration behavior to be predictable.

### Focus Area 3 — Model-builder configuration

Provide a model-builder extension equivalent to:

```csharp
public static ModelBuilder UseBlazorJsonVisualizerPreparedDocumentStorage(
    this ModelBuilder modelBuilder,
    Action<BlazorJsonVisualizerEfCoreStorageOptions>? configure = null)
```

The extension must configure:

- entity keys;
- relationships;
- table names;
- optional schema/table prefix;
- concurrency tokens where provider-neutral;
- indexes that are provider-neutral and safe for default relational use;
- maximum lengths and required fields;
- owned/value-converted metadata where appropriate.

SQL Server-specific table options, compression, filtered indexes, included columns, JSON-native columns, and provider-specific SQL must not be required by the provider-neutral model.

### Focus Area 4 — EF Core prepared-document store implementation

Implement an EF Core-backed store that satisfies the same high-level lifecycle as the file-backed store:

```text
import -> ready document -> open handle -> range reads/search/export -> delete
```

The backend must preserve the prepared-document abstraction. Public consumers should interact with prepared-document store interfaces, not with entity sets directly.

The implementation must map prepared-document operations to EF Core persistence without loading complete large documents into memory as a single string.

Required behavior:

- import stores source chunks as bounded binary rows;
- manifest/document metadata is persisted as normalized columns plus bounded metadata payloads where needed;
- index artifacts can be persisted either as artifact rows/blobs or normalized records according to the specs;
- search operates over persisted content or search entries and returns bounded results;
- export streams from persisted chunks and does not construct the entire JSON as one string;
- deletion cleans all related document rows;
- active session/write behavior follows repository concurrency specs.

### Focus Area 5 — SQL Server 2022 optimizations

Implement opt-in SQL Server 2022 optimization support.

Acceptable forms:

- migration-builder extension methods;
- checked-in SQL scripts under an implementation-appropriate path;
- tests that verify generated SQL or script content.

Required recommendations:

- nonclustered indexes for document lookup, chunk ordering, search lookup, and import job lookup;
- `rowversion` where used for SQL Server concurrency;
- `varbinary(max)` or equivalent for source chunk payloads;
- indexes tuned for department-scale prepared-document operations;
- no dependency on SQL Server full-text search for correctness;
- no automatic execution of optimization SQL.

### Focus Area 6 — SQL Server 2025 optimizations

Implement opt-in SQL Server 2025 optimization support separately from SQL Server 2022 support.

SQL Server 2025 support may use SQL Server 2025-specific capabilities only when they are:

- isolated behind explicit opt-in migration helpers or scripts;
- not required by the provider-neutral EF Core model;
- not required for correctness;
- documented as optional.

Native JSON storage may be considered for bounded metadata payloads such as manifests, diagnostics details, or provider metadata. It must not be used as the required storage mechanism for huge source chunks.

### Focus Area 7 — Diagnostics and failure behavior

Define and implement stable failure behavior for EF Core storage:

- missing DbSet contract;
- model not configured;
- unsupported provider capability;
- migration/schema missing;
- optimistic concurrency conflict;
- document not found;
- duplicate document id;
- import failed;
- invalid document state;
- SQL Server optimization already applied or unavailable.

Public diagnostics documentation must use stable codes if the implementation exposes diagnostic identifiers.

### Focus Area 8 — Public preview documentation

Add public preview documentation only for the direct public behavior introduced by this milestone:

- how to use a user-owned DbContext;
- how to call the model-builder extension;
- how to register the EF Core prepared-document store;
- how to opt into SQL Server 2022 optimizations;
- how to opt into SQL Server 2025 optimizations;
- what remains planned or provider-specific.

Do not turn this milestone into release documentation or package publication work.

## Files Likely Affected by Implementation

Implementation files are not part of this planning package, but the later implementation is expected to affect areas similar to:

```text
src/BlazorJsonVisualizer.Storage.EFCore/
src/BlazorJsonVisualizer.Storage.EFCore.SqlServer/
tests/BlazorJsonVisualizer.Storage.EFCore.Tests/
tests/BlazorJsonVisualizer.Storage.EFCore.SqlServer.Tests/
```

The implementation may update project/solution files as needed.

## Direct Documentation Impact

The following documentation is direct for this milestone and is included in this package or expected to be updated when implementation changes behavior:

- `docs/milestones/milestone-0016-ef-core-prepared-document-storage-backend.md`
- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `docs/decisions/0006-user-owned-ef-core-dbcontext-for-prepared-document-storage.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
- `public-docs/diagnostics/ef-core-storage-diagnostics.md`

Implementation agents must update these files if behavior changes from the planned contract.

## Deferred Documentation Synchronization

Do not perform broad documentation synchronization during focused implementation unless the implementation directly changes the relevant surface.

A later documentation synchronization pass should review:

- `README.md`
- `AGENTS.md`
- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/PUBLIC-DOCS.md`
- `docs/TERMINOLOGY.md`
- `public-docs/getting-started.md`
- `public-docs/concepts.md`
- `public-docs/packages.md`
- `public-docs/installation.md`
- `public-docs/release-notes.md`

This milestone package includes index updates where needed to make the new authority files discoverable, but it does not attempt full narrative synchronization.

## Validation Expectations

Use the repository validation tiers from `docs/engineering/command-contract.md`.

### Tier 0 — Documentation/package sanity

Use for Markdown-only edits within this milestone package.

Expected command when practical:

```sh
./eng/format.sh --verify
```

### Tier 1 — Focused implementation validation

Use during focus-area implementation.

Expected commands:

```sh
./eng/build.sh
./eng/test-project.sh tests/BlazorJsonVisualizer.Storage.EFCore.Tests
```

When SQL Server-specific helper tests exist:

```sh
./eng/test-project.sh tests/BlazorJsonVisualizer.Storage.EFCore.SqlServer.Tests
```

### Tier 2 — Standard local validation

Required before declaring non-trivial implementation complete when practical:

```sh
./eng/check.sh
```

### Explicit-only validation

The following must not be required by default:

```sh
./eng/long-running-tests.sh
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

SQL Server instance-backed tests, 500 MB document tests, package smoke tests, and release checks are explicit-only unless a later task explicitly requests them.

## Acceptance Criteria

The milestone is complete when:

- EF Core storage backend exists and implements the prepared-document storage lifecycle through the existing abstraction.
- Consumers can use a user-owned DbContext implementing the required DbSet contract.
- Entity discovery and migrations are supported through public DbSets and/or the model-builder extension.
- The provider-neutral EF Core model does not depend on SQL Server-only features.
- SQL Server 2022 optimizations are available through explicit opt-in migration helpers or scripts.
- SQL Server 2025 optimizations are available through explicit opt-in migration helpers or scripts and are not required for correctness.
- Import jobs, diagnostics, source chunks, index artifacts, search data, transactions, and document metadata have persistence behavior sufficient for the current prepared-document lifecycle.
- Search and export do not require loading a huge document into memory as one string.
- Failure behavior is explicit and covered by tests where practical.
- Focused tests cover model configuration, store registration, import/open/list/delete, source chunk persistence, search behavior, export no-edit behavior, and SQL Server optimization script/helper generation.
- Tier 2 validation passes when practical.
- Public preview docs explain the supported EF Core backend workflow and mark planned/provider-specific behavior clearly.

## Implementation Notes

The EF Core backend must remain a storage-provider implementation, not a replacement for the prepared-document architecture.

The implementation should prefer simple, inspectable database tables over clever provider magic. Department-scale reliability and clear migration ownership are more important than maximum database sophistication.

SQL Server 2025-specific JSON capabilities may be useful for metadata payloads but must not become a hard dependency for huge JSON source storage.
