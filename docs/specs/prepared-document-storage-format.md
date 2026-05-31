# Prepared Document Storage Format

## Goal

Define the versioned internal storage artifacts used by prepared documents.

## Scope

This spec defines manifest state, format versioning, source chunks, index artifacts, transaction log artifacts, temporary artifacts, and compatibility behavior.

## Format Version

The first storage format version is `1`. Consumers must fail clearly when opening a prepared document with an unsupported format version.

## Manifest States

- `importing`
- `ready`
- `failed`
- `deleting`

Documents may be opened only when manifest state is `ready`.

## Source Offsets

Persisted offsets are UTF-8 byte offsets into the imported source. UI text offset conversion must go through index services; components must not silently mix byte offsets with UTF-16 code-unit offsets.

## Source Chunks

Imported source bytes are stored in bounded source chunks. The manifest records the chunk size, source byte length, encoding, hash, and current revision. Source chunks are immutable after a successful import.

## Index Artifacts

The first format persists:

- a line index with UTF-8 byte line-start offsets;
- a structural index artifact with version and byte-offset metadata;
- a search index artifact describing literal streaming search readiness;
- a path index placeholder when path indexing is deferred or missing.

Derived indexes are rebuildable unless a later spec marks an artifact required.

## Transaction Log

The transaction log is initialized during import as a versioned JSON-lines artifact with zero transactions. Editing transaction application is deferred; export fails clearly if transactions exist but cannot be applied.

## Invariants

- Documents may be opened only when manifest state is ready.
- Incompatible format versions fail clearly.
- Source chunks are immutable after import.
- Derived indexes are rebuildable unless explicitly marked required.
- The manifest is the state authority.

## Authority

This document is authoritative for internal prepared document storage format semantics.
