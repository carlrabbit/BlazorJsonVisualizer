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

## Versioning

Every runtime entry point must expose a runtime protocol version string. Breaking protocol changes must update this spec.
