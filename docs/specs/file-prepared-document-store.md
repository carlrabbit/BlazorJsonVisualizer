# File Prepared Document Store

## Goal

Define the default file-backed provider for prepared document storage.

## Scope

This spec defines root directory ownership, path safety, temporary file handling, atomic rename usage, document directory layout, file cleanup, and file-backed provider limitations.

## Root Directory

The file-backed provider stores all generated artifacts below a configured root directory. The provider may create the root directory when configured to do so.

## Path Safety

Document identifiers and object names must not allow absolute paths, parent-directory traversal, empty segments, or platform-specific backslash traversal. The provider validates the final path remains under the configured root.

## Temporary Writes

Object writers create temporary files under the document container and promote them to committed object names only on commit. Aborted or disposed uncommitted writers remove temporary files where practical.

## Layout

The initial internal layout is versioned and implementation-owned:

```text
<root>/<document-id>/
  manifest.json
  source/chunks/*.chunk
  source/chunks.index
  indexes/lines.index
  indexes/structure.index
  indexes/search.index
  indexes/paths.index
  transactions/log.jsonl
  temp/
```

Only the manifest and high-level behavior are public contracts. Physical filenames remain internal details unless another spec makes them public.

## Invariants

- All files are stored under the configured root directory.
- Document IDs and object names must not allow path traversal.
- Temporary files must not be treated as committed objects.
- Ready state is determined by the manifest.
- Delete while open fails clearly.
- The first implementation provides process-local coordination, not cross-process distributed locks.

## Authority

This document is authoritative for the default file-backed provider behavior.
