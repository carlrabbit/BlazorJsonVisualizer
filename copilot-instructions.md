# Copilot Instructions

## Required reading

- `README.md`
- `AGENTS.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/SPECS.md`

When public behavior, package contents, samples, diagnostics, public API, website content, or release behavior changes, also read:

- `docs/PUBLIC-DOCS.md`
- relevant files in `public-docs/`

When runtime/browser/component boundaries or rationale change, also read:

- `docs/ARCHITECTURE.md`
- relevant files in `docs/architecture/`
- `docs/DECISIONS.md`

## Documentation authority

- Repository-local documents are the source of truth for architecture and behavior.
- Specs are authoritative for behavior.
- Engineering docs define command contracts, validation tiers, tooling setup, and implementation constraints.
- Public docs rules are governed by `docs/PUBLIC-DOCS.md`.
- Terminology must be updated when new durable terms are introduced.

## Repository conventions

- Do not add folder `README.md` files under `docs/`.
- Do not add `README.md` files under `public-docs/`.
- Use all-caps index documents in `docs/` for folder indexes.
- Keep documentation concise, precise, and cross-referenced.
- Prefer fast deterministic validation during normal implementation work.
- Use canonical `eng/` scripts for all build, test, and validation operations.
- Use Bun, not npm. Use Biome, not ESLint or Prettier.
- Do not run long-running tests unless explicitly requested.
- Run the smallest relevant validation tier for the change.
- Treat `./eng/check.sh` as Tier 2 and run it before completion when practical.
- Release validation commands are explicit-only: `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, `./eng/public-api.sh`, and publish commands.
