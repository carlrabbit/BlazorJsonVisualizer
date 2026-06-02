# Concepts

## Status

Preview.

This surface defines consumer-facing concepts at a high level. Supported behavior and planned behavior are separated as public APIs stabilize.

## Themes

### Supported now

BlazorJsonVisualizer themes are JSON documents that provide semantic design-token values.

Themes are a public extension contract.

The first supported mode is dark mode.

Host applications provide theme tokens as JSON.

Plugins may define plugin-local tokens under their plugin identifier.

See:

- `public-docs/samples/visual-identity-playground.md`

### Planned

The first milestone does not provide a parallel .NET object model for theme tokens.

## Prepared Documents

### Supported now

For huge JSON workflows, BlazorJsonVisualizer imports a raw JSON source into a prepared document before interactive operations.

A prepared document stores source representation, derived index metadata, and transaction-log state so the document can be reopened, searched, incrementally edited, and exported without reparsing raw source from scratch on every interaction.

Prepared-document storage details are internal. Consumers should use the prepared document store and handle APIs rather than relying on physical file names or database table details.

See:

- `public-docs/guides/huge-json-documents.md`

### Current limits

Prepared-document APIs and docs are preview surfaces while package publication is planned.

## Data Ingestion

### Supported now

The ingestion workflow accepts raw JSON through source adapters, starts an import job, reports progress and diagnostics, and produces a prepared document when import succeeds.

Default source adapters include stream and file-path sources. Browser upload, cloud-object ingestion, resumable upload, and batch import remain planned or out of scope unless documented separately.

See:

- `public-docs/guides/import-huge-json.md`
- `public-docs/diagnostics/import-diagnostics.md`

## Range-Backed Viewing

### Supported now

A prepared document can be opened through a range-backed Layer 1 viewer workflow. The viewer requests bounded rows, source ranges, search result pages, and reveal targets instead of loading the complete JSON document into the browser as one string.

The viewer supports bounded row loading, folding when structural metadata is available, prepared-document search, search result reveal, and diagnostics for missing, stale, failed, or unsupported indexes.

See:

- `public-docs/guides/open-prepared-document.md`
- `public-docs/guides/layer1-prepared-document-search.md`

## Controlled Layer 1 Editing

### Supported now

Layer 1 editing starts with controlled structural operations such as replacing primitive values, renaming properties, inserting or removing object properties, and inserting or removing array items when supported by the prepared-document structure.

Controlled edits produce validated transactions. They are not arbitrary text edits.

See:

- `public-docs/guides/layer1-controlled-editing.md`

## Edited Export

### Supported now

Edited prepared documents can be exported when their transaction log contains supported Layer 1 transaction types. Export reports the revision it materialized and fails clearly when a transaction cannot be exported.

See:

- `public-docs/guides/export-edited-prepared-document.md`

## EF Core Prepared Document Storage

### Supported now

The EF Core backend stores prepared-document artifacts through a user-owned DbContext.

DbSet properties make the required entities visible for model and migration ownership. The model-builder extension configures the authoritative BlazorJsonVisualizer EF Core model.

SQL Server storage optimizations are opt-in and provider-specific. They are not required for provider-neutral correctness.

See:

- `public-docs/guides/ef-core-prepared-document-storage.md`
- `public-docs/guides/sql-server-prepared-document-storage-optimizations.md`
