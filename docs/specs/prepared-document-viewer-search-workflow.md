# Prepared Document Viewer Search Workflow Specification

## Goal

Define the user-facing Layer 1 search workflow for prepared-document sessions.

## Scope

This specification covers search request shape, result paging, search-state ownership, reveal behavior, index-state reporting, and viewer behavior for search over prepared documents.

## Non-Goals

This specification does not define:

- storage-engine search index format;
- schema-aware search;
- fuzzy search;
- ranking;
- regex query language;
- Layer 2 search overlays;
- release documentation.

## Search Ownership

Prepared-document search is provided by prepared-document services through the runtime bridge.

The browser runtime owns user interaction state:

- active query text;
- search options;
- current result page;
- focused result;
- displayed result previews;
- reveal target state.

The browser runtime must not search only visible rows and present that as full-document search.

## Search Request

A search request must be bounded.

Required request fields:

- runtime session id;
- query text;
- case-sensitive or case-insensitive option where supported;
- scope where supported;
- maximum result count;
- continuation token when paging;
- opened revision or expected revision.

Initial supported scope may be `allText` if property-name and string-value scopes are not yet implemented. Unsupported scopes must fail clearly.

## Search Result

A search result must include:

- prepared document id;
- revision searched;
- start byte offset;
- end byte offset;
- bounded preview text;
- optional JSON Pointer;
- optional structural node id;
- diagnostic/degraded-state information when applicable.

A search response must include:

- result page;
- continuation token or end-of-results marker;
- searched revision;
- index state used;
- truncation/degraded flags where applicable.

## Index State Behavior

The viewer must expose search index state:

```text
missing
building
ready
stale
failed
unsupported
```

Behavior:

- `ready`: search may execute normally.
- `missing`: search is unavailable or degraded explicitly.
- `building`: search reports in-progress state and may refuse queries.
- `stale`: search must not pretend results are current.
- `failed`: search reports failure diagnostics.
- `unsupported`: search reports capability is unavailable.

## Search Reveal

Revealing a search result must:

1. verify the result revision against the current session revision;
2. resolve the target by offset, pointer, or node id where available;
3. request a bounded row window containing the target;
4. expand folded ancestors when structural metadata supports it;
5. focus or mark the target row;
6. return structured failure when resolution is impossible.

## UI Contract

The viewer UI should display:

- active query;
- running/searching state;
- current page of results;
- continuation availability;
- searched revision when relevant;
- stale/missing/failed index status;
- reveal failure reason when reveal fails.

## Authority

This document is authoritative for prepared-document Layer 1 search workflow and reveal behavior.

## Document Contract

When this spec changes, review:

- `docs/specs/search-index.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/layer1-prepared-document-search.md`
