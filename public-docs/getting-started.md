# Getting Started

## Status

Preview / planned for first public package release.

This surface is not release-ready. It documents the current repository-supported workflows and the expected first consumer path while packaging and release readiness remain future work.

## Supported now in the repository

For small JSON documents, direct open remains available in repository/runtime work.

For huge JSON documents, use the prepared-document lifecycle:

```text
import raw JSON
  -> open prepared document
  -> view/search/reveal through the range-backed Layer 1 viewer
  -> apply controlled Layer 1 edits when needed
  -> export the current prepared-document revision
```

## Storage choices

Prepared documents can use the default storage path or the EF Core prepared-document storage backend.

The EF Core backend integrates with a user-owned DbContext. DbSet properties make entity/migration ownership explicit, and the model-builder extension is the authoritative configuration point for BlazorJsonVisualizer storage entities.

SQL Server 2022 and SQL Server 2025 storage optimizations are opt-in. They are not required for correctness.

## Recommended reading

- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/import-huge-json.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/guides/layer1-prepared-document-search.md`
- `public-docs/guides/layer1-controlled-editing.md`
- `public-docs/guides/export-edited-prepared-document.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/diagnostics.md`
