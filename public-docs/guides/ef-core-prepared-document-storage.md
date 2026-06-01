# EF Core Prepared Document Storage

## Status

Preview documentation for Milestone 0016.

This guide describes the planned and implemented EF Core storage integration surface. Until package publication matures, names and package boundaries may change.

## Purpose

Use EF Core prepared-document storage when an application wants prepared JSON documents to live in its own relational database instead of the default file-backed store.

## Storage Model

The EF Core backend stores prepared-document artifacts such as:

- prepared document metadata;
- source chunks;
- index artifacts;
- search entries;
- transactions;
- import jobs;
- diagnostics.

Applications still interact with BlazorJsonVisualizer prepared-document services. Direct entity access is not the normal consumer workflow.

## User-Owned DbContext

The EF Core backend is designed for an application-owned DbContext.

A typical integration has this shape:

```csharp
public sealed class AppDbContext : DbContext, IBlazorJsonVisualizerStorageDbContext
{
    public DbSet<PreparedJsonDocumentEntity> PreparedJsonDocuments => Set<PreparedJsonDocumentEntity>();
    public DbSet<PreparedJsonDocumentSourceChunkEntity> PreparedJsonDocumentSourceChunks => Set<PreparedJsonDocumentSourceChunkEntity>();
    public DbSet<PreparedJsonDocumentIndexArtifactEntity> PreparedJsonDocumentIndexArtifacts => Set<PreparedJsonDocumentIndexArtifactEntity>();
    public DbSet<PreparedJsonDocumentStructuralNodeEntity> PreparedJsonDocumentStructuralNodes => Set<PreparedJsonDocumentStructuralNodeEntity>();
    public DbSet<PreparedJsonDocumentSearchEntryEntity> PreparedJsonDocumentSearchEntries => Set<PreparedJsonDocumentSearchEntryEntity>();
    public DbSet<PreparedJsonDocumentTransactionEntity> PreparedJsonDocumentTransactions => Set<PreparedJsonDocumentTransactionEntity>();
    public DbSet<PreparedJsonDocumentImportJobEntity> PreparedJsonDocumentImportJobs => Set<PreparedJsonDocumentImportJobEntity>();
    public DbSet<PreparedJsonDocumentDiagnosticEntity> PreparedJsonDocumentDiagnostics => Set<PreparedJsonDocumentDiagnosticEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.UseBlazorJsonVisualizerPreparedDocumentStorage(options =>
        {
            options.Schema = "bjv";
            options.TablePrefix = "JsonVisualizer";
        });
    }
}
```

Final type and method names may differ until the public package surface is stabilized.

## Registration

Expected registration shape:

```csharp
services.AddBlazorJsonVisualizerStorage()
    .UseEfCore<AppDbContext>();
```

or an equivalent repository-approved extension method.

## Migration Ownership

The application owns migrations.

BlazorJsonVisualizer provides entity types and model-builder configuration, but it does not automatically execute database migrations.

## Entity Discovery

Expose the required DbSet properties and call the model-builder extension.

This makes EF Core migrations predictable and keeps the prepared-document tables visible in the application model.

## Provider-Neutral Behavior

The EF Core model is provider-neutral by default.

Provider-specific optimizations, including SQL Server optimizations, are opt-in.

## Limitations

- SQL Server optimizations are optional.
- Release/package guidance is planned until package publication matures.
- SQL Server instance-backed validation may be explicit-only in development workflows.

## Related Documentation

- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
