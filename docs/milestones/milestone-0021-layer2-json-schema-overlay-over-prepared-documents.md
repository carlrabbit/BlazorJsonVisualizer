# Milestone 0021 — Layer 2 JSON Schema overlay over prepared documents

## Status

Planned / implementation-ready.

## Task Mode

Focused implementation milestone with directly affected authority updates.

This milestone starts Layer 2 on top of the prepared-document Layer 1 substrate. It is not a release, package-publication, public API baseline, or broad documentation synchronization task.

## Repository Maturity

BlazorJsonVisualizer remains in **Exploration / Active Design** mode.

The repository is behavior-rich and spec-led. Public documentation is preview/planned. Release readiness, package smoke validation, public API baseline validation, and versioned release notes remain explicit-only future work.

## Goal

Implement a read-only Layer 2 JSON Schema overlay for prepared-document sessions.

The implementation must let a prepared-document Layer 1 session attach schema metadata, resolve schema information for structural JSON locations, surface hover/details information, show row-level schema decorations, and report schema validation diagnostics without making Layer 2 the canonical document model.

## Canonical Scope Statement

Layer 2 consumes prepared-document Layer 1 session state, structural node identity, JSON Pointer/path metadata, revision identity, diagnostics infrastructure, and bounded runtime protocol operations.

Layer 2 produces schema overlays, schema metadata payloads, row decorations, hover/details content, schema-aware diagnostics, and future command suggestion metadata.

Layer 2 must not own source text, source chunks, transaction logs, storage providers, viewport mechanics, or raw mutation behavior.

## Target Implementation Areas

The TypeScript/browser runtime target is:

```text
src/BlazorJsonVisualizer.Runtime/
```

This is the canonical Bun/TypeScript browser runtime workspace. It is not a .NET project.

Implementation may also touch the Blazor host, .NET runtime bridge, samples, and tests where required by the focus areas below.

## Required Authority Documents

Implementation agents must read only this list before starting this milestone, unless they discover a direct contradiction that requires escalation:

- `README.md`
- `AGENTS.md`
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

Do not use `docs/research/` as operational authority for this milestone.

Do not require TBPs, issue templates, release documents, or the full documentation set to implement this milestone.

## Non-Goals

This milestone must not implement:

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

## Focus Areas

### Focus Area 1 — Schema overlay model and protocol DTOs

Implement the DTOs and internal TypeScript model required by `docs/specs/schema-overlay-model.md`.

Minimum implementation outcomes:

- schema attachment DTOs exist for prepared-document sessions;
- schema metadata DTOs exist for JSON nodes and rows;
- validation diagnostic DTOs distinguish schema diagnostics from Layer 1 diagnostics;
- all schema overlay data includes session, prepared document, and revision identity where required by the spec;
- DTOs live in the browser runtime workspace with the same boring TypeScript style as existing runtime protocol types.

The implementation must use explicit interfaces, concrete DTOs, discriminated unions where useful, and straightforward modules. Do not introduce a framework, Redux-like state container, decorator system, or advanced type-level architecture.

### Focus Area 2 — Schema association for prepared-document sessions

Implement explicit schema association for an already-open prepared-document session.

Minimum implementation outcomes:

- a caller can attach a JSON Schema document to a prepared-document session;
- a caller can detach the active schema overlay;
- attaching a schema does not alter the prepared document revision;
- attaching an invalid or unsupported schema returns structured diagnostics instead of corrupting runtime state;
- the active schema overlay state is browser/session state unless a later milestone adds durable schema association.

Supported schema sources for this milestone:

- inline schema object supplied by the host/runtime call;
- named/local schema identifier supplied by the caller.

Explicitly unsupported schema sources must fail clearly.

### Focus Area 3 — Node-to-schema resolution

Implement schema metadata resolution for prepared-document structural locations.

Minimum implementation outcomes:

- resolve schema metadata by JSON Pointer when path metadata is available;
- resolve schema metadata by node identifier when node/path mapping is available;
- resolve schema metadata for visible prepared rows without reading the whole document into the browser;
- return bounded metadata payloads;
- report missing path metadata, missing structure metadata, unsupported schema keywords, stale revision, and unknown node/path as structured diagnostics.

The first implementation may resolve metadata on demand for visible rows and selected nodes. It does not need to precompute overlays for every node in a huge document.

### Focus Area 4 — Read-only schema validation diagnostics

Implement bounded validation diagnostics for prepared-document sessions.

Minimum implementation outcomes:

- validation diagnostics are associated with a session, prepared document, and revision;
- diagnostics use JSON Pointer/path and node identity when available;
- diagnostics are bounded by request limits;
- diagnostics can report continuation or truncation when a full result set is not returned;
- stale diagnostics are not presented as current after a document revision changes;
- schema diagnostics are separate from Layer 1 parse/viewer/search/edit/export diagnostics.

Validation may be partial and keyword-limited, but unsupported behavior must be visible. It must not silently imply full JSON Schema conformance.

### Focus Area 5 — Runtime bridge and Blazor host integration

Wire the schema overlay through the prepared-document runtime bridge and Blazor host boundary without exposing storage internals.

Minimum implementation outcomes:

- host-facing operations are explicit DTO operations, not internal runtime class exposure;
- `.NET` bridge operations remain bounded and diagnostic-oriented;
- the bridge does not expose file-backed storage layout, EF storage layout, provider-specific object names, or physical paths;
- normal failures return structured result objects with diagnostics;
- infrastructure failures may still throw only for exceptional cases.

The implementation may keep the first bridge implementation simple. It must preserve the store/bridge/host/browser ownership boundaries from the architecture documents.

### Focus Area 6 — Layer 1 viewer overlay UX and sample integration

Surface the schema overlay in the existing prepared-document Layer 1 viewer path.

