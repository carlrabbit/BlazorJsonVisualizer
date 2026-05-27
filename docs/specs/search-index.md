# Search Index Specification

## Goal

Define the first search index contract for prepared JSON documents.

## Scope

This specification covers search index ownership, minimum indexed content, rebuildability, query behavior, and update relationship to transactions.

## Search Index Role

Search indexes are derived artifacts of a prepared document and are rebuildable.

## Initial Indexed Content

The first implementation may use placeholder files and state tracking.

Expected ready-state behavior in later iterations includes at least property-name and string-literal search.

## Query Contract

Search must not be limited to visible viewport rows.

If the index is missing or stale, behavior must be explicit.

## Index State

```text
missing
building
ready
stale
failed
```

## Authority

This document is authoritative for:

- search index ownership;
- minimum search behavior expectations;
- search index state semantics.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document.md`
- `docs/specs/structural-index.md`
- `docs/specs/path-navigation.md`
- `public-docs/concepts.md`
