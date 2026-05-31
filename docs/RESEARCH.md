# Research

## Purpose

Research documents preserve exploratory thinking.

Research is non-authoritative unless promoted into:

- terminology;
- architecture;
- decisions;
- specs;
- engineering;
- workflows;
- public documentation.

Research documents may explain rationale, compare options, preserve discarded alternatives, and prepare future milestone/specification work.

## Authority

This document is authoritative for:

- indexing research documents under `docs/research/`;
- identifying current and superseded research baselines;
- describing how research is promoted into authoritative repository documents.

This document is not authoritative for:

- product behavior;
- implementation details;
- architecture decisions;
- public documentation content;
- engineering command contracts.

## Rules

- Research is non-authoritative by default.
- Stable conclusions must be promoted into the appropriate authoritative document type.
- Research documents must not replace specs, architecture documents, decisions, engineering documents, milestones, workflows, or public documentation.
- Research documents should use canonical terminology where practical.
- Superseded research may remain indexed when it preserves useful rationale.
- Do not create `docs/research/README.md`.

## Available Research

| Research Document | Status | Purpose |
|---|---|---|
| `research/engineering-guide-v5.md` | Current baseline | Concrete .NET/Bun/Biome/Blazor engineering profile, command contract, samples, public documentation validation, package smoke testing, public API validation, and release readiness. |
| `research/visual-identity-direction.md` | Promoted | Exploratory visual identity direction for Layer 1, Layer 2, and Layer 3, including token strategy and visual identity playground proposal. Stable conclusions promoted into `docs/specs/visual-identity.md`, `docs/specs/theme-token-format.md`, `docs/specs/visual-identity-playground.md`, and `docs/decisions/0005-token-based-visual-identity.md`. |

## Superseded Research

| Research Document | Superseded By | Notes |
|---|---|---|
| `research/project-setup-guide-v5.md` | `research/project-setup-guide-v6.md` | Keep only if historical V5 rationale is still useful. |
| `research/engineering-guide-v4.md` | `research/engineering-guide-v5.md` | Keep only if historical V4 rationale is still useful. |

## Promotion Path

When research produces stable conclusions, promote them into the appropriate authoritative documents.

| Research Topic | Promote Stable Conclusions To |
|---|---|
| Terminology | `docs/TERMINOLOGY.md` |
| Architecture structure | `docs/architecture/*.md` and `docs/ARCHITECTURE.md` |
| Rationale/choice | `docs/decisions/*.md` and `docs/DECISIONS.md` |
| Behavioral rules/invariants | `docs/specs/*.md` and `docs/SPECS.md` |
| Implementation sequencing | `docs/milestones/*.md` and `docs/MILESTONES.md` |
| Implementation constraints | `docs/ENGINEERING.md` and `docs/engineering/*.md` |
| Command/tooling behavior | `docs/engineering/*.md` and `docs/ENGINEERING.md` |
| Public user-facing usage | `public-docs/` and `docs/PUBLIC-DOCS.md` |
| Workflow intent | `docs/workflows/*.md` and `docs/WORKFLOWS.md` |

## Document Contract

### Related Documents

- `docs/TERMINOLOGY.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/SPECS.md`
- `docs/MILESTONES.md`
- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`

### Must Be Updated Together

When a research document is added, removed, or superseded, review and update:

- this index;
- any affected authoritative documents if research conclusions are promoted;
- related milestone issues if the research changes planned implementation work;
- public documentation if the research affects user-facing behavior, samples, package usage, or release readiness.
