# Transaction Model Spec

## Purpose

Defines how Layer 1 changes JSON document state.

## Core rule

All editing flows through runtime transactions. The DOM must not be the canonical mutation surface.

## Transaction envelope

Each transaction has:

- `transactionId: string`
- `sessionId: string`
- `baseRevision: number`
- `kind: string`
- `payload: object`

## Document revision

A document session has a monotonically increasing revision number. Successful transactions increment the revision.

## Initial transaction kinds

### `replaceValue`

Replaces a primitive JSON value.

Fields:

- `nodeId: string`
- `value: string | number | boolean | null`

Rules:

- Target node must be a primitive value node.
- Replacement must be representable as valid JSON.

### `setPropertyValue`

Sets an object property value.

Fields:

- `objectNodeId: string`
- `propertyName: string`
- `value: JsonValueDto`

Rules:

- Target node must be an object node.
- If property exists, replace its value.
- If property does not exist, add it.

### `removeProperty`

Removes an object property.

Fields:

- `objectNodeId: string`
- `propertyName: string`

### `insertArrayItem`

Inserts an item into an array.

Fields:

- `arrayNodeId: string`
- `index: number`
- `value: JsonValueDto`

### `removeArrayItem`

Removes an item from an array.

Fields:

- `arrayNodeId: string`
- `index: number`

## Patch emission

A successful transaction emits a host-visible change event. Milestone 004 may use a simple internal patch DTO instead of final JSON Patch.

Patch fields:

- `sessionId: string`
- `documentId: string`
- `baseRevision: number`
- `newRevision: number`
- `transactionId: string`
- `operations: RuntimePatchOperationDto[]`

## Undo/redo

Milestone 004 should define the shape of undo/redo but may keep implementation minimal.

Minimum requirement:

- runtime records enough information to reverse `replaceValue` for primitive values.
- unsupported undo cases must be explicit.

Milestone 004 may rebuild the full structural index after undo or redo. Fold state preservation is best-effort only for nodes whose exact paths survive the rebuild.

## Non-goals

- Freeform text editing.
- Multi-cursor editing.
- Rich clipboard semantics.
- Stable node IDs across arbitrary complex edits.
- Collaborative editing.
