# Document Model Architecture

The canonical Layer 1 model is structure-first. Raw text is retained, but navigation, folding, and later semantic features depend on the structural index.

Milestone 003 uses full-text input and a complete in-memory structural index for small documents. This is a prototype constraint, not the final large-document model.

## Editing model

Layer 1 editing is controlled structural editing. The runtime may expose inline edit affordances, but committed changes must become transactions before document state changes.
