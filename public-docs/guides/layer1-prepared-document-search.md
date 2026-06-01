# Layer 1 Prepared Document Search

## Status

Preview documentation for Milestone 0017.

## Purpose

Prepared-document search lets users search huge JSON documents through prepared indexes or search services instead of scanning only visible rows.

## Workflow

```text
open prepared document
  -> enter search text
  -> run bounded search
  -> inspect result page
  -> continue to next page when available
  -> reveal result in the viewer
```

## Search Scope

The first implementation may support only literal all-text search.

Property-name, string-value, regex, fuzzy, ranking, schema-aware, and cross-document search remain planned unless implemented and documented.

## Index States

Search may be unavailable or degraded when the search index is missing, building, stale, failed, or unsupported.

The viewer should display the index state instead of pretending search results are complete or current.

## Result Reveal

Revealing a result scrolls or loads the row window containing the result. If structural metadata is available, folded ancestors may be expanded.

If the result belongs to an older revision, reveal may fail or warn.

## Related Documentation

- `docs/specs/prepared-document-viewer-search-workflow.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `public-docs/guides/open-prepared-document.md`
