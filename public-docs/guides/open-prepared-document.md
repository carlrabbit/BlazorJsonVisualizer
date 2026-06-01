# Open a Prepared Document

## Status

Preview planned public workflow.

This guide describes the intended public workflow for opening a prepared JSON document in the BlazorJsonVisualizer Layer 1 viewer. Package publication and final consumer API shape remain planned.

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
Reveal search results or JSON Pointer paths.
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
<JsonVisualizer DocumentId="@documentId" />
```

The final component parameters and service names may differ while the package remains preview/planned.

## Runtime Behavior

When a prepared document is opened, the viewer should:

- read document metadata;
- report available index capabilities;
- render an initial viewport;
- request only bounded row/range data;
- use prepared search services rather than visible-row scanning;
- show diagnostics when required indexes are missing, stale, failed, or unsupported.

## Limitations

Milestone 0015 prepared-document sessions are read-only.

Editing, transaction replay into the browser runtime, schema overlays, and projection plugins are later workflows.

Search may be bounded or paged. Returning every match in a huge document at once is not expected.

## User Contract

The prepared-document store remains the durable source of truth.

The browser runtime may cache bounded ranges and rows, but the browser cache is not the prepared document.

Applications must not depend on the default file-backed internal directory layout.
