# Public Documentation Workflow

## Purpose

Define validation expectations for public documentation updates.

## Command

```sh
./eng/public-docs.sh
```

## Rules

- Public documentation validation must not require secrets.
- Public documentation validation must not publish artifacts by default.
- Public documentation validation should be run when `README.md` user-facing sections or `public-docs/` sources change.

## Authority

This document is authoritative for the public documentation validation workflow.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/PUBLIC-DOCS.md`
- `docs/engineering/public-documentation.md`
- `eng/public-docs.sh`
