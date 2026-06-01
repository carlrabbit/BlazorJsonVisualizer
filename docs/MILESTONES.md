# Milestones

## Purpose

This index tracks controlled implementation phases for BlazorJsonVisualizer.

Milestones define sequencing: what is in scope, what is out of scope, what must be done first, and what exit criteria must be met before moving forward.

## What belongs here

- milestone documents under `docs/milestones/`
- the milestone sequencing model
- pointers to authoritative specs when milestone behavior is already specified

## What does not belong here

- feature behavioral specs (use `docs/SPECS.md`)
- implementation procedures or process-heavy task scripts
- architecture documents (use `docs/ARCHITECTURE.md`)

## Available Documents

| Document | Status | Purpose |
|---|---|---|
| `milestones/milestone-0010-visual-identity-system-and-theme-playground.md` | Active | Creates the first dark-only token-based visual identity system and Blazor theme playground. |
| `milestones/milestone-0012-prepared-document-import-storage-indexing-export.md` | Active | Defines and implements the prepared-document import, storage, indexing, and export lifecycle for huge JSON workflows. |
| `milestones/milestone-0013-department-scale-prepared-document-storage-engine.md` | Active | Implements the department-scale prepared document storage engine, default file-backed provider, indexes, search, export, and concurrency behavior. |
| `milestones/milestone-0014-data-ingestion-adapters-diagnostics-import-job-lifecycle.md` | Implemented / synchronized | Implements ingestion sources, import jobs, progress, cancellation, diagnostics, and encoding policy for huge JSON import. |
| `milestones/milestone-0015-prepared-document-runtime-bridge-range-backed-layer1-viewer.md` | Planned | Implements the prepared-document runtime bridge and range-backed Layer 1 viewer path. |

## Spec Alignment

When a spec exists, milestone documents should point to that spec instead of duplicating normative behavior. Milestones may keep scope, sequencing, and exit criteria, but product behavior belongs in `docs/SPECS.md` and `docs/specs/`.

## Authority

This document is authoritative for:

- the index of milestone documents under `docs/milestones/`;
- the milestone sequencing model.

## Document Contract

When this index changes, review:

- `README.md`
- `AGENTS.md`
- `docs/SPECS.md`
- `docs/ENGINEERING.md`
