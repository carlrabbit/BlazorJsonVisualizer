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
- workflows

## Authority

This document is authoritative for:

- the purpose of `docs/research/`
- the list of research documents currently tracked by the repository
- the rule that research documents are non-authoritative by default

This document is not authoritative for:

- repository governance rules
- engineering command contracts
- implementation guardrails
- product behavior

## Available Research

| Research Document | Purpose |
|---|---|
| `docs/research/project-setup-guide-v4.md` | Research copy of Project Setup Guide V4, used as the source rationale for upgrading the repository governance model. |
| `docs/research/engineering-guide-v3.md` | Research copy of Engineering Guide V3, used as the source rationale for upgrading the engineering command and tooling model. |

## Promotion Rule

Rules from research documents become authoritative only when extracted into the relevant authoritative document.

Examples:

- repository governance rules belong in `docs/TERMINOLOGY.md`, `docs/ARCHITECTURE.md`, `docs/SPECS.md`, `docs/MILESTONES.md`, `docs/TBPS.md`, `docs/WORKFLOWS.md`, `docs/GUARDRAILS.md`, or `docs/ENGINEERING.md`;
- command contracts belong in `docs/ENGINEERING.md` and `docs/engineering/command-contract.md`;
- testing policy belongs in `docs/GUARDRAILS.md`, `docs/guardrails/testing.md`, and workflow specs;
- rationale belongs in `docs/decisions/` when it becomes durable project rationale.

## Document Contract

When this index changes, review:

- `docs/research/`
- `docs/ENGINEERING.md`
- `docs/GUARDRAILS.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
