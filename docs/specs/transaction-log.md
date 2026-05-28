# Transaction Log Specification

## Goal

Define durable change tracking for prepared documents.

## Scope

This specification covers transaction log purpose, revision relationship, append-only behavior, and compaction boundary.

## Transaction Log Role

The transaction log records edits applied to a prepared document after import or the latest compaction point.

## Initial Contract

The first implementation includes durable transaction-log storage initialized at import.

Initial state:

- zero transactions;
- latest revision `1`;
- append-only shape reserved for later editing milestones.

## Append Behavior

Transactions append in revision order.

A transaction must not silently apply to the wrong base revision.

## Compaction

Compaction is out of scope for the first implementation.

## Authority

This document is authoritative for:

- durable transaction log purpose;
- revision relationship;
- basic transaction metadata boundary.

## Document Contract

When this spec changes, review:

- `docs/specs/prepared-document.md`
- `docs/specs/document-export.md`
- `docs/specs/document-session.md`
- `docs/specs/runtime-protocol.md`
