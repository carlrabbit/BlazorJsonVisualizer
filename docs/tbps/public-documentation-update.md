# Public Documentation Update

## Goal

Apply consistent updates to public-facing documentation surfaces while keeping internal authority documents synchronized.

## Constraints

- Public documentation must stay consumer-facing.
- Public documentation updates must follow `docs/PUBLIC-DOCS.md` synchronization rules.
- Do not add non-root `README.md` files.

## Non-goals

- Defining product behavior beyond existing specs.
- Replacing internal engineering or spec documents with public docs.
- Publishing artifacts as part of documentation-only updates.

## Required Reading

- `README.md`
- `docs/PUBLIC-DOCS.md`
- `docs/TERMINOLOGY.md`
- `docs/GUARDRAILS.md`
- `docs/ENGINEERING.md`
- relevant files under `public-docs/`

## Process

1. Identify impacted public documentation surfaces.
2. Update `public-docs/` source documents and README user-facing sections as needed.
3. Keep package, API, diagnostics, samples, versioning, and release-note docs aligned when relevant.
4. Verify no `public-docs/**/README.md` files were introduced.
5. Cross-check references to authoritative internal docs.

## Validation

- Run `./eng/public-docs.sh`.
- Run additional relevant checks when code or samples changed (for example `./eng/samples.sh`, `./eng/check.sh`).

## Authority

This TBP is authoritative for:

- the repeatable process for public documentation updates
- validation expectations for public documentation changes

## Document Contract

When this TBP changes, review:

- `docs/TBPS.md`
- `docs/PUBLIC-DOCS.md`
- `docs/ENGINEERING.md`
- `docs/workflows/public-docs.md`
- `public-docs/`
