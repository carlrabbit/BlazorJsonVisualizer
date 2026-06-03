# Schema Overlay Diagnostics

## Status

Preview diagnostics reference.

This reference describes user-facing schema overlay diagnostic categories while package publication remains planned.

## Purpose

Schema overlay diagnostics explain why a JSON Schema overlay could not attach, resolve metadata, validate a target, or present current results for a prepared-document session.

Schema overlay diagnostics are separate from Layer 1 viewer diagnostics. A UI may display both in one diagnostics panel, but the diagnostic source/category must remain distinguishable.

## Common diagnostic categories

| Category | Meaning | Typical mitigation |
|---|---|---|
| `schemaNotAttached` | The operation requires an active schema overlay, but none is attached. | Attach a schema before requesting metadata, details, row decorations, or schema diagnostics. |
| `invalidSchema` | The supplied schema could not be accepted as a schema document. | Check that the schema is valid JSON and follows the supported schema shape. |
| `unsupportedDraft` | The `$schema` identifier names an unsupported or unknown draft. | Use the supported preview baseline or accept that conformance is limited. |
| `unsupportedKeyword` | The schema contains a keyword that the overlay does not fully support. | Remove the keyword, simplify the schema, or treat validation as partial. |
| `unsupportedReference` | The schema uses an unsupported reference form, such as remote or cross-document `$ref`. | Use local same-document references only. |
| `referenceResolutionFailed` | A supported reference form could not be resolved. | Check the referenced local schema path. |
| `pathMetadataMissing` | The prepared-document session cannot map the target to the required JSON Pointer/path metadata. | Rebuild or enable required indexes if available, or use a target that has path metadata. |
| `structuralMetadataMissing` | The prepared-document session lacks required structural metadata. | Rebuild or enable structural indexes if available. |
| `indexMissing` | A required prepared-document index does not exist. | Build or enable the required index when supported. |
| `indexBuilding` | A required index is not ready yet. | Retry after index building completes. |
| `indexStale` | A required index does not match the current revision. | Rebuild the index or retry after index refresh. |
| `indexFailed` | A required index is in a failed state. | Inspect index failure diagnostics and rebuild when possible. |
| `revisionMismatch` | Metadata or diagnostics were requested for a revision that is no longer current. | Re-request schema metadata or diagnostics for the current prepared-document revision. |
| `targetNotFound` | The requested node, row, or JSON Pointer target could not be resolved. | Check the target path/node or reveal the target again. |
| `validationFailed` | The current document target does not satisfy a supported schema rule. | Inspect the message and edit the document through supported Layer 1 controlled operations if correction is needed. |
| `validationPartial` | Validation results are incomplete because of bounds or unsupported features. | Request the next diagnostic page if available, or simplify unsupported schema features. |
| `unsupportedOperation` | The requested schema overlay operation is not supported in the current session. | Use supported read-only overlay operations. |

## Revision behavior

Schema diagnostics are revision-bound when they describe document content.

After a controlled Layer 1 edit changes the prepared-document revision, schema diagnostics from the previous revision must not be presented as current. The viewer should re-request diagnostics for the current revision or show a revision-mismatch diagnostic.

## Unsupported schema behavior

Unsupported validation-affecting schema keywords must not silently produce a clean validation result when they could change correctness.

The overlay may classify unsupported behavior as warnings when metadata can still be useful, but the UI must not claim complete schema validation unless the supported scope actually covers the relevant schema features.

## Related docs

- `public-docs/guides/layer2-json-schema-overlay.md`
- `public-docs/diagnostics.md`
- `public-docs/guides/huge-json-documents.md`
