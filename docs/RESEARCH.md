# Research

## Purpose

Research documents preserve exploratory thinking, prior guide versions, and rationale that may influence future repository standards.

Research is non-authoritative unless promoted into one of the authoritative documentation areas:

- terminology
- architecture
- decisions
- specs
- milestones
- TBPs
- guardrails
- engineering
- public documentation
- workflows

## Authority

This document is authoritative for:

- the purpose of `docs/research/`
- the list of research documents currently tracked by the repository
- the rule that research documents are non-authoritative by default

This document is not authoritative for:

- repository governance rules
- engineering command contracts
- public documentation rules
- implementation guardrails
- product behavior

## Available Research

| Research Document | Purpose |
|---|---|
| `docs/research/project-setup-guide-v5.md` | Research copy of Project Setup Guide V5, used as the source rationale for upgrading the repository governance and public documentation model. |
| `docs/research/engineering-guide-v4.md` | Research copy of Engineering Guide V4, used as the source rationale for upgrading engineering command contracts, public documentation validation, and release readiness. |

## Promotion Rule

Rules from research documents become authoritative only when extracted into the relevant authoritative document.

Examples:

- repository governance rules belong in `docs/TERMINOLOGY.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/SPECS.md`, `docs/MILESTONES.md`, `docs/TBPS.md`, `docs/WORKFLOWS.md`, `docs/GUARDRAILS.md`, or `docs/ENGINEERING.md`;
- public documentation rules belong in `docs/PUBLIC-DOCS.md`, public documentation TBPs, public documentation guardrails, and `public-docs/`;
- command contracts belong in `docs/ENGINEERING.md` and `docs/engineering/command-contract.md`;
- testing policy belongs in `docs/GUARDRAILS.md`, `docs/guardrails/testing.md`, and workflow specs;
- release readiness policy belongs in `docs/engineering/release-readiness.md`, `docs/workflows/release-check.md`, and canonical `eng/` scripts;
- rationale belongs in `docs/decisions/` when it becomes durable project rationale.

## Document Contract

When this index changes, review:

- `docs/research/`
- `docs/ENGINEERING.md`
- `docs/GUARDRAILS.md`
- `docs/PUBLIC-DOCS.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
