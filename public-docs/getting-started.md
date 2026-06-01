# Getting Started

## Status

Preview / planned for first public package release.

This surface is not release-ready. It documents the expected first supported consumer path while packaging and release readiness remain future work.

## Supported now

For small JSON documents, direct open remains available in repository/runtime work.

## Preview huge-document path

For huge JSON documents, import the JSON stream first. Import creates a prepared document with structural metadata and derived indexes. Open the prepared document for interactive Layer 1 viewing through the prepared-document runtime bridge, then export when needed.

Recommended reading:

- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/import-huge-json.md`
- `public-docs/guides/open-prepared-document.md`
- `public-docs/diagnostics/import-diagnostics.md`
