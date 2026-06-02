# Schema Overlay Model Specification

## Goal

Define Layer 2 JSON Schema overlay behavior for BlazorJsonVisualizer prepared-document sessions.

Layer 2 attaches schema metadata to a Layer 1 prepared-document session, resolves schema information for structural JSON locations, surfaces read-only details and decorations, and reports schema validation diagnostics without owning the canonical document model.

## Scope

This specification covers:

- schema attachment and detachment;
- supported JSON Schema subset;
- schema source and association rules;
- node/path-to-schema resolution;
- schema metadata payloads;
- row decorations and hover/details payloads;
- schema validation diagnostics;
- revision consistency;
- bounded prepared-document behavior;
- failure semantics.

## Non-Goals

This specification does not define:

- schema-aware editing;
- automatic schema inference;
- Layer 3 projection/plugin behavior;
- schema-driven form rendering;
- arbitrary remote `$ref` fetching;
- complete JSON Schema conformance;
- invalid JSON import or invalid JSON best-effort viewing;
- storage-provider-specific schema persistence;
- public documentation wording;
- visual design styling.

## Core Rule

Schema data is an overlay.

Layer 2 must not own:

- source text;
- source chunks;
- prepared-document storage;
- transaction logs;
- Layer 1 viewport mechanics;
- Layer 1 folding state;
- Layer 1 search state;
- raw document mutation.

Layer 2 may read Layer 1 structural metadata, path metadata, node identity, revision identity, diagnostics infrastructure, and bounded runtime protocol operations.

A document without a schema overlay must remain viewable, searchable, foldable, editable through supported Layer 1 controlled transactions, and exportable according to the Layer 1 specs.

## Supported Schema Baseline

JSON Schema Draft 2020-12 is the intended baseline.

Milestone 0021 supports a bounded subset. Implementations must not imply complete Draft 2020-12 conformance.

### Required keywords

The minimum supported keywords are:

| Keyword | Required behavior |
|---|---|
| `$schema` | Accept and expose as schema metadata when present. Unsupported draft identifiers must produce a warning diagnostic, not silent full-conformance claims. |
| `$id` | Accept and expose as schema identity metadata when present. |
| `$ref` | Resolve local same-document references only, such as `#/$defs/Name`. Remote references and cross-document references are unsupported. |
| `$defs` | Supported as local reference targets. |
| `type` | Used for metadata and validation. |
| `properties` | Used to resolve object property metadata. |
| `items` | Used to resolve array item metadata. Tuple validation may be reported unsupported unless explicitly implemented. |
| `required` | Used for metadata and validation of object properties. |
| `enum` | Used for metadata and validation. |
| `const` | Used for metadata and validation. |
| `title` | Used for metadata/details. |
| `description` | Used for metadata/details. |
| `default` | Used for metadata/details only; it must not mutate the document. |
| `minimum` | Used for numeric validation when implemented. |
| `maximum` | Used for numeric validation when implemented. |
| `minLength` | Used for string validation when implemented. |
| `maxLength` | Used for string validation when implemented. |
| `minItems` | Used for array validation when implemented. |
| `maxItems` | Used for array validation when implemented. |

### Unsupported keywords

Unsupported validation-affecting keywords must not silently produce a clean validation result when they could change correctness.

The implementation may classify unsupported keywords as:

- `ignoredAnnotation` when the keyword is annotation-only or harmless for validation correctness;
- `unsupportedValidationKeyword` when the keyword can affect validation outcome;
- `unsupportedReference` for remote or cross-document references;
- `unsupportedDraft` when `$schema` identifies an unsupported draft.

Unsupported keyword diagnostics may be warnings unless the unsupported feature prevents meaningful metadata resolution.

## Schema Attachment

A prepared-document session may have zero or one active schema overlay in Milestone 0021.

A schema attachment request contains:

