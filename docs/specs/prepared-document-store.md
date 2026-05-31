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

Each document container includes at least:

- `manifest.json`
- chunked source storage
- line, structural, search, and path index artifacts
- a transaction log artifact

The file-backed provider stores those artifacts in its versioned internal layout; application code must not depend on the physical file names.

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

## Storage Provider Boundary

The application-facing prepared document store is backed by `IPreparedDocumentStorageProvider`. Application users open prepared documents through store handles; replacement storage providers operate on document containers, storage objects, temporary object writers, and leases rather than physical paths.

The default store uses the internal file-backed layout defined by `docs/specs/file-prepared-document-store.md`. That layout is not the public prepared document contract.
