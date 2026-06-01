# Prepared Document Runtime Protocol Specification

## Goal

Define explicit DTOs and interop operations for opening and viewing prepared documents through the Blazor host and TypeScript Layer 1 runtime.

## Scope

This specification covers prepared-document runtime protocol messages, DTO shape, paging/bounding rules, revision identity, index-state reporting, and failure semantics.

## Relationship to Runtime Protocol

`docs/specs/runtime-protocol.md` defines the general Blazor-host-to-browser-runtime boundary.

This spec specializes that boundary for prepared-document sessions. If this spec and `docs/specs/runtime-protocol.md` conflict, update both documents in the same change so protocol authority remains coherent.

## Protocol Principles

- Use explicit DTOs.
- Do not expose internal .NET storage types.
- Do not expose TypeScript runtime classes over interop.
- Include revision identity on prepared-document data responses.
- Use bounded requests and responses.
- Return result objects for normal user/request failures.
- Report missing/stale/failed index state explicitly.
- Keep full-text document sessions and prepared-document sessions distinct.

## Host-to-Runtime Operations

### `openPreparedDocumentSession`

Opens a range-backed prepared-document session.

Request fields:

- `sessionId: string`
- `documentId: string`
- `initialViewport?: PreparedViewportRequestDto`
- `options?: PreparedDocumentRuntimeOptionsDto`

Result fields:

- `success: boolean`
- `sessionId: string`
- `documentId: string`
- `revision?: number`
- `metadata?: PreparedDocumentMetadataDto`
- `diagnostics: RuntimeDiagnosticDto[]`

### `closePreparedDocumentSession`

Closes the prepared-document runtime session and releases bridge resources.

Request fields:

- `sessionId: string`

Result fields:

- `success: boolean`
- `diagnostics: RuntimeDiagnosticDto[]`

### `getPreparedDocumentMetadata`

Returns metadata and capability information for the opened prepared document.

Request fields:

- `sessionId: string`

Result type:

- `PreparedDocumentMetadataDto`

### `getPreparedRows`

Requests a bounded row window or enough data for the runtime to render a bounded row window.

Request fields:

- `sessionId: string`
- `firstRow: number`
- `rowCount: number`
- `foldStateRevision?: number`

Result fields:

- `sessionId: string`
- `documentId: string`
- `revision: number`
- `firstRow: number`
- `rowCount: number`
- `totalKnownRows?: number`
- `rows: PreparedRenderRowDto[]`
- `diagnostics: RuntimeDiagnosticDto[]`

### `readPreparedTextRange`

Requests a bounded source range by UTF-8 byte offsets.

Request fields:

- `sessionId: string`
- `startByteOffset: number`
- `maxByteLength: number`

Result fields:

- `sessionId: string`
- `documentId: string`
- `revision: number`
- `requestedStartByteOffset: number`
- `actualStartByteOffset: number`
- `actualEndByteOffset: number`
- `text: string`
- `truncated: boolean`
- `diagnostics: RuntimeDiagnosticDto[]`

### `setPreparedFoldState`

Updates fold state for a prepared-document session.

Request fields:

- `sessionId: string`
- `nodeId: string`
- `folded: boolean`

Result fields:

- `success: boolean`
- `foldStateRevision: number`
- `diagnostics: RuntimeDiagnosticDto[]`

### `searchPreparedDocument`

Requests bounded search results from the prepared-document search service.

Request fields:

- `sessionId: string`
- `query: string`
- `scope?: "allText" | "propertyNames" | "stringValues"`
- `ignoreCase?: boolean`
- `maxResults: number`
- `continuationToken?: string`

Result fields:

- `sessionId: string`
- `documentId: string`
- `revision: number`
- `results: PreparedSearchResultDto[]`
- `continuationToken?: string`
- `diagnostics: RuntimeDiagnosticDto[]`

Unsupported scopes must fail clearly. They must not silently fall back to incorrect all-text behavior.

### `revealPreparedLocation`

