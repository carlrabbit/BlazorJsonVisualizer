# Huge JSON Documents

## Status

Preview public workflow.

This guide describes the public workflow for huge JSON documents while package publication remains planned. Current limits are listed separately below.

## Workflow

For huge JSON documents, use the prepared-document lifecycle instead of loading the entire JSON payload as one in-memory string.

```text
Import once.
Open prepared document many times.
Search and navigation use prepared services and indexes.
Controlled edits are stored as transactions.
Export materializes the selected document revision as JSON.
```

## Lifecycle

1. Import a readable JSON stream through the ingestion source and import job APIs.
2. The store writes source chunks, metadata, indexes, and a manifest.
3. Open handles read from the prepared document without reparsing the full source.
4. The range-backed Layer 1 viewer opens a prepared document session and requests bounded rows/ranges instead of receiving the whole source as one browser string.
5. Search returns bounded result pages with byte offsets, previews, and revision information.
6. Controlled Layer 1 edits append validated transactions.
7. Export streams unchanged source regions where possible and materializes supported edited regions from transactions.

The default implementation is file backed, and EF Core storage is available for applications that want prepared-document artifacts in an application-owned relational database. The public contract is the prepared-document store, ingestion, runtime-viewing, transaction, and export APIs. Applications should not depend on the internal file layout or database table layout.

## Related guides

- `public-docs/guides/import-huge-json.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/guides/layer1-prepared-document-search.md`
- `public-docs/guides/layer1-controlled-editing.md`
- `public-docs/guides/export-edited-prepared-document.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/diagnostics/import-diagnostics.md`
- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

## Current Limits

Prepared-document APIs and public docs are preview surfaces while package publication remains planned.

Search is bounded and may be paged. Advanced query languages, fuzzy search, schema-aware search, and cross-document search remain planned unless documented separately.

Layer 1 controlled editing is intentionally not freeform text editing. Unsupported edit/export operations fail clearly.

Schema overlays and projection plugins over prepared documents remain later workflows.
