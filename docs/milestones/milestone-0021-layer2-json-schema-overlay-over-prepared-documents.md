# Milestone 0021 — Layer 2 JSON Schema overlay over prepared documents

## Status

Implemented / synchronized.

## Task Mode

Completed focus-area implementation milestone with public documentation synchronization.

This milestone started Layer 2 on top of the prepared-document Layer 1 substrate. It was not a release, package-publication, public API baseline, or broad repository methodology task.

## Repository Maturity

BlazorJsonVisualizer remains in **Exploration / Active Design** mode.

The repository is behavior-rich and spec-led. Public documentation is preview/planned. Release readiness, package smoke validation, public API baseline validation, and versioned release notes remain explicit-only future work.

## Goal

Implement a read-only Layer 2 JSON Schema overlay for prepared-document sessions.

The implemented workflow lets a prepared-document Layer 1 session attach schema metadata, resolve schema information for structural JSON locations, surface hover/details information, show row-level schema decorations, and report schema validation diagnostics without making Layer 2 the canonical document model.

## Current Authority Documents

Implementation, maintenance, and follow-up documentation agents should use these documents as current authority for this milestone area:

- `AGENTS.md`
- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/engineering/browser-runtime-workspace.md`
- `docs/SPECS.md`
- `docs/specs/schema-overlay-model.md`
- `docs/specs/prepared-document-runtime-protocol.md`
- `docs/specs/prepared-document-runtime-bridge.md`
- `docs/specs/range-backed-layer1-viewer.md`
- `docs/specs/layer1-viewer-diagnostics.md`
- `docs/ARCHITECTURE.md`
- `docs/architecture/schema-overlay-boundary.md`
- `docs/architecture/prepared-document-runtime-boundary.md`
- `docs/PUBLIC-DOCS.md`
- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/layer2-json-schema-overlay.md`
- `public-docs/diagnostics.md`
- `public-docs/diagnostics/schema-overlay-diagnostics.md`

Do not use `docs/research/` as operational authority for this milestone.

Do not require TBPs, issue templates, release documents, or the full documentation set for follow-up work in this area.

## Implemented Scope

The completed milestone covers the read-only schema overlay surface described by `docs/specs/schema-overlay-model.md`:

- schema attachment and detachment for prepared-document sessions;
- schema overlay DTOs and explicit runtime operations;
- JSON Pointer, node, and visible-row schema metadata resolution where required Layer 1 metadata exists;
- bounded schema details payloads;
- bounded schema row decorations;
- bounded schema diagnostics with revision identity;
- clear diagnostics for invalid schemas, unsupported drafts, unsupported keywords, unsupported references, missing/stale indexes, missing path metadata, and revision mismatch;
- sample-facing public preview documentation.

## Preserved Boundaries

Layer 2 remains an overlay.

Layer 2 must not own:

- source text;
- source chunks;
- prepared-document storage;
- transaction logs;
- Layer 1 viewport mechanics;
- Layer 1 folding state;
- Layer 1 search state;
- Layer 1 controlled edit transactions;
- edited export behavior.

A prepared document without a schema overlay must remain viewable, searchable, foldable, editable through supported Layer 1 controlled transactions, and exportable according to the Layer 1 specs.

## Non-Goals That Remain Deferred

This milestone did not implement:

- schema-aware editing;
- automatic schema inference;
- Layer 3 projection/plugin integration;
- arbitrary remote `$ref` fetching;
- complete JSON Schema Draft 2020-12 conformance;
- schema-driven form rendering;
- invalid JSON viewing or best-effort validation of invalid imports;
- storage-provider-specific schema persistence;
- compaction or storage lifecycle changes;
- release validation, package smoke validation, or public API baseline validation.

## Direct Documentation Impact

Resolved in this synchronization pass.

The following documentation surfaces are synchronized for the implemented read-only Layer 2 schema overlay behavior:

- `docs/specs/schema-overlay-model.md`
- `docs/architecture/schema-overlay-boundary.md`
- `docs/MILESTONES.md`
- `docs/ARCHITECTURE.md`
- `docs/PUBLIC-DOCS.md`
- `README.md`
- `public-docs/concepts.md`
- `public-docs/guides/huge-json-documents.md`
- `public-docs/guides/layer2-json-schema-overlay.md`
- `public-docs/diagnostics.md`
- `public-docs/diagnostics/schema-overlay-diagnostics.md`

## Deferred Documentation Synchronization

No milestone-specific public documentation synchronization remains deferred.

Future release-readiness, package smoke, public API baseline, finalized package README, and versioned release notes remain outside this milestone and must only be performed by an explicit release/public-package task.

## Validation Guidance

Documentation-only synchronization should use documentation-safe validation when practical:

```sh
./eng/public-docs.sh
./eng/format.sh --verify
```

A broader Tier 2 check remains available before merging when practical:

```sh
./eng/check.sh
```

Release/public-package validation remains explicit-only:

```sh
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

## Agent Routing

Implementation maintenance agent:

- keep behavior aligned with `docs/specs/schema-overlay-model.md`;
- preserve the boundaries in `docs/architecture/schema-overlay-boundary.md`;
- add only short-running tests unless explicitly requested otherwise;
- run the smallest relevant validation tier.

Documentation synchronization agent:

- keep README, public docs, diagnostics docs, and indexes aligned when schema overlay behavior changes;
- keep preview wording honest;
- do not expand release readiness unless explicitly requested.

Release/public-package agent:

- handle package smoke tests, public API baselines, finalized package README content, versioned release notes, and release checks only when a release task is explicitly opened.