Minimum implementation outcomes:

- visible rows can show schema decoration markers when metadata or diagnostics exist;
- hover or details UI can display title, description, expected type, enum values, required-property information, default value, and validation messages when available;
- the sample app can open a prepared document, attach a schema, show row decorations, show details for a selected row/node, and display schema diagnostics;
- unsupported or degraded schema overlay states are visible in the sample without corrupting Layer 1 viewport/search/fold state.

Visual polish is not the goal. The result must be clear enough to validate the overlay contract.

### Focus Area 7 — Short-running tests

Add short-running tests for the implemented schema overlay behavior.

Minimum implementation outcomes:

- DTO/protocol shape tests or equivalent compile-time/runtime checks;
- schema attach/detach state tests;
- JSON Pointer-based schema resolution tests over small documents;
- local `$ref` resolution tests if local `$ref` is implemented;
- validation diagnostics tests for supported keywords;
- stale revision behavior tests;
- row decoration or details payload tests for visible-row integration.

Do not add huge-document stress tests, fuzzers, benchmarks, package smoke tests, public API checks, or long-running browser automation as part of this milestone.

## Supported Schema Baseline

Use JSON Schema Draft 2020-12 as the intended baseline, but implement only the milestone subset defined in `docs/specs/schema-overlay-model.md`.

Minimum supported keywords:

- `$id`
- `$schema`
- `$ref` for local same-document references only
- `type`
- `properties`
- `items`
- `required`
- `enum`
- `const`
- `title`
- `description`
- `default`
- `minimum`
- `maximum`
- `minLength`
- `maxLength`
- `minItems`
- `maxItems`

Unsupported keywords must either be ignored as annotation-only when safe or reported as unsupported where they affect validation correctness. The behavior must follow the spec.

## Sequencing Guidance

Recommended order:

1. Implement schema DTOs and runtime-core overlay state.
2. Implement attach/detach and validation of schema input.
3. Implement JSON Pointer schema resolution for small prepared-document paths.
4. Add bounded validation diagnostics for the supported keyword subset.
5. Add row metadata/decorations for visible prepared rows.
6. Add hover/details panel integration.
7. Add sample workflow.
8. Add focused tests and run validation tiers.

Each focus area should be independently reviewable. Do not wait for visual integration before testing schema resolution and diagnostics.

## Acceptance Criteria

The milestone is complete when:

- a prepared-document session can attach and detach one active schema overlay;
- Layer 1 remains usable without a schema overlay;
- Layer 1 viewport, folding, search, controlled edits, and export ownership remain unchanged;
- schema metadata can be resolved for visible prepared rows or selected nodes where path/node mapping is available;
- hover/details payloads show supported schema annotations;
- schema diagnostics are reported as schema diagnostics and are revision-bound;
- stale schema metadata/diagnostics are not presented as current after a revision change;
- unsupported schema features and degraded index/path states fail visibly through diagnostics;
- the sample app demonstrates the read-only schema overlay over a prepared document;
- all new tests are short-running;
- required validation tiers pass or any skipped validation is explicitly documented by the implementation agent.

## Direct Documentation Impact

Direct documentation work for this milestone is limited to implementation authority:

- keep `docs/specs/schema-overlay-model.md` synchronized with implemented behavior;
- update directly affected spec sections if implementation exposes a necessary protocol adjustment;
- update the milestone status and completion notes when the implementation finishes;
- update `docs/TERMINOLOGY.md` only if implementation introduces durable terminology not already covered by the spec.

Do not perform broad public documentation synchronization as part of the implementation unless the implementation directly changes an existing public documentation promise.

## Deferred Documentation Synchronization

A later documentation synchronization pass should decide whether to update:

- `README.md` public documentation preview links or status wording;
- `docs/MILESTONES.md` status from planned to implemented/synchronized;
- `docs/PUBLIC-DOCS.md` public docs coordination;
- `public-docs/concepts.md`;
- `public-docs/guides/huge-json-documents.md`;
- a new `public-docs/guides/layer2-json-schema-overlay.md`;
- `public-docs/diagnostics.md`;
- a new `public-docs/diagnostics/schema-overlay-diagnostics.md`;
- package README or release notes once package maturity changes.

Release-readiness, package-smoke, public API baseline, and versioned release-note synchronization remain explicit-only release/public-package work.

## Validation Guidance

Use the smallest relevant validation tier while implementing, then use Tier 2 as the default completion gate when practical.

Focused validation for TypeScript/runtime work:

```sh
./eng/frontend-check.sh
```

Focused validation for sample work:

```sh
./eng/samples.sh
```

Tier 1 short-running implementation validation:

```sh
./eng/test.sh
```

Tier 2 default completion gate:

```sh
./eng/check.sh
```

If public docs are changed directly, also run:

```sh
./eng/public-docs.sh
```

Do not run these unless explicitly requested by a release/public-package task:

```sh
./eng/long-running-tests.sh [--fast]
./eng/package-smoke.sh <version>
./eng/public-api.sh
./eng/release-check.sh <version>
```

## Agent Routing

Implementation agent:

- implement the focus areas;
- update directly affected authority documents only;
- add short-running tests;
- run the scoped validation tiers.

Documentation synchronization agent:

- update public docs and broad indexes after implementation behavior is stable;
- keep preview wording honest;
- do not expand release readiness unless explicitly requested.

Release/public-package agent:

- handle package smoke tests, public API baselines, versioned release notes, and release checks only when a release task is explicitly opened.

## Completion Update Instructions

When implementation finishes, replace this section with a short completion note and set status appropriately.

The completion note must state:

- which focus areas were implemented;
- which validation commands were run;
- whether public documentation synchronization is complete or deferred;
- any unsupported schema features that remain explicit non-goals.