```ts
interface SchemaOverlayAttachRequestDto {
  sessionId: string;
  documentId: string;
  baseRevision: number;
  schemaId: string;
  source: SchemaSourceDto;
  options?: SchemaOverlayOptionsDto;
}
```

```ts
type SchemaSourceDto =
  | { kind: "inline"; schema: unknown }
  | { kind: "namedLocal"; schemaId: string; schema: unknown };
```

```ts
interface SchemaOverlayOptionsDto {
  maxDiagnostics?: number;
  includeUnsupportedKeywordDiagnostics?: boolean;
}
```

Result:

```ts
interface SchemaOverlayAttachResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string;
  schemaId?: string;
  diagnostics: SchemaOverlayDiagnosticDto[];
}
```

Rules:

- Attaching a schema does not change the prepared document revision.
- Attaching a new schema replaces the previous active schema overlay for that session unless the implementation rejects the request.
- Invalid schema input must return diagnostics and must not corrupt the previous overlay state.
- The active overlay is session-scoped and non-durable unless a later milestone specifies durable schema association.
- Schema input may be held in browser runtime state, .NET bridge state, or both, but neither side may expose storage-provider internals as the schema association contract.

## Schema Detachment

A detach request contains:

```ts
interface SchemaOverlayDetachRequestDto {
  sessionId: string;
  documentId: string;
  overlayId?: string;
}
```

Result:

```ts
interface SchemaOverlayDetachResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  detachedOverlayId?: string;
  diagnostics: SchemaOverlayDiagnosticDto[];
}
```

Detaching a schema must clear schema metadata, row decorations, hover/details metadata, and active schema diagnostics for the session. It must not clear Layer 1 diagnostics or alter Layer 1 viewport/search/fold state except for removing schema-specific decorations.

## Node and Path Resolution

Schema metadata resolution targets one of:

```ts
type SchemaOverlayTargetDto =
  | { kind: "jsonPointer"; path: string }
  | { kind: "node"; nodeId: string }
  | { kind: "row"; rowIndex: number; nodeId?: string; path?: string };
```

Resolution result:

```ts
interface SchemaOverlayMetadataResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string;
  target: SchemaOverlayTargetDto;
  metadata?: SchemaNodeMetadataDto;
  diagnostics: SchemaOverlayDiagnosticDto[];
}
```

Rules:

- JSON Pointer is the preferred durable document path representation when available.
- Node identifiers may be used when the prepared-document session can map them to a current path or structural location.
- Row resolution may use row `nodeId` or row `path` from the prepared render row.
- Resolution must fail with diagnostics when required path or structural metadata is missing, stale, failed, or unsupported.
- Resolution must not require loading the whole JSON document into the browser as one string.
- Resolution may be on-demand for visible rows and selected nodes.

## Schema Node Metadata

For each target where schema metadata can be resolved, the overlay may expose:

```ts
interface SchemaNodeMetadataDto {
  nodeId?: string;
  path?: string;
  schemaPath: string;
  schemaId: string;
  title?: string;
  description?: string;
  expectedType?: string | string[];
  enumValues?: JsonValueDto[];
  constValue?: JsonValueDto;
  required?: boolean;
  defaultValue?: JsonValueDto;
  numericConstraints?: SchemaNumericConstraintsDto;
  stringConstraints?: SchemaStringConstraintsDto;
  arrayConstraints?: SchemaArrayConstraintsDto;
  unsupportedKeywords?: UnsupportedSchemaKeywordDto[];
}
```

```ts
interface SchemaNumericConstraintsDto {
  minimum?: number;
  maximum?: number;
}

interface SchemaStringConstraintsDto {
  minLength?: number;
  maxLength?: number;
}

interface SchemaArrayConstraintsDto {
  minItems?: number;
  maxItems?: number;
}

interface UnsupportedSchemaKeywordDto {
  keyword: string;
  schemaPath: string;
  classification: "ignoredAnnotation" | "unsupportedValidationKeyword" | "unsupportedReference" | "unsupportedDraft";
  message: string;
}
```

