# Import Diagnostics Specification

## Goal

Define stable diagnostics emitted during JSON ingestion and prepared-document import.

## Scope

This specification covers diagnostic severity, stable codes, diagnostic location fields, public documentation requirements, and the exception/diagnostic boundary.

## Diagnostic Shape

The implementation should preserve these concepts:

```csharp
public sealed record JsonImportDiagnostic(
    JsonImportDiagnosticSeverity Severity,
    string Code,
    string Message,
    long? ByteOffset = null,
    long? Line = null,
    long? Column = null,
    string? JsonPointer = null);
```

Severity values must include:

```text
Info
Warning
Error
```

A fatal import problem is represented as an `Error` diagnostic plus failed import result. A separate fatal severity is not required.

## Stable Codes

Diagnostic codes are part of the public troubleshooting contract.

Use a consistent prefix. Recommended initial prefix:

```text
BJV-INGEST-
```

Initial required codes:

| Code | Severity | Meaning |
|---|---|---|
| `BJV-INGEST-001` | Error | Source could not be opened. |
| `BJV-INGEST-002` | Error | Source encoding is unsupported. |
| `BJV-INGEST-003` | Error | JSON is invalid and invalid JSON import is disabled. |
| `BJV-INGEST-004` | Warning | Source length is unknown; progress percentage is unavailable. |
| `BJV-INGEST-005` | Warning | Optional search index could not be built. |
| `BJV-INGEST-006` | Warning | Optional path index could not be built. |
| `BJV-INGEST-007` | Error | Import was cancelled before a ready prepared document was published. |
| `BJV-INGEST-008` | Error | Prepared document finalization failed. |
| `BJV-INGEST-009` | Warning | Source contains UTF-8 BOM; BOM was accepted and handled. |
| `BJV-INGEST-010` | Error | Configured document identifier is invalid or already in use. |

Additional codes may be added when implementation discovers concrete cases. Public docs must be updated in the same change.

## Location Fields

Diagnostics should include the most specific location available:

- byte offset for source-level findings;
- line and column when line mapping is available;
- JSON Pointer when structural position is known;
- no location when the diagnostic is source/job/provider-level.

Durable offsets are byte offsets unless a spec explicitly says otherwise.

## Diagnostic vs Exception Boundary

Use diagnostics for expected import findings and user-actionable failures.

Use exceptions for unexpected infrastructure failures, programming errors, provider failures that cannot be represented as import results, and cancellation tokens thrown through lower-level APIs.

Where practical, the import-job layer should convert expected exceptions into failed import results with diagnostics.

## Message Requirements

Diagnostic messages must be concise and user-actionable.

Messages must not expose internal file-backed storage paths unless required to troubleshoot a file-path source and safe for the current context.

Messages must not promise unsupported repair behavior.

## Public Documentation

Every stable code emitted by implementation must be listed in:

- `public-docs/diagnostics/import-diagnostics.md`

## Authority

This document is authoritative for:

- import diagnostic shape;
- import diagnostic code namespace;
- initial import diagnostic codes;
- diagnostic location semantics;
- public diagnostic documentation requirements.

## Document Contract

When this spec changes, review:

- `docs/specs/data-ingestion.md`
- `docs/specs/import-jobs.md`
- `docs/specs/encoding-and-offsets.md`
- `public-docs/diagnostics/import-diagnostics.md`
- `public-docs/diagnostics.md`
