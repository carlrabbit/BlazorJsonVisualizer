# Public Documentation Engineering

## Purpose

Define the engineering-side validation contract for public documentation.

Public documentation is currently **Preview**. Validation checks structure and consistency; it does not imply release readiness.

## Commands

- `./eng/public-docs.sh` validates required `public-docs/` files and README placement rules.

## Rules

- Public documentation validation must be fast and deterministic.
- Public documentation validation must not require secrets.
- Public documentation validation must not publish artifacts.
- `./eng/public-docs.sh` may run during normal development when public docs change.
- Installation, package, versioning, and release docs may remain planned until public package maturity changes.

## Authority

This document is authoritative for:

- engineering execution rules for public documentation validation

## Document Contract

When this document changes, review:

- `docs/ENGINEERING.md`
- `docs/PUBLIC-DOCS.md`
- `docs/workflows/public-docs.md`
- `eng/public-docs.sh`
