# Agent Instructions

## Required reading before implementation

Always read:

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/ENGINEERING.md`
- `docs/SPECS.md`
- the relevant milestone issue or task text
- any specs referenced by the milestone issue or task text

Read conditionally:

- `docs/PUBLIC-DOCS.md` and relevant files under `public-docs/` when work changes public behavior, package contents, samples, diagnostics, public API, website content, or release behavior.
- `docs/ARCHITECTURE.md`, relevant files under `docs/architecture/`, and `docs/DECISIONS.md` when work changes runtime/browser/component boundaries or decision rationale.

## Work rules

- Do not infer architecture from code alone when a spec exists.
- Update specs when behavior changes.
- Update terminology when introducing new durable terms.
- Do not add folder `README.md` files below `docs/`.
- Use all-caps index documents in `docs/` for documentation folders.
- Keep TypeScript architecture boring: explicit interfaces, concrete DTOs, discriminated unions, straightforward modules.
- Do not introduce heavy frontend frameworks unless a milestone explicitly asks for them.
- Do not invent repository commands; use `eng/` scripts only.
- Use Bun, not npm for TypeScript tooling.
- Use Biome, not ESLint or Prettier.
- Keep public documentation synchronized with README and relevant `public-docs/` surfaces when public-facing behavior changes.

## Engineering rules

- Use canonical `eng/` scripts for all build, test, and validation operations.
- Run the smallest relevant validation tier for the change.
- Treat `./eng/check.sh` as Tier 2 validation and the default completion gate; run it before declaring work complete when practical.
- Do not embed repository command logic in CI workflows; call `eng/` scripts instead.
- `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, `./eng/public-api.sh`, and publish commands are explicit-only release/public API workflows.
- See `docs/ENGINEERING.md` and `docs/engineering/command-contract.md` for the full command list and validation tiers.

## Validation-tier routing

- Tier 0 — targeted checks for the changed surface, such as docs validation, frontend checks, sample checks, or a focused test invocation through an `eng/` script.
- Tier 1 — short-running implementation validation with `./eng/test.sh` or another documented focused `eng/` command.
- Tier 2 — default completion validation with `./eng/check.sh`.
- Explicit-only — long-running, package smoke, public API, release readiness, and publish workflows; run only when requested or when the task is explicitly release/public-API work.

## Testing rules

- Agents may create and run short-running tests.
- Agents must not create or run long-running tests unless explicitly requested.
- Run the smallest relevant validation set.
- See `docs/engineering/command-contract.md` and `docs/TESTING.md` for test classification rules.
