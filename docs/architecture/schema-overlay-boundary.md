# Schema Overlay Boundary Architecture

## Purpose

Describe the durable Layer 2 ownership boundary for JSON Schema overlays over prepared-document sessions.

This architecture document exists because schema overlay work crosses the TypeScript browser runtime, Blazor host, prepared-document runtime bridge, Layer 1 structural metadata, diagnostics, and sample UI surfaces. The boundary must remain stable before schema-aware editing and Layer 3 projections are added.

## Boundary Summary

```text
Prepared document store
  owns durable prepared artifacts, source chunks, indexes, transaction logs, export data

Prepared document runtime bridge
  adapts prepared-document operations and schema-overlay requests into bounded DTOs

Layer 1 prepared-document viewer
  owns viewport, folding, search, reveal, controlled edit entry points, and Layer 1 diagnostics

Layer 2 schema overlay
  owns schema attachment state, schema resolution, metadata, row decorations, and schema diagnostics

Blazor host
  mounts components, configures services, routes interop, and provides schema sources

TypeScript browser runtime
  owns browser-side overlay state, details UI coordination, row decoration rendering, and interaction state
```

## Ownership Rules

### Prepared Document Store

The prepared document store remains the durable source of truth for imported JSON, source chunks, indexes, transaction logs, and export data.

Schema overlay work must not expose physical storage layout, provider object names, file paths, EF storage layout, or internal storage handles as consumer contracts.

### Prepared Document Runtime Bridge

The bridge owns bounded server-side adaptation.

For schema overlay work, the bridge may:

- validate schema attachment requests;
- resolve schema metadata using prepared-document path or structural metadata;
- provide bounded row decoration payloads;
- provide bounded schema diagnostics;
- translate missing/stale/failed index states into schema overlay diagnostics.

The bridge must not:

- make schema metadata the durable prepared-document model;
- mutate source chunks or transaction logs;
- expose storage-provider internals;
- return unbounded schema metadata for huge documents.

### Layer 1 Prepared-Document Viewer

Layer 1 owns canonical document interaction.

Layer 1 remains responsible for:

- prepared-document session identity;
- revision identity;
- viewport row loading;
- folding;
- search and reveal;
- controlled edit commands;
- edited export;
- Layer 1 diagnostics and degraded-state behavior.

Layer 2 must not take ownership of these mechanics. A prepared document must remain viewable without a schema overlay.

### Layer 2 Schema Overlay

Layer 2 owns schema-specific state and derived metadata.

Layer 2 may attach schema metadata to a session, resolve schema metadata for structural locations, add row decorations, surface hover/details content, and produce schema diagnostics.

Layer 2 must treat all document-content-derived metadata as revision-bound. A schema attachment may survive revision changes, but resolved metadata and validation diagnostics from an older revision must not be presented as current.

### Blazor Host

The Blazor host owns application integration.

For schema overlay work, the host may:

- accept schema input from application code or samples;
- route attach/detach/details/diagnostics calls;
- configure services used by the bridge;
- display details or diagnostics through Blazor components.

The host must not own TypeScript runtime internals or prepared-document storage internals.

### TypeScript Browser Runtime

The browser runtime owns browser-side session state and UI coordination.

For schema overlay work, the runtime may:

- keep active overlay state for the mounted session;
- request metadata and diagnostics through explicit DTO operations;
- cache bounded row decorations and details payloads;
- coordinate hover/details panels;
- render schema markers in the DOM.

The runtime must not receive the entire prepared document source as one JavaScript string for schema overlay behavior.

## Data Flow

Attaching and using a schema overlay follows this flow:

```text
Blazor host receives schema source
  -> host/bridge validates schema source and opens overlay state for the prepared session
  -> runtime records active overlay id and revision
  -> viewer requests bounded row window
  -> overlay resolves metadata/diagnostics for visible rows or selected target
  -> runtime renders row markers and details payloads
```

Schema diagnostics follow this flow:

```text
runtime or host requests schema diagnostics with session/document/revision
  -> bridge/runtime validates active overlay and revision
  -> schema resolver validates bounded target or diagnostic page
  -> result returns schema diagnostics and continuation/truncation state
  -> viewer displays schema diagnostics separately from Layer 1 diagnostics
```

## Bounded Data Rule

Layer 2 must preserve the prepared-document bounded data model.

Allowed bounded access patterns:

- visible-row schema decoration requests;
- selected-node or selected-path metadata requests;
- bounded validation diagnostic pages;
- bounded schema details payloads;
- local same-document `$ref` resolution within the attached schema document.

Disallowed access patterns:

- loading a huge prepared document into the browser as one giant string for validation;
- returning every schema/node mapping for a huge document without paging or limits;
- treating a complete browser-side JSON object parse as required for prepared-document schema overlay;
- using Layer 2 caches as durable document state.

## Revision Rule

Schema overlay data that depends on document content is bound to a prepared-document revision.

- Attach operations record the current revision.
- Metadata and diagnostic requests include the expected revision.
- A revision mismatch returns diagnostics.
- Stale schema diagnostics must not be displayed as current.
- Schema attachment does not itself change the prepared-document revision.

## Diagnostic Rule

Schema overlay diagnostics are distinct from Layer 1 diagnostics.

Schema overlay diagnostics describe schema attachment, schema resolution, unsupported schema behavior, validation, and revision mismatch.

Layer 1 diagnostics continue to describe prepared-document viewing, search, edit, export, bridge, index, storage, and decoding failures.

The UI may display both in one panel, but the underlying diagnostic source/category must remain distinguishable.

## Read-Only Rule

Milestone 0021 is read-only from Layer 2.

Layer 2 may explain and validate document structure. It must not apply schema-aware edits or mutate raw text.

Future schema-aware editing must use Layer 1 controlled transaction APIs and must update the relevant specs and boundary docs before changing ownership.

## Reference Resolution Rule

Milestone 0021 supports local same-document schema references only.

Remote references and cross-document references require future policy for fetching, trust, caching, diagnostics, and offline behavior. They must fail clearly in this milestone.

## Architecture Non-Goals

This document does not define:

- exact TypeScript module names;
- exact CSS or visual design;
- complete JSON Schema validation algorithms;
- public documentation wording;
- durable schema storage;
- package or release readiness.

## Authority

This document is authoritative for the Layer 2 schema overlay ownership boundary over prepared-document sessions.

Behavioral details remain in:

- `docs/specs/schema-overlay-model.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-viewer-diagnostics.md`

## Document Contract

When this document changes, review:

- `docs/ARCHITECTURE.md`
- `docs/specs/schema-overlay-model.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/architecture/document-model.md`
- `docs/architecture/prepared-document-runtime-boundary.md`
- `docs/TERMINOLOGY.md`