`JsonValueDto` must use the repository's existing runtime DTO shape when one exists. If no shared DTO exists, use a simple JSON-compatible discriminated union or primitive/object/array representation and keep it internal to runtime protocol DTOs.

## Row Decorations

A prepared render row may be enriched with schema overlay decoration metadata.

The overlay row decoration payload is:

```ts
interface SchemaRowDecorationDto {
  rowIndex: number;
  nodeId?: string;
  path?: string;
  overlayId: string;
  hasMetadata: boolean;
  hasDiagnostics: boolean;
  severity?: "info" | "warning" | "error";
  markerKinds: SchemaRowMarkerKindDto[];
}
```

```ts
type SchemaRowMarkerKindDto =
  | "schemaMetadata"
  | "description"
  | "required"
  | "enum"
  | "default"
  | "validationDiagnostic"
  | "unsupportedKeyword";
```

Rules:

- Row decorations must be optional.
- Row decorations must not be required for Layer 1 rendering.
- A row without schema metadata must still render normally.
- Decoration payloads must be bounded to visible or requested rows.
- Decoration severity is derived from the highest schema diagnostic severity for the row or target.

## Hover and Details Payload

The overlay must expose details for a selected row, node, or path.

```ts
interface SchemaDetailsRequestDto {
  sessionId: string;
  documentId: string;
  revision: number;
  target: SchemaOverlayTargetDto;
}
```

```ts
interface SchemaDetailsResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string;
  target: SchemaOverlayTargetDto;
  metadata?: SchemaNodeMetadataDto;
  diagnostics: SchemaOverlayDiagnosticDto[];
}
```

The details result may be used by hover UI, a side panel, or sample-specific details UI. The spec does not require a specific visual presentation.

## Validation Diagnostics

Schema validation diagnostics must be separate from Layer 1 diagnostics.

```ts
interface SchemaValidationRequestDto {
  sessionId: string;
  documentId: string;
  revision: number;
  target?: SchemaOverlayTargetDto;
  maxDiagnostics: number;
  continuationToken?: string;
}
```

```ts
interface SchemaValidationResultDto {
  success: boolean;
  sessionId: string;
  documentId: string;
  revision: number;
  overlayId?: string;
  diagnostics: SchemaOverlayDiagnosticDto[];
  continuationToken?: string;
  truncated: boolean;
}
```

```ts
interface SchemaOverlayDiagnosticDto {
  diagnosticId: string;
  category: SchemaOverlayDiagnosticCategoryDto;
  severity: "info" | "warning" | "error";
  source: "schemaOverlay";
  sessionId: string;
  documentId: string;
  revision?: number;
  overlayId?: string;
  schemaId?: string;
  nodeId?: string;
  path?: string;
  schemaPath?: string;
  message: string;
  recoverability?: "retry" | "rebuildIndex" | "changeSchema" | "unsupported" | "none";
}
```

```ts
type SchemaOverlayDiagnosticCategoryDto =
  | "schemaNotAttached"
  | "invalidSchema"
  | "unsupportedDraft"
  | "unsupportedKeyword"
  | "unsupportedReference"
  | "referenceResolutionFailed"
  | "pathMetadataMissing"
  | "structuralMetadataMissing"
  | "indexMissing"
  | "indexBuilding"
  | "indexStale"
  | "indexFailed"
  | "revisionMismatch"
  | "targetNotFound"
  | "validationFailed"
  | "validationPartial"
  | "unsupportedOperation";
```

Validation diagnostics must:

- include revision identity when tied to document content;
- identify path and node when available;
- identify schema path when available;
- be bounded by `maxDiagnostics`;
- set `truncated` or `continuationToken` when more diagnostics exist;
- distinguish unsupported validation features from clean validation success.

## Revision Consistency

Schema overlay data is revision-bound when it depends on document content or document structural metadata.

Rules:

