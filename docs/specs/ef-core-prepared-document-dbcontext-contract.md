# EF Core Prepared Document DbContext Contract Specification

## Goal

Define how BlazorJsonVisualizer EF Core storage integrates with a user-owned `DbContext` while ensuring EF Core can discover and migrate the required prepared-document entities.

## Scope

This specification covers:

- the required DbSet contract interface;
- user-owned DbContext expectations;
- model-builder configuration;
- entity discovery requirements;
- non-goals for library-owned contexts.

## Non-Goals

This specification does not define:

- the full EF Core storage backend behavior;
- SQL Server-specific optimization SQL;
- package publication requirements;
- release validation requirements.

## Contract Principle

BlazorJsonVisualizer EF Core storage must integrate with application-owned persistence.

The library must not require consumers to inherit from a library-owned `DbContext`.

The library may provide an optional reference context for samples, tests, or simple applications, but the durable public integration model is:

```text
user-owned DbContext
  + required DbSet contract
  + BlazorJsonVisualizer model-builder extension
  + EF Core storage registration
```

## Required DbSet Contract

The implementation must provide an interface equivalent to:

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

Final type names may differ to match repository conventions.

The contract must cover all entity sets needed for the EF Core prepared-document backend.

## Consumer DbContext Requirements

A consumer DbContext must:

- derive from `DbContext`;
- implement the BlazorJsonVisualizer storage DbContext contract;
- expose required DbSet properties in a way EF Core can discover or include the entities through model-builder configuration;
- call the BlazorJsonVisualizer model-builder extension from `OnModelCreating`;
- own migrations and connection configuration.

Example shape:

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

## Explicit Interface Implementation Warning

Documentation must not recommend explicit interface-only DbSet implementations as the normal pattern.

The recommended pattern is public DbSet properties plus the model-builder extension because it makes EF Core model discovery and migration generation predictable.

## Model Builder Extension

The implementation must provide a model-builder extension equivalent to:

```csharp
public static class BlazorJsonVisualizerEfCoreModelBuilderExtensions
{
    public static ModelBuilder UseBlazorJsonVisualizerPreparedDocumentStorage(
        this ModelBuilder modelBuilder,
        Action<BlazorJsonVisualizerEfCoreStorageModelOptions>? configure = null);
}
```

The extension must configure all required entity types even if a consumer's DbSet discovery behavior differs across EF Core versions or coding styles.

## Model Options

The model options should support at least:

```csharp
public sealed class BlazorJsonVisualizerEfCoreStorageModelOptions
{
    public string? Schema { get; set; }
    public string TablePrefix { get; set; } = "Bjv";
}
```

Additional options may be added when needed, but they must not expose provider-specific SQL Server settings in the provider-neutral model options.

## Dependency Injection Contract

The implementation must support registration equivalent to:

```csharp
services.AddBlazorJsonVisualizerStorage()
    .UseEfCore<AppDbContext>();
```

or:

```csharp
services.AddBlazorJsonVisualizerEfCoreStorage<AppDbContext>();
```

The final naming must follow repository conventions.

The DbContext type parameter must be constrained so that the implementation can depend on both `DbContext` and the storage DbContext contract.

## Entity Discovery Invariant

The EF Core storage backend must not rely on accidental model discovery.

The model-builder extension is responsible for configuring the required entity types. Public DbSet properties are still required by the contract because they make consumer migrations and model ownership clear.

## Authority

This document is authoritative for:

- user-owned DbContext integration;
- required DbSet contract behavior;
- model-builder extension expectations;
- entity discovery guidance.

## Document Contract

When this spec changes, review:

- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
