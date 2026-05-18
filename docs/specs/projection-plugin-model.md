# Projection Plugin Model Spec

## Purpose

Defines Layer 3 projection plugins.

## Core rule

Projection plugins do not edit raw document text. Plugins read from runtime projection APIs and write through runtime transactions.

## Projection

A projection is an alternate view over a supported JSON structure.

A projection has:

- `projectionId: string`
- `sessionId: string`
- `kind: string`
- `sourcePath: string`
- `capabilities: ProjectionCapability[]`

## Initial projection kind

### `table.arrayOfObjects`

Displays an array where each item is an object. Columns are derived from object property names and optionally enriched by schema metadata.

Supported source shape:

```json
[
  { "name": "Alice", "age": 30 },
  { "name": "Bob", "age": 42 }
]
```

## Projection capabilities

Initial capabilities:

- `readRows`
- `selectRow`
- `selectCell`
- `editCell`

## Table model DTOs

### `TableProjectionDto`

Fields:

- `projectionId: string`
- `sourcePath: string`
- `columns: TableColumnDto[]`
- `rows: TableRowDto[]`

### `TableColumnDto`

Fields:

- `columnId: string`
- `propertyName: string`
- `title?: string`
- `expectedType?: string | string[]`

### `TableRowDto`

Fields:

- `rowId: string`
- `itemNodeId: string`
- `index: number`
- `cells: TableCellDto[]`

### `TableCellDto`

Fields:

- `columnId: string`
- `propertyName: string`
- `valueNodeId?: string`
- `value: JsonValueDto | undefined`
- `diagnostics?: SchemaDiagnosticDto[]`

## Editing

Cell edits must become Layer 1 transactions.

For an existing property:

- use `setPropertyValue` against the row object node.

For a missing property:

- use `setPropertyValue` against the row object node.

## Selection synchronization

The table projection should be able to map:

- row selection to source object node
- cell selection to value node or property path

## Non-goals

- Generic plugin marketplace.
- Arbitrary custom plugin loading.
- Blazor-authored plugin components as a required implementation.
- Complex table editing.
- Virtualized huge tables.

