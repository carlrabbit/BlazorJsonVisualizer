# Data Ingestion Specification

## Goal

Define the end-to-end ingestion model used to turn user-provided raw JSON input into a prepared document.

## Scope

This specification covers the orchestration boundary between ingestion sources, import jobs, import diagnostics, encoding/offset policy, and prepared-document import/storage APIs.

Detailed subcontracts are defined by:

- `docs/specs/ingestion-sources.md`
- `docs/specs/import-jobs.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/encoding-and-offsets.md`

## User-Facing Contract

Huge JSON documents are not opened as giant in-memory strings.

The ingestion workflow is:

```text
Ingestion source
  -> import job
  -> progress and diagnostics
  -> prepared document
  -> open/search/export through prepared-document APIs
```

A successful ingestion creates or returns a prepared document reference that can be opened through the prepared-document store.

A failed or cancelled ingestion must not publish a prepared document in `Ready` state.

## Ownership

The ingestion layer owns:

- source adapter abstraction;
- import job lifecycle;
- progress reporting;
- cancellation routing;
- import diagnostics;
- import result shape;
- encoding and offset policy enforcement at source-read boundaries.

The prepared-document storage engine owns:

- durable source chunks;
- manifests;
- index artifacts;
- storage leases;
- provider-specific storage objects;
- cleanup of prepared-document containers according to storage-engine rules.

The browser runtime owns neither durable ingestion nor durable prepared-document storage.

## Public API Concepts

The ingestion public API must expose these concepts:

- ingestion source;
- import request/options;
- import job handle;
- import job status;
- import progress;
- import result;
- import diagnostics.

Names may vary to match repository conventions, but the concepts must remain explicit.

## Import Request

An import request must contain at least:

- optional caller-provided document identifier;
- prepared-document import options or a reference to them;
- whether search/path indexes should be built where supported;
- invalid JSON policy;
- optional caller metadata.

The default invalid JSON policy is to reject invalid JSON and produce diagnostics.

## Import Result

An import result must distinguish:

- succeeded;
- succeeded with warnings;
- failed;
- cancelled.

A successful result includes prepared-document information. Failed and cancelled results do not include a ready prepared document.

## Error and Diagnostic Boundary

Use diagnostics for document/source findings and user-actionable import problems.

Use exceptions for infrastructure failures, programming errors, or unexpected provider failures. When possible, convert expected import failures into import results with diagnostics rather than leaking implementation exceptions as the primary user contract.

## State Consistency

The ingestion layer must not report a job as ready before the prepared-document store can open the document.

If the storage engine reports failure while finalizing artifacts, the import job must become failed and must include a diagnostic or failure message suitable for public troubleshooting.

## Authority

This document is authoritative for:

- the overall ingestion workflow;
- ownership boundaries between ingestion and prepared-document storage;
- import result semantics;
- ingestion orchestration invariants.

## Document Contract

When this spec changes, review:

- `docs/specs/ingestion-sources.md`
- `docs/specs/import-jobs.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/encoding-and-offsets.md`
- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`
- `public-docs/guides/import-huge-json.md`
- `public-docs/diagnostics/import-diagnostics.md`
