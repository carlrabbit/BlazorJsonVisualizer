# Layer 2 JSON Schema Overlay

## Status

Preview public workflow.

This guide describes the repository-supported read-only Layer 2 JSON Schema overlay over prepared documents while package publication remains planned.

## Purpose

A schema overlay attaches JSON Schema metadata to an open prepared-document session.

The overlay helps users understand and validate a JSON document by showing schema-derived metadata, row markers, details, and diagnostics without changing the Layer 1 document model.

## Supported workflow

```text
Import raw JSON.
Open a prepared document session.
Attach a JSON Schema overlay.
Inspect visible row decorations and details.
Review schema diagnostics.
Detach or replace the overlay when needed.
```

A prepared document can still be viewed, searched, folded, edited through supported Layer 1 controlled transactions, and exported without a schema overlay.

## What the overlay can show

When the required path or structural metadata is available, the overlay can show:

- schema title and description;
- expected JSON type;
- enum and const values;
- required-property information;
- default values as metadata;
- numeric, string, and array constraints when supported;
- unsupported schema keyword warnings;
- schema validation diagnostics.

Default values are explanatory metadata. They do not mutate the document.

## Diagnostics

Schema overlay diagnostics are separate from Layer 1 diagnostics.

Layer 1 diagnostics describe prepared-document viewing, search, editing, export, bridge, index, storage, and decode behavior.

Schema overlay diagnostics describe schema attachment, schema resolution, validation, unsupported schema behavior, and revision mismatch.

See:

- `public-docs/diagnostics/schema-overlay-diagnostics.md`

## Revision behavior

Schema metadata and diagnostics are tied to the prepared-document revision they were produced for.

Attaching a schema does not change the prepared-document revision. Controlled Layer 1 edits can change the document revision. After a revision change, previously computed schema metadata and diagnostics must not be shown as current.

## Bounded huge-document behavior

The schema overlay must preserve the huge-document model.

The viewer should request bounded schema metadata, row decorations, details, and diagnostic pages. It must not load the entire prepared document into the browser as one large string just to provide schema overlay behavior.

## Supported schema scope

The intended baseline is JSON Schema Draft 2020-12, but the repository-supported preview scope is a subset.

Supported behavior includes local schema attachment, local same-document `$ref` resolution, core type/property/item metadata, common annotation keywords, selected validation keywords, row decorations, details payloads, and bounded diagnostics.

## Current limits

The following remain planned or out of scope unless documented separately:

- schema-aware editing;
- automatic schema inference;
- Layer 3 projection/plugin integration;
- arbitrary remote `$ref` fetching;
- complete JSON Schema conformance;
- schema-driven form rendering;
- invalid JSON import or invalid JSON best-effort viewing;
- durable schema association in prepared-document storage.

Unsupported schema behavior must fail clearly through diagnostics or visible degraded-state messages. It must not silently imply full schema support.

## Related docs

- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/diagnostics/schema-overlay-diagnostics.md`
