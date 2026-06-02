# Architecture

## Purpose

This index tracks durable structural system design documents for BlazorJsonVisualizer.

Architecture documentation is intentionally lightweight while the repository is in **Exploration / Active Design** mode. Add or expand architecture docs only when runtime/browser/component boundaries, interfaces, or data flows need durable explanation beyond behavioral specs.

## What belongs here

- layer and subsystem descriptions
- component and interface boundaries
- cross-cutting structural patterns
- integration boundaries between TypeScript runtime, Blazor host, and .NET library

## What does not belong here

- feature behavioral specs (use `docs/SPECS.md`)
- rationale and trade-offs for specific choices (use `docs/DECISIONS.md`)
- build, tooling, validation, and implementation constraints (use `docs/ENGINEERING.md`)

## Available Documents

| Document | Purpose |
|---|---|
| `docs/architecture/runtime-boundaries.md` | Summarizes ownership boundaries between the browser runtime, runtime core, and Blazor host. |
| `docs/architecture/browser-runtime.md` | Describes the TypeScript runtime package split, workspace root, and framework-free core rule. |
| `docs/architecture/blazor-integration.md` | Describes Blazor host responsibilities and non-responsibilities. |
| `docs/architecture/document-model.md` | Describes the structure-first document model and overlay boundaries. |
| `docs/architecture/plugin-model.md` | Describes planned Layer 3 plugin/projection boundaries. |
| `docs/architecture/prepared-document-runtime-boundary.md` | Describes the prepared-document store, runtime bridge, Blazor host, and TypeScript runtime ownership boundary for range-backed Layer 1 viewing. |
| `docs/architecture/ef-core-prepared-document-storage-boundary.md` | Describes the EF Core storage backend boundary, user-owned DbContext ownership, and SQL Server optimization layer. |

## Authority

This document is authoritative for:

- the index of architecture documents under `docs/architecture/`;
- what counts as an architecture document.

This document is not authoritative for:

- product behavior (use specs);
- engineering commands (use engineering docs);
- implementation process or validation tiers (use engineering docs).

## Document Contract

When this index changes, review:

- `README.md`
- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/SPECS.md`
