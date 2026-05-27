# Agent Instructions

## Required reading before implementation

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/GUARDRAILS.md`
- `docs/ENGINEERING.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- The relevant milestone issue.
- Any specs referenced by the milestone issue.

When work changes public behavior, package contents, samples, diagnostics, public API, website content, or release behavior, also read:

- `docs/PUBLIC-DOCS.md`
- relevant files under `public-docs/`

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
- `./eng/check.sh` is the default completion gate; run it before declaring work complete when practical.
- Do not embed repository command logic in CI workflows; call `eng/` scripts instead.
- `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, and publish commands are explicit-only workflows.
- `./eng/public-api.sh` is explicit for release/public API work.
- See `docs/ENGINEERING.md` and `docs/engineering/command-contract.md` for the full command list.

## Testing rules

- Agents may create and run short-running tests.
- Agents must not create or run long-running tests unless explicitly requested.
- Run the smallest relevant validation set.
- See `docs/guardrails/testing.md` for full classification rules.
