# Milestone 0014 — Data Ingestion Adapters, Diagnostics, and Import Job Lifecycle

## Status

Implemented / documentation synchronized.

## Goal

Implement the public-facing data ingestion layer around the prepared-document system.

Milestones 0012 and 0013 define the prepared-document lifecycle, the prepared-document store, and the department-scale storage engine. This milestone defines and implements how application users provide raw JSON sources, start and observe imports, receive diagnostics, cancel preparation, handle failed imports, and obtain a prepared document that can be opened later.

## Repository Mode and Task Mode

Repository maturity mode: **Exploration / Active Design**.

Task mode: **Implemented milestone documentation record**.

This milestone used strong specs and focused validation, but did not introduce release-readiness requirements. Package smoke tests, public API baselines, release checks, long-running validation, and publish workflows remain explicit-only unless a later task requests them.

## Authority Documents

The implemented behavior is governed by these specs:

- `docs/specs/data-ingestion.md`
- `docs/specs/ingestion-sources.md`
- `docs/specs/import-jobs.md`
- `docs/specs/import-diagnostics.md`
- `docs/specs/encoding-and-offsets.md`
- `docs/specs/document-import.md`
- `docs/specs/prepared-document-store.md`

Public documentation surfaces affected by this milestone:

- `public-docs/guides/import-huge-json.md`
- `public-docs/diagnostics/import-diagnostics.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/diagnostics.md`

Research notes are non-authoritative.

## Implemented Scope

This milestone implemented the ingestion orchestration layer around prepared documents:

- source-adapter abstractions for raw JSON input;
- default stream and file-path ingestion source adapters;
- import job lifecycle, status, progress, cancellation, and final result semantics;
- import diagnostics with stable public codes;
- UTF-8-first encoding and byte-offset policy;
- integration with prepared-document import and storage behavior;
- failed/cancelled import behavior that does not publish a ready prepared document;
- preview public documentation for importing huge JSON and understanding import diagnostics.

## Non-Goals Preserved

This milestone did not introduce:

- a new prepared-document storage engine;
- cloud object storage provider implementation;
- database-backed ingestion provider;
- distributed background job processing;
- cross-process job scheduling;
- resumable upload protocol;
- browser IndexedDB prepared-document persistence;
- invalid-JSON best-effort viewer mode;
- schema-aware ingestion;
- Layer 2 schema overlay features;
- Layer 3 projection features;
- collaborative multi-user editing;
- public package release;
- release validation;
- issue templates or TBPs.

## Direct Documentation Impact

The direct documentation impact for this milestone is resolved by the synchronized specs and public docs listed above.

If behavior or diagnostic codes change later, update the affected spec and public diagnostics/reference docs in the same change.

## Deferred Documentation Synchronization

No broad synchronization remains required for Milestone 0014 after the Milestone 0014/0015 documentation synchronization pass.

Future work that changes public package readiness, release behavior, package docs, or samples must perform its own targeted documentation synchronization.

## Validation Expectations

Use the validation tiers defined by `docs/engineering/command-contract.md`.

For documentation-only synchronization:

- run `./eng/public-docs.sh` when practical;
- run `./eng/check.sh` when practical before declaring a combined implementation/documentation change complete;
- do not require release, package smoke, public API, or long-running validation for this milestone.

## Completion Criteria

This milestone is complete when:

- ingestion sources are available behind the source abstraction;
- import jobs expose status, progress, cancellation, completion, and result behavior;
- import diagnostics use documented stable codes;
- encoding and offset semantics are implemented and tested;
- successful import produces a prepared document reference;
- failed and cancelled imports do not publish ready prepared documents;
- public preview docs describe the workflow without implying release readiness;
- required short-running tests pass;
- default validation is run according to the repository validation tier rules.
