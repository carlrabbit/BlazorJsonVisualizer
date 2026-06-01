# Ingestion Sources Specification

## Goal

Define the abstraction used by applications to provide raw JSON input to the ingestion pipeline.

## Scope

This specification covers source metadata, opening readable streams, source ownership, default source adapters, and non-goals.

## Source Interface

The ingestion source abstraction should preserve these concepts:

```csharp
public interface IJsonIngestionSource
{
    string DisplayName { get; }
    long? Length { get; }
    string? ContentType { get; }

    ValueTask<Stream> OpenReadAsync(
        CancellationToken cancellationToken = default);
}
```

Names may be adjusted to repository conventions, but the source must expose display metadata and a stream-opening operation.

## Required Source Semantics

An ingestion source:

- represents raw JSON input before preparation;
- may have unknown length;
- may expose a display name that is not a file path;
- may expose a content type if known;
- must document whether the opened stream is owned by the caller or by the source adapter;
- must honor cancellation before and during stream acquisition where practical.

## Default Source Adapters

Implement these default adapters:

### Stream Source

Wraps a caller-provided `Stream`.

Rules:

- length may be supplied explicitly or inferred when the stream supports length;
- the adapter must document whether disposing the import stream disposes the caller-provided stream; the default implementation leaves the caller-provided stream open unless configured otherwise;
- display name defaults to a neutral value when not supplied.

### File Path Source

Wraps a readable local file path.

Rules:

- display name defaults to the file name, not necessarily the full path;
- length is read from file metadata when available;
- `OpenReadAsync` opens a new readable stream;
- file paths are an adapter detail, not the universal ingestion contract.

### Browser Upload Source

A browser/Blazor upload adapter may be implemented when the Blazor surface already has the required package reference and lifecycle boundary.

Rules:

- the adapter must not make the browser runtime the durable prepared-document store;
- the adapter must stream to the .NET ingestion pipeline;
- size limits must be explicit;
- cancellation behavior must be documented.

If the browser upload adapter cannot be implemented cleanly in the milestone, it must remain planned and public docs must say so.

## Non-Goals

This spec does not require:

- HTTP URL ingestion;
- cloud-object ingestion;
- resumable upload protocol;
- drag-and-drop UI;
- folder ingestion;
- multi-file batch ingestion;
- source deduplication.

## Authority

This document is authoritative for:

- ingestion source abstraction;
- default source adapter requirements;
- source metadata expectations;
- source ownership and lifecycle rules.

## Document Contract

When this spec changes, review:

- `docs/specs/data-ingestion.md`
- `docs/specs/import-jobs.md`
- `docs/specs/encoding-and-offsets.md`
- `public-docs/guides/import-huge-json.md`
