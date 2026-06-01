# Prepared Document Runtime Bridge Specification

## Goal

Define the .NET-side bridge that adapts prepared-document store and handle operations into runtime-oriented operations for the Blazor host and TypeScript Layer 1 browser runtime.

## Scope

This specification covers prepared runtime session opening, metadata access, range reads, row/range access, search delegation, reveal delegation, diagnostics, disposal, and storage-boundary rules.

## Non-Goals

This specification does not define:

- the physical file-backed storage layout;
- a cloud or database storage provider;
- Layer 2 schema overlays;
- Layer 3 projections;
- editing transactions;
- public package release behavior;
- browser rendering details beyond the data required by the runtime.

## Ownership

The .NET side owns durable prepared-document storage and store handles.

The prepared document runtime bridge owns adaptation between prepared-document storage concepts and runtime protocol DTOs.

The TypeScript browser runtime owns browser-side session state, viewport interaction, rendering coordination, fold UI state, search-result selection, and user navigation behavior.

The browser runtime must not become the durable source of truth for prepared documents.

## Runtime Session Identity

A prepared runtime session has:

- a runtime session identifier;
- a prepared document identifier;
- the opened prepared document revision;
- lifecycle state;
- index-state snapshot;
- bridge-owned handle or lease state.

Runtime session identifiers are not prepared document identifiers. Multiple runtime sessions may point at the same prepared document.

## Required Bridge Capabilities

The bridge must support:

- opening a prepared document for read-only Layer 1 viewing;
- returning metadata for the opened prepared document;
- reading bounded text ranges from prepared source storage;
- returning row windows or data sufficient for row-window construction;
- returning structural node summaries needed by folding and reveal behavior;
- delegating search to prepared-document search services;
- resolving reveal requests by byte offset and, when available, JSON Pointer;
- reporting missing, stale, failed, or unsupported index states;
- closing sessions and releasing handles/leases.

## Storage Boundary

The bridge must use the prepared-document store and storage abstraction.

The bridge must not expose:

- physical filesystem paths;
- file-backed directory layout details;
- index file names;
- provider-specific object names as consumer-facing contracts;
- internal storage object handles to TypeScript.

## Metadata Contract

Prepared document metadata returned through the bridge must include at least:

- runtime session identifier;
- prepared document identifier;
- revision;
- source byte length;
- source encoding policy;
- prepared document state;
- known index states;
- supported runtime operations.

Supported runtime operations must be explicit. If search, path reveal, or structural row access is unavailable because an index is missing, stale, failed, or unsupported, the metadata must make that visible.

## Range Read Contract

Text range reads must be bounded by request limits.

Requests use UTF-8 byte offsets unless a field explicitly states otherwise.

A range read result must include:

- requested start byte offset;
- actual start byte offset;
- actual end byte offset;
- decoded text;
- revision;
- truncation flag when a limit is applied;
- diagnostics when the requested range cannot be served exactly.

Range reads must not require the whole source to be loaded as one string.

## Row Access Contract

The bridge may return rendered row DTOs directly or return structural/range data that the TypeScript runtime maps into rows.

The selected approach must satisfy:

- requests are bounded;
- row responses include stable row or node identity where available;
- folded descendants are not returned as normal visible rows;
- missing index states produce diagnostics instead of silent incorrect rows;
- response DTOs include revision identity.

## Search Contract

The bridge delegates search to prepared-document search behavior.

Search requests must be bounded by max-result and continuation/paging semantics.

Search must not scan only visible rows.

Search results must include:

- prepared document identifier;
- revision;
- start byte offset;
- end byte offset;
- bounded preview text;
- optional JSON Pointer;
- optional node identifier or structural location if known;
- continuation token or end-of-results marker when paging is used.

## Reveal Contract

Reveal requests may target:

- byte-offset ranges;
- search results;
- JSON Pointer paths when path metadata exists;
- structural node identifiers when available to the bridge.

Reveal results must be non-throwing for normal user input and must include:

- success flag;
- reason on failure;
- target row/window when resolved;
- fold expansion requirements when structural data is available;
- diagnostics when reveal is blocked by missing or stale indexes.

## Diagnostics

The bridge must translate prepared-document and storage/index failures into runtime diagnostics.

Diagnostics must distinguish:

- document not found;
- session not found;
- document not ready;
- revision mismatch;
- range outside source bounds;
- unsupported operation;
- missing index;
- stale index;
- failed index;
- storage provider failure;
- decode failure.

Infrastructure exceptions may still occur for exceptional failures, but normal user/request failures must return result objects with diagnostics.

## Concurrency

Prepared runtime sessions are read-only in this milestone.

Multiple read-only runtime sessions may open the same prepared document concurrently when the prepared-document store supports it.

The bridge must not introduce multi-writer editing semantics.

## Authority

This document is authoritative for:

- prepared-document runtime bridge responsibilities;
- bridge/store/browser ownership boundaries;
- prepared runtime session semantics;
- bridge range/search/reveal diagnostics;
- storage abstraction rules for runtime access.

This document is not authoritative for:

- storage format details;
- tokenizer lexical behavior;
- TypeScript DOM rendering implementation;
- public documentation wording.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/runtime-protocol.md`
- `docs/specs/prepared-document-store.md`
- `docs/specs/prepared-document-storage-abstraction.md`
- `docs/specs/search-index.md`
- `docs/architecture/prepared-document-runtime-boundary.md`
- `docs/TERMINOLOGY.md`
