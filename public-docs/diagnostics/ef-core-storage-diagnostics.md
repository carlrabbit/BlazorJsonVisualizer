# EF Core Storage Diagnostics

## Status

Preview diagnostics reference for Milestone 0016.

The current preview implementation exposes stable diagnostic identifiers for these categories.

## Purpose

This page describes user-facing EF Core storage diagnostic categories for prepared-document storage.

## Diagnostic Categories

| Category | Meaning | Typical action |
|---|---|---|
| Missing model configuration (`efcore.storage.missingModelConfiguration`) | The application DbContext did not apply BlazorJsonVisualizer model configuration. | Call the model-builder extension from `OnModelCreating`. |
| Missing DbSet contract (`efcore.storage.missingDbSetContract`) | The configured DbContext does not expose the required storage DbSets. | Implement the required storage DbContext interface. |
| Missing schema or tables (`efcore.storage.missingSchemaOrTables`) | Database migrations have not created the required tables. | Add and apply an application migration. |
| Unsupported provider capability (`efcore.storage.unsupportedProviderCapability`) | The EF Core provider cannot support a required operation. | Use a supported provider or change storage backend. |
| Duplicate document id (`efcore.storage.duplicateDocumentId`) | Import attempted to create a document id that already exists. | Use a new document id or delete the existing prepared document. |
| Invalid document state (`efcore.storage.invalidDocumentState`) | The prepared document is not ready or has inconsistent artifacts. | Inspect import diagnostics or rebuild/reimport. |
| Missing artifact (`efcore.storage.missingArtifact`) | Required chunks or index artifacts are missing. | Rebuild indexes, repair, or reimport. |
| Concurrency conflict (`efcore.storage.concurrencyConflict`) | Two operations attempted incompatible updates. | Retry the operation or wait for the active write to complete. |
| SQL Server optimization unavailable (`efcore.storage.sqlServer.optimizationUnavailable`) | Requested optimization is not supported by the database version or schema. | Use the matching SQL Server helper or skip optional optimization. |
| Import failed (`efcore.storage.importFailed`) | Import could not produce a ready prepared document. | Inspect the failure, then retry or reimport. |
| Document not found (`efcore.storage.documentNotFound`) | The requested prepared document does not exist. | Verify the document id or import it again. |
| Unsupported storage format version (`efcore.storage.unsupportedFormatVersion`) | The stored prepared document uses a format version the backend cannot open. | Reimport the document with the current backend. |

## Public Error Behavior

EF Core storage errors should fail clearly and should not silently fall back to incomplete search, partial export, or viewport-only results.

## Related Documentation

- `docs/specs/ef-core-prepared-document-storage.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
