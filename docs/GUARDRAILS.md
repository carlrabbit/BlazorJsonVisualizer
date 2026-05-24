# Guardrails

## Purpose

Guardrails are project-wide constraints that all contributors and AI agents must follow.

Guardrails differ from specs (which define what the system does) and engineering docs (which define how to build it). Guardrails define the boundaries agents and contributors must not cross during implementation.

## What belongs here

- testing policy and test classification rules
- implementation scope and quality constraints
- language-specific constraints (TypeScript, .NET)
- agent behavior constraints

## What does not belong here

- product behavioral specs (use `docs/SPECS.md`)
- command contracts and build tooling (use `docs/ENGINEERING.md`)
- architecture descriptions (use `docs/ARCHITECTURE.md`)

## Available Documents

| Document | Purpose |
|---|---|
| `docs/guardrails/testing.md` | Testing policy: fast vs. long-running test classification, agent test execution rules. |
| `docs/guardrails/implementation.md` | Implementation constraints: scope, readability, public API documentation, validation, and documentation synchronization. |
| `docs/guardrails/languages/dotnet.md` | .NET-specific guardrails: style, analyzer usage, formatting, and project conventions. |
| `docs/guardrails/languages/typescript.md` | TypeScript-specific guardrails: strict options, Bun/Biome usage, module conventions. |

## Authority

This document is authoritative for:
- the index of guardrail documents under `docs/guardrails/`
- the definition of what counts as a guardrail

This document is not authoritative for:
- product behavior (use specs)
- engineering commands (use engineering docs)

## Document Contract

When this index changes, review:
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ENGINEERING.md`
- `docs/TESTING.md`
