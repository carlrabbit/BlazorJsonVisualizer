# Prepared Document Storage Abstraction

## Goal

Define the replaceable storage-provider abstraction used by the prepared document storage engine.

## Scope

This spec defines provider capabilities, object identity, temporary writes, object commit semantics, read/write leases, range reads, listing, deletion, and provider error behavior.

## Non-Goals

This spec does not define the file-backed storage layout, the prepared document public API, distributed locking, cloud storage, or database storage.

## Object Identity

A storage object is identified by:

```text
DocumentId + ObjectName
```

The storage engine treats object names as provider-owned identifiers. Object names use `/` separators in repository contracts, but providers must not expose physical paths as the public API.

## Required Capabilities

A provider must support:

- create, open, list, and delete document containers;
- committed object reads;
- temporary object writes that become visible only after commit;
- single-object atomic commit where practical;
- read leases and write leases;
- object listing;
- native or emulated range reads;
- explicit capability reporting;
- clear failures for unsupported operations.

## Invariants

- The engine uses storage objects, not physical paths, as the abstraction boundary.
- A provider must not expose partially committed objects as ready.
- The manifest coordinates multi-object state transitions.
- The minimum atomic operation is one storage object commit.
- The provider reports capabilities explicitly.
- Process-local reader/writer coordination is sufficient for the first implementation.

## Authority

This document is authoritative for the prepared document storage-provider abstraction.
