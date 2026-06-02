# Document Export Specification

## Goal

Define how the current prepared document state is materialized as JSON.

## Scope

This specification covers export input, destination stream, formatting policy, no-edit export behavior, and failure semantics.

## Public API Shape

```csharp
public interface IJsonDocumentExporter
{
    ValueTask ExportAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);

    ValueTask<JsonDocumentExportResult> ExportWithResultAsync(
        string documentId,
        Stream destination,
        JsonDocumentExportOptions options,
        CancellationToken cancellationToken = default);
}
```

```csharp
public sealed record JsonDocumentExportOptions
{
    public JsonExportFormattingPolicy FormattingPolicy { get; init; } =
        JsonExportFormattingPolicy.PreserveUnchangedRegions;
}

public enum JsonExportFormattingPolicy
{
    PreserveUnchangedRegions,
    MinifyChangedRegions,
    PrettyPrintChangedRegions
}
```

## Export Contract

Export materializes prepared document state to a destination stream.

The first implementation supports the no-edit case by exporting persisted source bytes.

## Format Preservation

Initial contract:

```text
Unchanged regions should be preserved byte-for-byte where practical.
Changed regions may be normalized according to the selected export policy.
```

## Failure Semantics

Export fails clearly if:

- the prepared document does not exist;
- the prepared document is not ready;
- the destination stream is not writable;
- cancellation is requested.

## Authority

This document is authoritative for:

- export API shape;
- export policy semantics;
- export failure semantics.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document.md`
- `docs/specs/transaction-log.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`

## Export Result Metadata

The result-returning export API reports:

- prepared document id;
- exported revision;
- transaction count;
- latest transaction id when one was exported;
- formatting policy used;
- diagnostics when degraded export behavior is represented as metadata.

The legacy `ExportAsync` API remains available for callers that only need the destination stream and may discard the result metadata.

## Storage Engine Export Behavior

For unedited prepared documents, the default export implementation streams unchanged source chunks to the destination stream and reports the handle revision used for export. It does not build the complete output as a string.

For edited prepared documents, the default implementation supports the Layer 1 controlled transaction kinds defined in `docs/specs/layer1-controlled-editing-transactions.md`. It validates the transaction revision chain, materializes supported transactions, writes complete JSON only after validation succeeds, and reports the exported revision.

If a prepared document contains unsupported transaction kinds, invalid payloads, or inconsistent revision state, export must fail clearly instead of silently ignoring changes.
