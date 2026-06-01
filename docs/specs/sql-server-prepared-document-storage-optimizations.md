# SQL Server Prepared Document Storage Optimizations Specification

## Goal

Define opt-in SQL Server optimization support for the EF Core prepared-document storage backend.

## Scope

This specification covers:

- SQL Server 2022 optimization helpers or scripts;
- SQL Server 2025 optimization helpers or scripts;
- opt-in migration behavior;
- provider-neutral boundary rules;
- testing expectations for SQL Server-specific SQL generation.

## Non-Goals

This specification does not define:

- provider-neutral EF Core entity mapping;
- automatic migration execution;
- SQL Server as a required dependency for all users;
- distributed SQL Server deployment guidance;
- SQL Server full-text search as a required search implementation.

## Core Rule

SQL Server optimizations must be optional.

The EF Core prepared-document storage backend must work without SQL Server-specific migration helpers.

SQL Server-specific helpers may improve performance or storage characteristics, but they must not be required for correctness.

## Version Targets

The implementation must distinguish:

- SQL Server 2022 optimization recommendations;
- SQL Server 2025 optimization recommendations.

SQL Server 2025-specific features must not be emitted by SQL Server 2022 helpers.

## SQL Server 2022 Optimization Surface

SQL Server 2022 helpers should support opt-in recommendations for:

- nonclustered indexes for document lookup and lifecycle state;
- nonclustered indexes for source chunk ordering and range lookup;
- nonclustered indexes for search entries by document, normalized term, scope, and byte offset;
- nonclustered indexes for import jobs by state and update time;
- `rowversion` for entities where SQL Server optimistic concurrency is enabled;
- optional page compression or equivalent table/index compression when appropriate;
- explicit script naming and idempotency guidance.

The implementation must not require SQL Server full-text search for normal prepared-document search behavior.

## SQL Server 2025 Optimization Surface

SQL Server 2025 helpers may support opt-in recommendations for:

- all SQL Server 2022-safe optimizations when still appropriate;
- SQL Server 2025-specific JSON capabilities for bounded metadata payloads;
- provider-specific indexes over metadata payloads when explicitly supported;
- compatibility checks or clear script naming that prevents accidental use on SQL Server 2022.

Native JSON storage must not become the required storage mechanism for huge source chunks.

Source chunks remain chunked binary payloads unless a future spec explicitly changes that contract.

## Migration Helper Shape

The implementation may provide migration-builder extensions equivalent to:

```csharp
public static class BlazorJsonVisualizerSqlServerMigrationBuilderExtensions
{
    public static MigrationBuilder AddBlazorJsonVisualizerSqlServer2022Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv");

    public static MigrationBuilder RemoveBlazorJsonVisualizerSqlServer2022Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv");

    public static MigrationBuilder AddBlazorJsonVisualizerSqlServer2025Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv");

    public static MigrationBuilder RemoveBlazorJsonVisualizerSqlServer2025Optimizations(
        this MigrationBuilder migrationBuilder,
        string schema = "bjv",
        string tablePrefix = "Bjv");
}
```

The final names may vary to match repository conventions.

## Script Shape

If scripts are provided, they must be versioned and named clearly, for example:

```text
eng/sql/sqlserver-2022/apply-bjv-prepared-document-storage-optimizations.sql
eng/sql/sqlserver-2022/remove-bjv-prepared-document-storage-optimizations.sql
eng/sql/sqlserver-2025/apply-bjv-prepared-document-storage-optimizations.sql
eng/sql/sqlserver-2025/remove-bjv-prepared-document-storage-optimizations.sql
```

The final location may vary if the repository has a different convention for SQL assets.

## Idempotency and Safety

Optimization helpers or scripts should be safe to reason about and must avoid surprising destructive behavior.

Required behavior:

- do not drop consumer tables;
- do not change provider-neutral columns in incompatible ways;
- make repeated application behavior explicit;
- fail clearly or no-op when an optimization already exists;
- document required SQL Server version where version-specific syntax is used.

## Testing Expectations

Default validation must not require a running SQL Server instance.

Short-running tests should verify:

- helper registration and generated operations;
- generated SQL script content where practical;
- version separation between SQL Server 2022 and SQL Server 2025 helpers;
- provider-neutral model does not emit SQL Server-only requirements by default.

SQL Server instance-backed integration tests are explicit-only.

## Authority

This document is authoritative for:

- SQL Server prepared-document storage optimization behavior;
- SQL Server 2022 and SQL Server 2025 optimization separation;
- opt-in migration/script expectations;
- provider-neutral boundary constraints for SQL Server features.

## Document Contract

When this spec changes, review:

- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
