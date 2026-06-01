# EF Core Storage Diagnostics

## Status

Preview diagnostics reference for Milestone 0016.

Diagnostic identifiers may be finalized during implementation.

## Purpose

This page describes user-facing EF Core storage diagnostic categories for prepared-document storage.

## Diagnostic Categories

| Category | Meaning | Typical action |
|---|---|---|
| Missing model configuration | The application DbContext did not apply BlazorJsonVisualizer model configuration. | Call the model-builder extension from `OnModelCreating`. |
| Missing DbSet contract | The configured DbContext does not expose the required storage DbSets. | Implement the required storage DbContext interface. |
| Missing schema or tables | Database migrations have not created the required tables. | Add and apply an application migration. |
| Unsupported provider capability | The EF Core provider cannot support a required operation. | Use a supported provider or change storage backend. |
| Duplicate document id | Import attempted to create a document id that already exists. | Use a new document id or delete the existing prepared document. |
| Invalid document state | The prepared document is not ready or has inconsistent artifacts. | Inspect import diagnostics or rebuild/reimport. |
| Missing artifact | Required chunks or index artifacts are missing. | Rebuild indexes, repair, or reimport. |
| Concurrency conflict | Two operations attempted incompatible updates. | Retry the operation or wait for the active write to complete. |
| SQL Server optimization unavailable | Requested optimization is not supported by the database version or schema. | Use the matching SQL Server helper or skip optional optimization. |

## Public Error Behavior

EF Core storage errors should fail clearly and should not silently fall back to incomplete search, partial export, or viewport-only results.

## Related Documentation

- `docs/specs/ef-core-prepared-document-storage.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
