# Runtime Protocol Spec

## Purpose

Defines the boundary between the Blazor host and the TypeScript browser runtime.

## Ownership

- Blazor host owns .NET application integration, component lifecycle, server data access, and persistence hooks.
- TypeScript runtime owns browser-side session state, rendering coordination, runtime events, and later document operations.

## Protocol shape

The protocol uses explicit DTOs. Do not expose internal runtime classes over the boundary.

## Host-to-runtime messages

### `createSession`

Creates a runtime session mounted into a DOM element.

Fields:

- `hostElementId: string`
- `sessionId: string`
- `options?: RuntimeOptionsDto`

### `disposeSession`

Disposes a runtime session.

Fields:

- `sessionId: string`

### `loadTextDocument`

Loads an initial full text document. This is acceptable for early milestones only. Later large-document support may add streaming/chunked loading.

Fields:

- `sessionId: string`
- `documentId: string`
- `text: string`
- `contentType: "application/json"`

### `setViewport`

Informs the runtime of viewport constraints when required by the host.

Fields:

- `sessionId: string`
- `width: number`
- `height: number`

## Additional host-to-runtime messages for Milestone 003

### `toggleFold`

Fields:

- `sessionId: string`
- `nodeId: string`

### `revealPath`

Fields:

- `sessionId: string`
- `path: string`

## Additional host-to-runtime messages for Milestone 004

### `applyTransaction`

Fields:

- `sessionId: string`
- `transaction: RuntimeTransactionDto`

### `undo`

Fields:

- `sessionId: string`

### `redo`

Fields:

- `sessionId: string`

## Additional host-to-runtime messages for Milestone 005

### `attachSchema`

Fields:

- `sessionId: string`
- `schemaId: string`
- `schema: object`

### `detachSchema`

Fields:

- `sessionId: string`
- `schemaId: string`

### `getSchemaMetadataForPath`

Fields:

- `sessionId: string`
- `path: string`

## Additional host-to-runtime messages for Milestone 006

### `createProjection`

Fields:

- `sessionId: string`
- `projectionId: string`
- `kind: string`
- `sourcePath: string`

### `disposeProjection`

Fields:

- `sessionId: string`
- `projectionId: string`

### `selectProjectionItem`

Fields:

- `sessionId: string`
- `projectionId: string`
- `selection: ProjectionSelectionDto`

## Additional host-to-runtime messages for Milestone 015

### `openPreparedDocumentSession`

Fields:

- `sessionId: string`
- `documentId: string`
- `initialViewport?: PreparedViewportRequestDto`

### `closePreparedDocumentSession`

Fields:

- `sessionId: string`

### `getPreparedDocumentMetadata`

Fields:

- `sessionId: string`

### `getPreparedRows`

Fields:

- `sessionId: string`
- `firstRow: number`
- `rowCount: number`
- `foldStateRevision?: number`

### `readPreparedTextRange`

Fields:

- `sessionId: string`
- `startByteOffset: number`
- `maxByteLength: number`

### `setPreparedFoldState`

Fields:

- `sessionId: string`
- `nodeId: string`
- `folded: boolean`

### `searchPreparedDocument`

Fields:

- `sessionId: string`
- `query: string`
- `scope?: "allText" | "propertyNames" | "stringValues"`
- `ignoreCase?: boolean`
- `maxResults: number`
- `continuationToken?: string`

### `revealPreparedLocation`

Fields:

- `sessionId: string`
- `target: PreparedRevealTargetDto`

## Runtime-to-host events

### `sessionCreated`

Fields:

- `sessionId: string`

### `sessionDisposed`

Fields:

- `sessionId: string`

### `runtimeError`

Fields:

- `sessionId: string`
- `message: string`
- `recoverable: boolean`

### `placeholderEvent`

Temporary event used by Milestone 002 to prove roundtrip interop.

Fields:

- `sessionId: string`
- `message: string`

## Additional runtime-to-host events for Milestone 003

### `documentLoaded`

Fields:

- `sessionId: string`
- `documentId: string`
- `nodeCount: number`

### `diagnosticsChanged`

Fields:

- `sessionId: string`
- `diagnostics: RuntimeDiagnosticDto[]`

## Additional runtime-to-host events for Milestone 004

### `transactionApplied`

Fields:

- `sessionId: string`
- `transactionId: string`
- `baseRevision: number`
- `newRevision: number`

### `documentPatchProduced`

Fields:

- `sessionId: string`
- `patch: RuntimePatchDto`

### `transactionRejected`

Fields:

- `sessionId: string`
- `transactionId: string`
- `reason: string`

## Additional runtime-to-host events for Milestone 005

### `schemaAttached`

Fields:

- `sessionId: string`
- `schemaId: string`

### `schemaDiagnosticsChanged`

Fields:

- `sessionId: string`
- `diagnostics: SchemaDiagnosticDto[]`

### `schemaMetadataChanged`

Fields:

- `sessionId: string`
- `affectedNodeIds: string[]`

## Additional runtime-to-host events for Milestone 006

### `projectionCreated`

Fields:

- `sessionId: string`
- `projectionId: string`
- `kind: string`

### `projectionChanged`

Fields:

- `sessionId: string`
- `projectionId: string`

### `projectionSelectionChanged`

Fields:

- `sessionId: string`
- `projectionId: string`
- `sourceNodeId?: string`
- `sourcePath?: string`

## Versioning

Every runtime entry point must expose a runtime protocol version string. Breaking protocol changes must update this spec.

## Layer 1 Modular Commands (Milestone 009)

The Layer 1 modular host (`runtime-blazor/src/layer1Host.ts`) exposes these functions:

```ts
function layer1CreateSession(sessionId: string, sourceText: string): void
function layer1SetViewport(sessionId: string, firstVisibleRow: number, visibleRowCount: number): void
function layer1ToggleFold(sessionId: string, nodeId: string): void
function layer1RevealPath(sessionId: string, path: string): { success: boolean; nodeId?: string; reason?: string }
function layer1Render(sessionId: string, containerElement: Element): void
function layer1DisposeSession(sessionId: string): void
```

These functions operate on the Layer 1 `DocumentSession` model and are independent of the full `SessionRegistry`-based runtime.
