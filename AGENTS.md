# Agent Instructions

## Required reading before implementation

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- `docs/TESTING.md`
- The relevant milestone issue.
- Any specs referenced by the milestone issue.

## Work rules

- Do not infer architecture from code alone when a spec exists.
- Update specs when behavior changes.
- Update terminology when introducing new project terms.
- Do not add folder `README.md` files below `docs/`.
- Use all-caps index documents in `docs/` for documentation folders.
- Keep TypeScript architecture boring: explicit interfaces, concrete DTOs, discriminated unions, straightforward modules.
- Do not introduce heavy frontend frameworks unless a milestone explicitly asks for them.

## Testing rules

Agents may create and run fast tests. Agents must not create or run long-running tests unless explicitly requested.
