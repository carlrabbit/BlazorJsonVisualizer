# Export Edited Prepared Documents

## Status

Preview documentation for Milestone 0019.

## Purpose

Export materializes the current prepared document state as JSON.

For edited prepared documents, export must account for supported Layer 1 editing transactions.

## Export Contract

Export streams unchanged source regions for unedited prepared documents. For edited prepared documents, the file-backed preview implementation materializes supported Layer 1 controlled transaction kinds (`replaceNodeValue`, `renameProperty`, `insertProperty`, `removeProperty`, `insertArrayItem`, and `removeArrayItem`) and writes a complete JSON export after validating the transaction revision chain.

The system must not silently ignore transactions during export. Edited exports may normalize JSON formatting for the materialized output; no-edit exports preserve source bytes.

## Unsupported Edits

If a prepared document contains transaction types that cannot be exported, export must fail clearly.

Partial export is not part of the initial public contract.

## Revision Reporting

Use the result-returning export API to inspect the prepared document id, exported revision, transaction count, latest transaction id, and formatting policy used.

Search results or viewer state from older revisions may be stale after edits.

## Related Documentation

- `docs/specs/document-export.md`
- `docs/specs/edited-prepared-document-export.md`
- `public-docs/guides/layer1-controlled-editing.md`
