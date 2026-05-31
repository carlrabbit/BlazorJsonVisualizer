# Document Import Specification

## Goal

Define how raw JSON sources are imported into prepared documents.

## Scope

This specification covers streaming input, import options, import output, failure semantics, cancellation, and minimum derived artifacts created during import.

## Input Sources

The .NET import API supports `Stream` as the initial input abstraction.

## Public API Shape

```csharp
public interface IJsonDocumentImporter
{
    ValueTask<PreparedJsonDocumentInfo> ImportAsync(
        Stream source,
        JsonDocumentImportOptions options,
        CancellationToken cancellationToken = default);
}
```

```csharp
public sealed record JsonDocumentImportOptions
{
    public string? DocumentId { get; init; }
    public bool BuildSearchIndex { get; init; } = true;
    public bool BuildPathIndex { get; init; } = true;
    public bool AllowInvalidJson { get; init; } = false;
}
```

## Required Import Behavior

Import must:

- read the raw JSON stream once;
- create a prepared document manifest;
- persist source content;
- create derived index artifacts or mark index state as missing;
- initialize transaction-log storage;
- honor cancellation where practical.

## Invalid JSON

If `AllowInvalidJson` is `false`, invalid JSON fails import.

The first implementation may fail import for invalid JSON instead of producing a degraded prepared document.

## Failure Semantics

Import failure must not leave a prepared document in `Ready` state.

Partial artifacts should be cleaned up.

## Authority

This document is authoritative for:

- import input contract;
- import options;
- import output;
- import failure semantics;
- minimum import artifacts.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/search-index.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/getting-started.md`

## Storage Engine Import Behavior

The default import implementation streams the source into bounded UTF-8 byte chunks, computes a SHA-256 source hash, records line-start byte offsets, initializes structural/search/path index artifacts, and commits the manifest to `ready` only after required artifacts are written.

Failed or cancelled imports must not leave a ready prepared document. The file-backed implementation performs best-effort cleanup of the document container after marking failure where practical.
