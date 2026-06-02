# Diagnostics

## Status

Preview.

Diagnostics reference content is not release-ready and will be expanded as consumer-facing diagnostics contracts stabilize.

## Supported behavior

Prepared-document operations fail clearly when a document is missing, the manifest is not ready, the storage format version is unsupported, delete is attempted while a handle is open, a source stream is invalid JSON, or an unsupported search/export/edit scope is requested.

Import diagnostics are documented in:

- `public-docs/diagnostics/import-diagnostics.md`

Layer 1 viewer diagnostics are documented in:

- `public-docs/diagnostics/layer1-viewer-diagnostics.md`

EF Core storage diagnostics are documented in:

- `public-docs/diagnostics/ef-core-storage-diagnostics.md`

## Layer 1 diagnostics

Prepared-document runtime viewing must surface diagnostics for missing, stale, failed, or unsupported indexes; out-of-range requests; document/session readiness failures; revision mismatches; unsupported prepared-document operations; unsupported edit operations; and unsupported edited export transactions.

Normal diagnostic conditions should be returned as structured results and displayed by the viewer. They must not silently produce stale search results, partial exports, or corrupt edited documents.
