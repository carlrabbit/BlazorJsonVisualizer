# Diagnostics

## Status

Preview / planned.

Diagnostics reference content is not yet release-ready and will be expanded as consumer-facing diagnostics contracts stabilize.

## Supported behavior

Prepared-document operations fail clearly when a document is missing, the manifest is not ready, the storage format version is unsupported, delete is attempted while a handle is open, a source stream is invalid JSON, or an unsupported search/export scope is requested.

Import diagnostics are documented in:

- `public-docs/diagnostics/import-diagnostics.md`

Prepared-document runtime viewing must also surface diagnostics for missing, stale, failed, or unsupported indexes; out-of-range requests; document/session readiness failures; and unsupported prepared-document operations.
