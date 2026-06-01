# Import Jobs Specification

## Goal

Define the lifecycle, progress, cancellation, and result model for long-running JSON import operations.

## Scope

This specification covers in-process import job management for prepared-document ingestion. It does not require distributed scheduling, durable job queues, or cross-process job coordination.

## Job States

Import jobs must use states equivalent to:

```text
Queued
OpeningSource
ReadingSource
WritingChunks
BuildingStructuralIndex
BuildingSearchIndex
BuildingPathIndex
Finalizing
Ready
Failed
Cancelled
```

Implementations may combine index-building states when the storage engine uses a different internal pipeline, but public status must still expose a useful current step.

## Status Shape

The job status must expose:

- job identifier;
- optional document identifier;
- current state;
- current step text or enum;
- bytes read when known;
- total bytes when known;
- progress fraction when calculable;
- diagnostics collected so far;
- start time;
- update/completion time where available.

Progress must remain valid when total length is unknown. In that case, report bytes read and step without a percentage.

## Job Manager

The implementation should preserve these concepts:

```csharp
public interface IJsonImportJobManager
{
    ValueTask<JsonImportJobHandle> StartAsync(
        IJsonIngestionSource source,
        JsonImportRequest request,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportJobStatus?> GetStatusAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask<JsonImportResult> WaitForCompletionAsync(
        string jobId,
        CancellationToken cancellationToken = default);

    ValueTask CancelAsync(
        string jobId,
        CancellationToken cancellationToken = default);
}
```

Names may be changed to fit repository conventions.

## Cancellation

Cancellation must be supported at three levels:

- before source opening;
- during stream read/import;
- during index/finalization work where practical.

Cancelled jobs must not publish a ready prepared document.

Cancellation may be cooperative. A job may transition to `Failed` instead of `Cancelled` if the underlying provider reports a non-cancellation failure while cancellation is requested. The result must make this distinction clear.

## Result States

Import result states must distinguish:

```text
Succeeded
SucceededWithWarnings
Failed
Cancelled
```

A successful result includes prepared-document information.

A failed/cancelled result includes diagnostics and/or failure metadata, but no ready prepared document.

## Status Retention

The first implementation may keep job status in process memory.

Durable job history is not required.

An implementation may evict completed job status after a documented retention interval or capacity limit, but must not evict a running job.

## Authority

This document is authoritative for:

- import job states;
- import status semantics;
- progress reporting;
- cancellation behavior;
- import result semantics.

## Document Contract

When this spec changes, review:

- `docs/specs/data-ingestion.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/document-import.md`
- `public-docs/guides/import-huge-json.md`
