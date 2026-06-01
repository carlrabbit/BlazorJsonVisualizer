# SQL Server Prepared Document Storage Optimizations

## Status

Preview documentation for Milestone 0016.

This guide describes planned and implemented opt-in SQL Server optimization support for EF Core prepared-document storage.

## Purpose

Use SQL Server optimization helpers when the application stores prepared documents in SQL Server and wants recommended indexes or SQL Server-specific tuning for department-scale usage.

## Core Rule

SQL Server optimizations are optional.

The EF Core prepared-document storage backend must work without applying these helpers.

## SQL Server 2022

SQL Server 2022 optimization support should focus on conservative relational tuning:

- document lookup indexes;
- source chunk ordering/range indexes;
- search-entry lookup indexes;
- import-job status indexes;
- SQL Server `rowversion` where used for optimistic concurrency;
- optional compression where the implementation explicitly supports it.

SQL Server full-text search is not required for prepared-document search.

## SQL Server 2025

SQL Server 2025 optimization support may include newer SQL Server capabilities when implemented behind explicit opt-in helpers.

Native JSON capabilities may be useful for bounded metadata payloads. They must not become the required storage mechanism for huge source chunks.

## Migration Helper Usage

Expected helper shape:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddBlazorJsonVisualizerSqlServer2022Optimizations(
        schema: "bjv",
        tablePrefix: "JsonVisualizer");
}
```

or:

```csharp
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddBlazorJsonVisualizerSqlServer2025Optimizations(
        schema: "bjv",
        tablePrefix: "JsonVisualizer");
}
```

Final names may differ until package publication matures.

## Safety

Optimization helpers must not:

- run automatically;
- drop consumer tables;
- require SQL Server 2025 for SQL Server 2022 users;
- be required for correctness.

## Related Documentation

- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
