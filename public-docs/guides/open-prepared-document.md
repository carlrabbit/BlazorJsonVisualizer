# Open a Prepared Document

## Status

Preview public workflow.

This guide describes the current public workflow for opening a prepared JSON document in the BlazorJsonVisualizer Layer 1 viewer. Package publication and final consumer API shape remain planned.

## Purpose

Huge JSON documents should be imported into a prepared document before interactive use.

After import, applications open the prepared document by identifier or prepared-document reference. The viewer then requests bounded ranges, row windows, search results, and navigation data from the prepared-document runtime bridge.

## Workflow

```text
Import raw JSON once.
Open the prepared document by identifier.
Render an initial Layer 1 viewport.
Request additional rows/ranges as the user navigates.
Search through prepared-document services.
Reveal search results, offsets, or JSON Pointer paths.
Apply controlled Layer 1 edits when needed.
Export later when needed.
```

## Small vs Huge Documents

Small documents may still be opened through a full-text workflow when supported by samples or early APIs.

Huge documents should use the prepared-document workflow. The prepared-document workflow must not pass the whole source JSON document to the browser as one string.

## Expected Application Shape

Illustrative shape only:

```csharp
var result = await importJobs.WaitForCompletionAsync(jobId, cancellationToken);
var documentId = result.Document!.DocumentId;
```

```razor
<JsonVisualizer PreparedDocumentId="@documentId" />
```

Applications must also register the prepared-document runtime bridge service used by the component host so the browser runtime can request metadata, rows, search results, reveal targets, and bounded source ranges for the prepared document.

## Runtime Behavior

When a prepared document is opened, the viewer should:

- read document metadata;
- report available index capabilities;
- render an initial viewport;
- request only bounded row/range data;
- use prepared search services rather than visible-row scanning;
- reveal search results, offsets, or JSON Pointer targets through bounded row requests;
- show diagnostics when required indexes are missing, stale, failed, or unsupported;
- apply controlled Layer 1 edit commands when enabled by the session and structural metadata.

## Editing Boundary

Layer 1 editing is controlled structural editing, not freeform text editing.

Supported operations are documented in:

- `public-docs/guides/layer1-controlled-editing.md`

## User Contract

The prepared-document store remains the durable source of truth.

The browser runtime may cache bounded ranges and rows, but the browser cache is not the prepared document.

Applications must not depend on the default file-backed internal directory layout or EF Core table layout.
