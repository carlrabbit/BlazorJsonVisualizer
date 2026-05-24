# Implementation Guardrail

## Purpose

This guardrail defines implementation scope, readability, and documentation constraints for BlazorJsonVisualizer.

## Scope Constraints

- Implement only what is specified in the referenced spec or milestone.
- Do not add Layer 2 or Layer 3 features during Layer 1 implementation work.
- Do not add Playwright unless explicitly selected in a milestone.
- Do not add benchmarks unless explicitly selected in a milestone.
- Do not add GitHub Pages unless explicitly selected in a milestone.
- Do not create non-root README files.
- Do not introduce heavy frontend frameworks unless a milestone explicitly asks for them.

## Architecture Constraints

- Do not infer architecture from code alone when a spec exists.
- Blazor is the primary user-facing host and packaging surface; it does not own the TypeScript runtime internals.
- The TypeScript browser runtime is a first-class subsystem.
- Keep TypeScript architecture boring: explicit interfaces, concrete DTOs, discriminated unions, straightforward modules.

## Documentation Constraints

- Update specs when behavior changes.
- Update terminology when introducing new durable project terms.
- Do not add folder README files under `docs/`.
- Use all-caps index documents in `docs/` for folder indexes.
- Keep documentation concise, precise, and cross-referenced.

## Public API Constraints

- Public API changes must be covered by or update the relevant spec.
- Public API documentation must be kept aligned with implementation.

## Validation Constraints

- Run the smallest relevant validation set.
- Do not run long-running tests unless explicitly requested.
- Run `./eng/check.sh` before declaring work complete when practical.
- Use `eng/` scripts instead of duplicating command logic.
- Do not invent repository commands.

## Authority

This document is authoritative for:
- implementation scope constraints
- documentation synchronization rules
- agent behavior constraints during implementation work

## Document Contract

When this document changes, review:
- `docs/GUARDRAILS.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
