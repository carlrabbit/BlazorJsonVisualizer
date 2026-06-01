# Layer 1 Controlled Editing

## Status

Preview documentation for Milestone 0018.

## Purpose

Layer 1 controlled editing allows safe structural edits to prepared JSON documents without turning the huge-document viewer into a general-purpose text editor.

## Editing Model

Layer 1 editing starts with controlled operations such as:

- replacing primitive values;
- renaming object properties;
- adding or removing object properties;
- adding or removing array items.

Each operation produces a validated transaction.

## Not Freeform Text Editing

The first editing model does not support arbitrary text edits, arbitrary range replacement, or multi-cursor editing.

Unsupported operations should fail clearly rather than corrupting the prepared document.

## Revisions

Every edit targets a base revision. If the document changed since the edit command was prepared, the edit must fail or require retry.

## Related Documentation

- `docs/specs/layer1-controlled-editing-transactions.md`
- `docs/decisions/0007-layer1-controlled-structural-edits-before-freeform-text-editing.md`
