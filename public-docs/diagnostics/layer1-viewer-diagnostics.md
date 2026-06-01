# Layer 1 Viewer Diagnostics

## Status

Preview diagnostics reference for Milestones 0017 and 0019.

## Purpose

Layer 1 diagnostics explain viewer, search, editing, and export states that prevent an operation from completing normally.

## Diagnostic Categories

| Category | Meaning | Typical action |
|---|---|---|
| Document not found | The prepared document cannot be opened. | Check document id or storage provider. |
| Document not ready | Import or preparation has not completed successfully. | Wait, inspect import diagnostics, or reimport. |
| Session not found | The viewer session was closed or expired. | Reopen the prepared document. |
| Revision mismatch | A request or result targets an older revision. | Refresh, rerun search, or retry the operation. |
| Missing index | Required index does not exist. | Build or rebuild the index if supported. |
| Stale index | Required index does not match current revision. | Rebuild the index or accept degraded behavior if supported. |
| Failed index | Index creation failed. | Inspect diagnostics and rebuild or reimport. |
| Unsupported operation | The current document/session/provider does not support the requested operation. | Use a supported operation or provider. |
| Export unsupported transaction | Export cannot materialize an existing transaction. | Remove unsupported edits, implement export support, or reimport. |
| Storage failure | Storage provider failed to serve data. | Inspect storage logs/configuration. |

## Public Behavior

Normal diagnostic conditions should be displayed in the viewer or diagnostics panel. They should not cause silent incorrect results.

## Related Documentation

- `docs/specs/layer1-viewer-diagnostics.md`
- `public-docs/guides/layer1-prepared-document-search.md`
- `public-docs/guides/export-edited-prepared-document.md`
