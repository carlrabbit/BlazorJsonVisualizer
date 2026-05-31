# Prepared Document Storage Engine

## Goal

Define the high-level prepared document storage engine that coordinates import, manifests, source chunks, indexes, search, export, transactions, cleanup, and provider leases.

## Scope

This spec covers the engine-level behavior built on top of the storage-provider abstraction. Provider object operations are defined by `docs/specs/prepared-document-storage-abstraction.md`; the default file provider is defined by `docs/specs/file-prepared-document-store.md`.

## Lifecycle

The storage engine supports:

```text
Raw JSON stream
  -> streaming import
  -> source chunks and index artifacts
  -> ready manifest
  -> open handles
  -> search and export
  -> delete after handles close
```

## Import

Import writes source chunks, line index metadata, structural index metadata, search index metadata, path index metadata, transaction-log metadata, and the final ready manifest. The manifest is the state authority and is committed to `ready` only after required artifacts are complete.

## Open

Open succeeds only for storage format version `1` and manifest state `ready`. Open returns a handle that owns a read lease and observes a stable revision.

## Search and Export

Search reports the revision searched and returns UTF-8 byte offsets. Export streams unchanged source chunks and fails clearly if unapplied transactions exist.

## Cleanup and Recovery

Failed or cancelled imports must not expose ready documents. The file-backed engine performs best-effort cleanup of failed import artifacts. Delete fails while active handles exist.

## Authority

This document is authoritative for the prepared document storage engine lifecycle and cross-artifact invariants.
