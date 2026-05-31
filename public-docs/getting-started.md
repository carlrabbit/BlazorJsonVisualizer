# Getting Started

## Status

Planned for first public package release.

This surface is not yet release-ready. It will document the first supported consumer path when packaging and release readiness are active.

## Current Huge-Document Path

For small JSON documents, direct open remains available.

For huge JSON documents, import the JSON stream first. Import creates a prepared document with structural metadata and derived indexes. Open the prepared document for interactive work, then export when needed.

See:

- `public-docs/guides/huge-json-documents.md`

## Huge documents

For huge JSON documents, import the JSON stream into a prepared document store first. The prepared document can then be reopened, searched, and exported without treating the entire source as one UI string.

See `public-docs/guides/huge-json-documents.md` for the current lifecycle and limitations.
