# Prepared Document Store Specification

## Goal

Define the durable abstraction used to get, list, open, and delete prepared documents.

## Scope

This specification covers store responsibilities, handles, local file-backed implementation expectations, and ownership boundaries.

## Store Interface

```csharp
public interface IPreparedJsonDocumentStore
{
    ValueTask<PreparedJsonDocumentInfo?> GetAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask<IReadOnlyList<PreparedJsonDocumentInfo>> ListAsync(
        CancellationToken cancellationToken = default);

    ValueTask<PreparedJsonDocumentHandle> OpenAsync(
        string documentId,
        CancellationToken cancellationToken = default);

    ValueTask DeleteAsync(
        string documentId,
        CancellationToken cancellationToken = default);
}
```

## Handle

A prepared document handle represents an opened prepared document and provides access to persisted source and manifest metadata.

## Initial Store Implementation

The first implementation is a local file-backed prepared document store.

Each document directory includes at least:

- `manifest.json`
- `source.json`
- `structure.index.json`
- `search.index.json`
- `path.index.json`
- `transactions.log`

## Ownership Boundary

The .NET side owns durable prepared-document storage.

The browser runtime may cache data but is not the canonical durable store.

## Authority

This document is authoritative for:

- prepared document store responsibilities;
- store interface expectations;
- initial local store boundary;
- durable ownership rules.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document.md`
- `docs/specs/document-import.md`
- `docs/specs/document-export.md`
- `docs/specs/document-session.md`
- `docs/ENGINEERING.md`
