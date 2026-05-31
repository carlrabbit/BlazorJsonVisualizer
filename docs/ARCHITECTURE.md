# Architecture

## Purpose

This index tracks structural system design documents for BlazorJsonVisualizer.

Architecture documents describe how the system is structured: subsystems, layers, boundaries, interfaces, and data flows.

## What belongs here

- layer and subsystem descriptions
- component and interface diagrams or descriptions
- cross-cutting structural patterns
- integration boundaries between TypeScript runtime, Blazor host, and .NET library

## What does not belong here

- feature behavioral specs (use `docs/SPECS.md`)
- rationale and trade-offs for specific choices (use `docs/DECISIONS.md`)
- build and tooling setup (use `docs/ENGINEERING.md`)
- implementation guardrails (use `docs/GUARDRAILS.md`)

## Available Documents

| Document | Purpose |
|---|---|
| *(none yet)* | Architecture documents will be added here as the system matures. |

## Authority

This document is authoritative for:
- the index of architecture documents under `docs/architecture/`
- what counts as an architecture document

This document is not authoritative for:
- product behavior (use specs)
- engineering commands (use engineering docs)

## Document Contract

When this index changes, review:
- `README.md`
- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/SPECS.md`

## Prepared document storage engine

Department-scale prepared document storage is owned by the .NET side. The application-facing store coordinates streaming import, source chunk storage, manifests, derived indexes, transaction logs, search, export, and delete behavior. The storage-provider abstraction uses containers, storage objects, temporary object writers, range reads, and leases so the default file-backed provider can later be replaced without making the file layout public.
