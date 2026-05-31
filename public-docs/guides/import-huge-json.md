# Import Huge JSON

## Status

Preview public documentation for planned/active prepared-document ingestion behavior.

This guide describes the intended consumer workflow for huge JSON import. It must stay aligned with the implemented milestone status and must not imply package release readiness while public package publication remains planned.

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

Initially supported or planned adapters:

| Source | Status | Notes |
|---|---|---|
| Stream source | Planned/implementation milestone | Wraps a caller-provided readable stream. |
| File path source | Planned/implementation milestone | Opens a local readable file and reports file metadata. |
| Browser upload source | Planned where feasible | Streams browser-provided upload data into the .NET ingestion pipeline. |

The source abstraction is intentionally not the same as a file path. Applications may provide custom sources later.

## Import Jobs

Huge imports may take time. Import is represented as a job with status, progress, cancellation, diagnostics, and final result.

Progress may be approximate. When source length is unknown, progress may show the current step and bytes read without a percentage.

## Cancellation

Cancellation is cooperative.

Cancelling an import must not publish a ready prepared document. Temporary artifacts are cleaned up or left in a non-ready failed/cancelled state according to the prepared-document store rules.

## Encoding

The default encoding policy is UTF-8.

UTF-8 with BOM is accepted. Unsupported encodings fail import unless an explicit opt-in path exists.

## Invalid JSON

The first supported mode requires valid JSON.

Invalid JSON import fails with diagnostics unless a future mode explicitly supports best-effort invalid JSON viewing.

## Result

A successful import produces a prepared document reference that can be opened through the prepared-document store.

A failed or cancelled import does not produce a ready prepared document.

## Related Documentation

- `public-docs/guides/huge-json-documents.md`
- `public-docs/diagnostics/import-diagnostics.md`
