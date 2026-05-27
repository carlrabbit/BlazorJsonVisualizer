# Huge JSON Documents

## Status

Current for the prepared-document lifecycle contract.

## Lifecycle

Huge JSON files are imported before they are opened interactively.

Import creates a prepared document with structural metadata and derived indexes. The prepared document can be reopened, searched, edited incrementally, and exported back to JSON.

The original source is not rewritten on every edit.

## Storage Ownership

Prepared-document persistence is owned by the .NET side.

The browser runtime owns interactive session state and viewport behavior.

## Export Contract

Initial format-preservation contract:

- unchanged regions should be preserved byte-for-byte where practical;
- changed regions may be normalized by export policy.
