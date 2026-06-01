# Range-Backed Layer 1 Viewer Specification

## Goal

Define Layer 1 viewer behavior when a JSON document is opened from a prepared document instead of loaded as a complete browser-side text string.

## Scope

This specification covers prepared-document Layer 1 sessions, viewport rows, range requests, folding, search result reveal, JSON Pointer reveal, diagnostics, caching assumptions, and non-editing constraints.

## Relationship to Existing Layer 1 Specs

`docs/specs/document-session.md` defines the original Layer 1 session model and explicitly allows future prepared-document workflows.

`docs/specs/viewport-model.md` defines row-based viewport semantics.

This spec extends those concepts for range-backed prepared-document sessions.

## Session Modes

Layer 1 supports two session modes:

```text
fullText
preparedDocument
```

`fullText` sessions own source text as a JavaScript string and remain acceptable for small documents and early samples.

`preparedDocument` sessions use the prepared-document runtime bridge and must not require the full source text as one JavaScript string.

## Prepared Document Session State

A prepared-document Layer 1 session includes:

- runtime session identifier;
- prepared document identifier;
- opened revision;
- metadata snapshot;
- viewport state;
- fold state;
- bounded row/range cache;
- diagnostics;
- active search state, if any.

The prepared document store remains the durable source of truth.

## Viewport Behavior

The viewer requests bounded row windows.

A row-window request includes:

- first visible row;
- visible row count;
- fold-state revision when needed;
- optional focused node or reveal target.

The runtime may cache bounded row windows, but cache invalidation must occur when:

- prepared document revision changes;
- fold state changes;
- bridge reports stale data;
- session closes.

## Render Row Requirements

Prepared render rows must follow the row concepts from `docs/specs/viewport-model.md` and add prepared-document location metadata where available.

A render row should include:

- row index;
- kind;
- node identifier when known;
- depth;
- display text;
- folded flag;
- start/end byte offsets when known;
- JSON Pointer when known;
- diagnostics when the row represents degraded state.

## Folding Behavior

Fold state is browser-session state unless a later milestone explicitly persists it.

Folding must not change the prepared document revision.

Folding a structural node hides descendants from normal visible row responses. Reveal may expand folded ancestors as needed.

If structural metadata is missing, stale, failed, or unsupported, fold commands must fail clearly and must not corrupt viewport state.

## Search Integration

Search uses prepared-document search services via the runtime bridge.

Search must not scan only visible rows.

Search result pages must be bounded.

Search result reveal must:

1. use the search result offset/path/node metadata;
2. request or compute the row window containing the target;
3. expand folded ancestors when structural data is available;
4. focus or mark the target row;
5. return explicit failure when target resolution is unavailable.

## Path and Offset Reveal

JSON Pointer reveal uses structural/path metadata when available.

Offset reveal uses byte offsets and structural/line/range indexes when available.

Normal reveal failure is non-throwing and must return a result with a reason.

Supported failure reasons include:

- `notFound`;
- `invalidTarget`;
- `notIndexed`;
- `indexMissing`;
- `indexStale`;
- `indexFailed`;
- `unsupported`.

## Diagnostics

The viewer must surface diagnostics for:

- document not ready;
- missing required index;
- stale index;
- failed index;
- unsupported search scope;
- out-of-range request;
- bridge/session disposal;
- runtime protocol mismatch.

Diagnostics may be displayed through existing Layer 1 diagnostic affordances or sample-specific diagnostic panels.

## Caching

The first implementation may use simple bounded caches.

The implementation must avoid unbounded accumulation of source ranges, rows, and search results.

The cache is an optimization and must not be the durable document store.

## Performance Expectations

The first implementation targets correctness and bounded data flow.

It must be possible to view a prepared document without loading all source text into the browser.

Pixel-perfect virtualization, variable row heights, and advanced scroll anchoring are not required.

## Editing

Prepared-document sessions are read-only in this milestone.

Editing commands must either be unavailable or return explicit unsupported-operation results.

## Authority

This document is authoritative for prepared-document Layer 1 viewer behavior, session mode distinctions, range-backed viewport behavior, folding, search reveal, path/offset reveal, and diagnostics.

This document is not authoritative for storage layout, import jobs, public docs wording, or visual design details.

## Document Contract

When this spec changes, review:

- `docs/specs/document-session.md`
- `docs/specs/viewport-model.md`
- `docs/specs/path-navigation.md`
- `docs/specs/search-index.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/architecture/prepared-document-runtime-boundary.md`
- `public-docs/guides/open-prepared-document.md`
