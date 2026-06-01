# Import Huge JSON

## Status

Preview public documentation for implemented prepared-document ingestion behavior.

This guide describes the current consumer workflow for huge JSON import. It must not imply package release readiness while public package publication remains planned.

## When to Use Import

Use import when a JSON document is too large to treat as a normal in-memory string.

The intended workflow is:

```text
Provide a JSON source.
Start an import job.
Observe progress and diagnostics.
Open the prepared document after import succeeds.
Search, navigate, and later export through prepared-document APIs.
```

## Supported Sources

The ingestion API is based on source adapters.

Currently supported and planned adapters:

| Source | Status | Notes |
|---|---|---|
| Stream source | Implemented | Wraps a caller-provided readable stream. By default the adapter leaves the caller stream open when the import stream is disposed. |
| File path source | Implemented | Opens a local readable file and reports file metadata. |
| Browser upload source | Planned | Not included in the current ingestion implementation. |

The source abstraction is intentionally not the same as a file path. Applications may provide custom sources by implementing the ingestion source interface.

## Import Jobs

Huge imports may take time. Import is represented as a job with status, progress, cancellation, diagnostics, and final result.

Progress may be approximate. When source length is unknown, progress may show the current step and bytes read without a percentage.

## Cancellation

Cancellation is cooperative.

Cancelling an import must not publish a ready prepared document. Temporary artifacts are cleaned up or left in a non-ready failed/cancelled state according to the prepared-document store rules.

## Encoding

The default encoding policy is UTF-8.

UTF-8 with BOM is accepted and normalized before prepared-document storage. Unsupported BOMs or non-UTF-8 charset metadata fail import with diagnostics. No lossy transcoding mode is implemented.

## Invalid JSON

The first supported mode requires valid JSON.

Invalid JSON import fails with diagnostics unless callers explicitly use the prepared-document import option that allows invalid JSON.

## Result

A successful import produces a prepared document reference that can be opened through the prepared-document store.

A failed or cancelled import does not produce a ready prepared document.

## Related Documentation

- `public-docs/guides/huge-json-documents.md`
- `public-docs/diagnostics/import-diagnostics.md`