- Attaching a schema records the prepared document revision used for the overlay.
- Metadata resolution requests must include the caller's expected revision.
- Validation requests must include the caller's expected revision.
- If the current session revision differs from the request revision, the operation must return a `revisionMismatch` diagnostic instead of presenting stale metadata or diagnostics as current.
- A document revision change does not mutate the schema document, but it invalidates document-content-derived metadata and validation diagnostics until recomputed or re-requested for the new revision.

## Bounded Data Rules

Layer 2 over prepared documents must preserve the range-backed Layer 1 data model.

- Do not load a huge prepared document into the browser as one giant string for schema overlay work.
- Do not precompute unbounded metadata for every node unless the implementation proves the operation is bounded by storage-side indexes and returns bounded results.
- Metadata and diagnostics requests must be bounded.
- Visible-row decoration requests must be bounded to visible or requested row windows.
- Continuation/paging must be used where a result set can exceed request limits.

## Runtime Operations

Prepared-document schema overlay operations may be implemented through the general runtime protocol or the prepared-document runtime protocol. Operation names must remain explicit.

Minimum host-facing operations:

- `attachPreparedSchemaOverlay`
- `detachPreparedSchemaOverlay`
- `getPreparedSchemaMetadata`
- `getPreparedSchemaDetails`
- `getPreparedSchemaDiagnostics`
- `getPreparedSchemaRowDecorations`

Normal user/request failures must return result DTOs with diagnostics instead of unhandled exceptions.


## Implementation Notes

The Milestone 0021 implementation keeps prepared-document schema overlay state session-scoped in the browser runtime and exposes explicit Blazor host operations for attaching, detaching, resolving details, requesting diagnostics, and refreshing row decorations. Metadata and diagnostics remain revision-bound. The first validation path is intentionally bounded to requested or visible prepared rows and may use row text or caller-supplied row values; it does not load a huge prepared document into the browser as one string.

Local same-document `$ref` targets are resolved for metadata and visible-row validation. Remote and cross-document references return structured unsupported-reference diagnostics. Tuple validation, conditional/applicator keywords, pattern/format validation, and additional-property validation remain unsupported validation-affecting keywords for this milestone and must not be interpreted as a clean full Draft 2020-12 validation result.

## Failure Semantics

Normal failures include:

- session not found;
- document not found;
- schema not attached;
- invalid schema;
- unsupported schema draft;
- unsupported keyword;
- unsupported reference;
- missing path metadata;
- missing structural metadata;
- missing, building, stale, or failed index;
- revision mismatch;
- unknown node, path, or row;
- request exceeds bounds.

These failures must be visible through `SchemaOverlayDiagnosticDto` or through a higher-level result diagnostic collection.

Infrastructure exceptions may still occur for exceptional failures.

## Interaction With Layer 1 Controlled Editing

This milestone is read-only at Layer 2.

Layer 2 must not introduce schema-aware document mutation.

When a supported Layer 1 controlled edit changes the prepared document revision, schema overlay metadata and diagnostics tied to the previous revision become stale. The overlay may keep the schema attachment, but metadata and diagnostics must be recomputed or fail with `revisionMismatch` before being shown as current.

## Interaction With Layer 3 Projections

Projection plugins may later consume schema overlay metadata to improve labels, expected types, enum hints, constraints, and diagnostics.

Milestone 0021 must not require Layer 3 plugins and must not introduce projection-specific schema contracts.

## Authority

This document is authoritative for Layer 2 JSON Schema overlay behavior over prepared-document sessions.

It supersedes earlier small-document-only schema overlay prototype scope.

This document is not authoritative for:

- prepared-document storage layout;
- general runtime protocol outside schema overlay operations;
- Layer 1 viewport/search/edit/export behavior except where schema overlay must preserve boundaries;
- public documentation wording;
- visual design styling.

## Document Contract

When this spec changes, review:

- `docs/specs/runtime-protocol.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/architecture/schema-overlay-boundary.md`
- `docs/architecture/document-model.md`
- `docs/TERMINOLOGY.md`
