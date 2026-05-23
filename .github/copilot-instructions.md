# Copilot Instructions

## Required reading

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/GUARDRAILS.md`
- `docs/ENGINEERING.md`
- `docs/TBPS.md`
- `docs/SPECS.md`

## Documentation authority

- Repository-local documents are the source of truth for architecture and behavior.
- Specs are authoritative for behavior.
- TBPs define repeatable implementation and maintenance work.
- Guardrails define project-wide constraints.
- Engineering docs define command contracts and tooling setup.
- Terminology must be updated when new durable terms are introduced.

## Repository conventions

- Do not add folder `README.md` files under `docs/`.
- Use all-caps index documents in `docs/` for folder indexes.
- Keep documentation concise, precise, and cross-referenced.
- Prefer fast deterministic validation during normal implementation work.
- Use canonical `eng/` scripts for all build, test, and validation operations.
- Use Bun, not npm. Use Biome, not ESLint or Prettier.
- Do not run long-running tests unless explicitly requested.
- Run `./eng/check.sh` before completion when practical.
