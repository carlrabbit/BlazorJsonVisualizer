# Schema Overlay Model Spec

## Purpose

Defines how JSON Schema metadata is attached to Layer 1 structural JSON documents.

## Core rule

Schema data is an overlay. It does not own the canonical document text, structural index, or transaction model.

## Scope

Milestone 005 supports small to medium JSON documents. Full large-document schema partitioning, remote schema resolution, and exhaustive validation are later concerns.

## Supported schema baseline

The runtime should treat JSON Schema Draft 2020-12 as the intended baseline, but Milestone 005 may implement a subset.

Minimum supported subset:

- `type`
- `properties`
- `items`
- `required`
- `enum`
- `description`
- `title`
- `default`

## Schema attachment

A schema attachment has:

- `schemaId: string`
- `documentId: string`
- `schema: object`

## Schema node metadata

For each structural node where schema metadata can be resolved, the overlay may expose:

- `nodeId: string`
- `schemaPath: string`
- `title?: string`
- `description?: string`
- `expectedType?: string | string[]`
- `enumValues?: JsonValueDto[]`
- `required?: boolean`
- `defaultValue?: JsonValueDto`

## Diagnostics

Schema diagnostics must be represented separately from parse diagnostics.

Diagnostic fields:

- `diagnosticId: string`
- `nodeId?: string`
- `path: string`
- `severity: "info" | "warning" | "error"`
- `message: string`
- `source: "schema"`

## UI expectations

Milestone 005 should support:

- hover/title/description display
- validation marker rendering
- enum suggestion metadata
- required-property indication

## Non-goals

- Full JSON Schema implementation.
- Remote `$ref` resolution.
- Large-document partitioned validation.
- Schema-driven form rendering.
- Projection plugins.

## Projection metadata use

Projection plugins may use schema overlay metadata to improve labels, expected types, enum hints, and diagnostics. Projection plugins must still function without schema metadata when the source shape is structurally supported.
