# Prepared Document Search Engine

## Goal

Define the first persisted search index and search behavior for prepared documents.

## Scope

This spec covers literal search, case handling, paging by continuation offset, previews, offsets, and revision reporting.

## Initial Behavior

The first implementation supports literal search over all persisted source text. Search may stream source chunks and use the persisted search artifact as readiness metadata. Property-name and string-value scoped search are reserved for the path-aware search engine and must fail clearly until implemented.

## Query Behavior

Search queries include text, case sensitivity, scope, maximum result count, and optional continuation token. Continuation tokens are UTF-8 byte offsets. Results include document id, revision, start/end UTF-8 byte offsets, preview text, and optional JSON Pointer.

## Non-Goals

- fuzzy search
- ranking
- stemming
- query language
- schema-aware search
- cross-document search

## Invariants

- Search indexes are derived artifacts.
- Search results identify document id and revision.
- Search supports result limits and continuation.
- Search must not require rendering rows.
- Search may take a few seconds for large documents.

## Authority

This document is authoritative for first-generation prepared document search behavior.
