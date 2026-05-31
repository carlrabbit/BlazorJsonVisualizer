# Import Diagnostics

## Status

Preview public diagnostics reference for the implemented JSON ingestion job layer.

The listed diagnostic codes are emitted by the current implementation and are intended to be stable. This document must be updated whenever import diagnostic codes are added, removed, or meaningfully changed.

## Diagnostic Format

Import diagnostics include a severity, stable code, and message, and may include:

- severity;
- stable code;
- message;
- byte offset;
- line;
- column;
- JSON Pointer when structural position is known.

Byte offset is the durable location anchor. Line, column, and JSON Pointer are helper metadata when available.

## Codes

| Code | Severity | Meaning | Suggested action |
|---|---|---|---|
| `BJV-INGEST-001` | Error | Source could not be opened. | Verify source permissions, existence, and lifecycle. |
| `BJV-INGEST-002` | Error | Source encoding is unsupported. | Provide UTF-8 JSON or use a supported encoding option when available. |
| `BJV-INGEST-003` | Error | JSON is invalid and invalid JSON import is disabled. | Fix the JSON source and import again. |
| `BJV-INGEST-004` | Warning | Source length is unknown; progress percentage is unavailable. | Import may continue; progress may show bytes read and current step only. |
| `BJV-INGEST-005` | Warning | Optional search index could not be built. | Import may complete with reduced search capability; rebuild the index when supported. |
| `BJV-INGEST-006` | Warning | Optional path index could not be built. | Import may complete with reduced navigation capability; rebuild the index when supported. |
| `BJV-INGEST-007` | Error | Import was cancelled before a ready prepared document was published. | Start the import again when ready. |
| `BJV-INGEST-008` | Error | Prepared document finalization failed. | Retry import; inspect storage/provider logs if available. |
| `BJV-INGEST-009` | Warning | Source contains UTF-8 BOM; BOM was accepted and handled. | No action required unless exact source-byte preservation policy matters. |
| `BJV-INGEST-010` | Error | Configured document identifier is invalid or already in use. | Choose a valid unused document identifier or allow automatic id generation. |

## Exceptions vs Diagnostics

Diagnostics describe import findings and expected user-actionable failures.

Unexpected infrastructure failures may still surface as exceptions or failed import results depending on where they occur.

## Related Documentation

- `public-docs/guides/import-huge-json.md`
- `public-docs/guides/huge-json-documents.md`
