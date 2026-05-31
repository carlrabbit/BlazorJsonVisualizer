# Getting Started

## Status

Preview / planned for first public package release.

This surface is not release-ready. It documents the expected first supported consumer path while packaging and release readiness remain future work.

## Supported now

For small JSON documents, direct open remains available in repository/runtime work.

## Preview huge-document path

For huge JSON documents, import the JSON stream first. Import creates a prepared document with structural metadata and derived indexes. Open the prepared document for interactive work, then export when needed.

See `public-docs/guides/huge-json-documents.md` for the current lifecycle and limitations.