Requests reveal by offset, search result, JSON Pointer, or node identifier.

Request fields:

- `sessionId: string`
- `target: PreparedRevealTargetDto`

Result fields:

- `success: boolean`
- `reason?: PreparedRevealFailureReasonDto`
- `rowIndex?: number`
- `nodeId?: string`
- `expandedNodeIds: string[]`
- `viewport?: PreparedViewportRequestDto`
- `diagnostics: RuntimeDiagnosticDto[]`

## Runtime-to-Host Events

### `preparedDocumentSessionOpened`

Fields:

- `sessionId: string`
- `documentId: string`
- `revision: number`

### `preparedDocumentSessionClosed`

Fields:

- `sessionId: string`
- `documentId: string`

### `preparedDocumentDiagnosticsChanged`

Fields:

- `sessionId: string`
- `diagnostics: RuntimeDiagnosticDto[]`

### `preparedViewportChanged`

Fields:

- `sessionId: string`
- `firstRow: number`
- `rowCount: number`
- `focusedNodeId?: string`

## Core DTOs

```ts
interface PreparedDocumentMetadataDto {
  sessionId: string;
  documentId: string;
  revision: number;
  sourceByteLength: number;
  sourceEncoding: "utf-8";
  documentState: "ready" | "failed" | "deleted" | "unknown";
  indexes: Record<string, PreparedIndexStateDto>;
  capabilities: PreparedDocumentCapabilityDto[];
}
```

```ts
interface PreparedIndexStateDto {
  name: string;
  state: "missing" | "building" | "ready" | "stale" | "failed";
  version?: number;
  message?: string;
}
```

```ts
interface PreparedRenderRowDto {
  rowIndex: number;
  kind: "node" | "foldPlaceholder" | "diagnostic";
  nodeId?: string;
  depth: number;
  text: string;
  folded?: boolean;
  startByteOffset?: number;
  endByteOffset?: number;
  path?: string;
  diagnostics?: RuntimeDiagnosticDto[];
}
```

```ts
interface PreparedSearchResultDto {
  resultId: string;
  startByteOffset: number;
  endByteOffset: number;
  preview: string;
  path?: string;
  nodeId?: string;
}
```

```ts
type PreparedRevealTargetDto =
  | { kind: "byteRange"; startByteOffset: number; endByteOffset?: number }
  | { kind: "searchResult"; resultId: string; startByteOffset: number; endByteOffset: number }
  | { kind: "jsonPointer"; path: string }
  | { kind: "node"; nodeId: string };
```

```ts
type PreparedRevealFailureReasonDto =
  | "notFound"
  | "invalidTarget"
  | "notIndexed"
  | "indexMissing"
  | "indexStale"
  | "indexFailed"
  | "sessionNotFound"
  | "documentNotReady"
  | "unsupported";
```

## Bounds and Limits

Implementations must define conservative limits for:

- maximum text range bytes per request;
- maximum row count per request;
- maximum search results per page;
- maximum preview length;
- maximum diagnostics per response.

When a request exceeds a limit, the result must be bounded and must include a diagnostic or truncation flag.

## Offset Policy

Prepared-document protocol offsets are UTF-8 byte offsets unless explicitly named otherwise.

The TypeScript runtime must not persist UTF-16 offsets as prepared-document durable locations.

## Failure Semantics

Normal failures must return result objects with diagnostics instead of throwing:

- unknown session;
- unknown document;
- document not ready;
- unsupported operation;
- missing/stale/failed index;
- out-of-bounds range;
- invalid reveal target;
- search unavailable.

## Authority

This document is authoritative for prepared-document runtime protocol DTOs, operations, bounds, and failure semantics.

This document is not authoritative for storage layout, public docs wording, or DOM rendering implementation.

## Document Contract

When this spec changes, review:

- `docs/specs/runtime-protocol.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/search-index.md`
- `docs/specs/path-navigation.md`
- `docs/TERMINOLOGY.md`
