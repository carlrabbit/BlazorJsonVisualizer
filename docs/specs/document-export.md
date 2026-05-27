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
