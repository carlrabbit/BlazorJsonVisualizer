# Prepared Document Runtime Boundary

## Purpose

Describe the durable boundary between the .NET prepared-document backend, the Blazor host, and the TypeScript Layer 1 browser runtime when viewing prepared documents.

This architecture document exists because prepared-document viewing crosses runtime, storage, interop, and browser-rendering boundaries that must remain stable across later editing, schema overlay, and projection milestones.

## Boundary Summary

```text
.NET prepared-document store
  owns durable prepared artifacts, source chunks, manifests, indexes, transaction logs, export data

Prepared document runtime bridge
  adapts store/handle operations into bounded runtime DTOs

Blazor host
  mounts the component, configures sessions, routes interop calls, and owns app integration

TypeScript browser runtime
  owns browser-side session state, viewport interaction, rendering coordination, fold state, and UI navigation
```

## Ownership Rules

### .NET Prepared-Document Store

The store owns durable prepared-document truth.

It provides access through prepared-document APIs and storage-provider abstractions. The store may use a file-backed provider by default, but physical layout is not a consumer contract.

### Prepared Document Runtime Bridge

The bridge owns adaptation. It translates prepared-document operations into protocol-safe DTOs for the Blazor/runtime boundary.

The bridge must not expose provider internals, file paths, or physical artifact names.

### Blazor Host

The Blazor host owns component lifecycle, application configuration, authentication/authorization context, service registration, and interop routing.

The Blazor host does not own Layer 1 runtime internals.

### TypeScript Browser Runtime

The browser runtime owns browser-side interaction and rendering coordination.

It may cache bounded ranges and row windows. It must not become the durable store for prepared documents.

## Data Flow

Opening a prepared document follows this flow:

```text
Blazor component receives DocumentId or prepared document reference
  -> Blazor host asks bridge to open a prepared runtime session
  -> bridge opens prepared document handle through store
  -> bridge returns metadata and capabilities
  -> TypeScript runtime requests row windows/ranges/search as needed
  -> bridge serves bounded DTOs
  -> browser runtime renders and updates viewport/fold/search state
```

## Bounded Data Rule

Prepared-document viewing must use bounded requests and responses.

The browser runtime must not receive the entire source document as one string for prepared-document sessions.

Large data access must flow through:

- bounded row requests;
- bounded text range requests;
- bounded search result pages;
- bounded metadata or structural summaries.

## Offset Rule

Prepared-document durable locations use UTF-8 byte offsets.

Browser strings may use JavaScript string indexing internally only for transient display text returned by the bridge. They must not replace byte offsets as durable document locations.

## Degraded State Rule

Missing, stale, failed, or unsupported indexes must produce explicit capabilities or diagnostics.

The runtime must not silently pretend that search, path reveal, folding, or structural rows are available when required indexes are not ready.

## Read-Only Rule

Prepared-document runtime sessions are read-only for Milestone 0015.

Later editing milestones may add transaction-aware runtime write paths. Those milestones must update this boundary if write ownership changes.

## Architecture Non-Goals

This document does not define:

- storage-provider implementation details;
- exact DTO fields;
- public documentation wording;
- visual design;
- editing transaction semantics;
- schema overlay or projection behavior.

## Authority

This document is authoritative for ownership and boundary rules for prepared-document runtime viewing.

Behavioral details remain in specs:

- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`

## Document Contract

When this document changes, review:

- `docs/ARCHITECTURE.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/prepared-document-store.md`
- `docs/TERMINOLOGY.md`
