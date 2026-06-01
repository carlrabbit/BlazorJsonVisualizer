# Decisions

## Purpose

This index tracks decision records and rationale for significant choices made in BlazorJsonVisualizer.

Decision records document why a particular approach was chosen over alternatives, when the choice was made, and what constraints or trade-offs were considered.

## What belongs here

- technology selection rationale
- architectural trade-off documentation
- rejected alternatives with reasoning
- decisions that future contributors need to understand before changing the system

## What does not belong here

- behavioral specs (use `docs/SPECS.md`)
- structural design (use `docs/ARCHITECTURE.md`)
- engineering commands, validation, and implementation constraints (use `docs/ENGINEERING.md`)

## Available Documents

| Document | Purpose |
|---|---|
| `decisions/0005-token-based-visual-identity.md` | Accepts semantic JSON design tokens as the public visual identity contract and defines the first dark-only visual identity playground direction. |
| `decisions/0006-user-owned-ef-core-dbcontext-for-prepared-document-storage.md` | Accepts user-owned DbContext integration through a DbSet contract and model-builder extension for EF Core prepared-document storage. |

## Authority

This document is authoritative for:

- the index of decision records under `docs/decisions/`
- what counts as a decision record

## Document Contract

When this index changes, review:

- `README.md`
- `AGENTS.md`
- `docs/ARCHITECTURE.md`
