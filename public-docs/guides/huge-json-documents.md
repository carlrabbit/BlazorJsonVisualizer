# Huge JSON Documents

## Status

Preview public workflow.

This guide describes the intended public workflow for huge JSON documents while package publication remains planned. Current limits are listed separately below.

## Workflow

For huge JSON documents, use the prepared-document lifecycle instead of loading the entire JSON payload as one in-memory string.

```text
Import once.
Open prepared document many times.
Search and navigation use prepared indexes.
Edits are stored as transactions.
Export materializes JSON.
```

## Lifecycle

1. Import a readable JSON stream through the ingestion source and import job APIs.
2. The store writes source chunks, metadata, indexes, and a manifest.
3. Open handles read from the prepared document without reparsing the full source.
4. The range-backed Layer 1 viewer opens a prepared document session and requests bounded rows/ranges instead of receiving the whole source as one browser string.
5. Search returns byte-offset results and previews from the prepared source.
6. Export streams unchanged source chunks to the destination stream.

The default implementation is file backed, but the public contract is the prepared-document store, ingestion, and runtime-viewing APIs. Applications should not depend on the internal directory layout.

## Related guides

- `public-docs/guides/import-huge-json.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/diagnostics/import-diagnostics.md`

## Current Limits

The first storage engine supports unchanged export and literal all-text search. Transaction replay, property-name scoped search, and string-value scoped search are reserved for later editing/search work and fail clearly when unsupported.

Prepared-document runtime sessions are read-only in the Milestone 0015 workflow. Editing, schema overlays, and projection plugins over prepared documents remain later workflows.
