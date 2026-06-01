# Export Edited Prepared Documents

## Status

Preview documentation for Milestone 0019.

## Purpose

Export materializes the current prepared document state as JSON.

For edited prepared documents, export must account for supported Layer 1 editing transactions.

## Export Contract

Export should stream unchanged source regions where possible and materialize changed regions from transactions.

The system must not silently ignore transactions during export.

## Unsupported Edits

If a prepared document contains transaction types that cannot be exported, export must fail clearly.

Partial export is not part of the initial public contract.

## Revision Reporting

Export should report which prepared document revision was exported.

Search results or viewer state from older revisions may be stale after edits.

## Related Documentation

- `docs/specs/document-export.md`
- `docs/specs/edited-prepared-document-export.md`
- `public-docs/guides/layer1-controlled-editing.md`
