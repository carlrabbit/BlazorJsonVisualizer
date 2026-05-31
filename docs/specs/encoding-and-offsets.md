# Encoding and Offsets Specification

## Goal

Define encoding support and offset semantics for JSON ingestion, diagnostics, indexes, and prepared-document import.

## Scope

This specification covers supported encodings, BOM handling, byte offsets, line/column mapping, UTF-8 chunk-boundary handling, and invalid byte behavior.

## Encoding Policy

The first supported encoding policy is UTF-8-first.

Required behavior:

- UTF-8 without BOM is supported.
- UTF-8 with BOM is supported.
- UTF-8 BOM is recognized and handled without treating it as JSON content.
- Other encodings are unsupported by default.
- Unsupported encodings must fail import with a diagnostic unless an explicit opt-in path is implemented.

The implementation may detect encoding through BOM and/or configured source metadata. Heuristic encoding detection is not required. The current ingestion job layer rejects unsupported BOMs and non-UTF-8 charset metadata, and accepts UTF-8 BOM by stripping it before prepared-document storage.

## Invalid Bytes

Invalid UTF-8 byte sequences must fail import by default.

The importer must not silently replace invalid bytes in the durable prepared document unless a later spec defines a lossy import mode.

## Offset Model

Durable storage and index offsets are byte offsets into the normalized source byte stream after source acquisition.

Line and column positions are derived metadata for diagnostics and UI display.

The implementation must avoid treating .NET UTF-16 character indexes as durable source offsets.

## Line and Column Mapping

The line index must support mapping byte offsets to one-based line and column values where practical.

Line ending handling:

- `\n` is a line break;
- `\r\n` is a single line break;
- lone `\r` may be treated as a line break or rejected only if documented and tested.

Column values should be one-based. The implementation must document whether columns count UTF-8 code points, Unicode scalar values, or another stable unit. For the first implementation, byte-relative columns are acceptable if clearly documented and not exposed as a rich text-editing guarantee.

## Chunk Boundaries

UTF-8 decoding must handle multi-byte sequences that cross source chunk boundaries.

The importer must not split decoded text incorrectly when a UTF-8 sequence spans chunks.

## JSON Pointer Relationship

JSON Pointer is structural metadata and may be unavailable for early lexer/encoding diagnostics.

When structural context is known, diagnostics may include JSON Pointer. Byte offset remains the durable location anchor.

## Export Relationship

Export should preserve unchanged source bytes where practical.

Encoding output defaults to UTF-8. BOM preservation or emission must be explicitly defined by export policy if implemented. The importer accepting a BOM does not automatically require exporter BOM emission.

## Authority

This document is authoritative for:

- ingestion encoding support;
- BOM handling;
- invalid byte behavior;
- byte offset semantics;
- line/column mapping expectations;
- UTF-8 chunk-boundary handling.

## Document Contract

When this spec changes, review:

- `docs/specs/data-ingestion.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/document-import.md`
- `docs/specs/search-index.md`
- `docs/specs/prepared-document-storage-format.md`
- `public-docs/guides/import-huge-json.md`
