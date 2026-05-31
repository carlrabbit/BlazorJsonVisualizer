# Release Readiness

## Purpose

Define future release-oriented validation for BlazorJsonVisualizer without changing the lightweight implementation gate.

## Current Status

Release readiness is **future work**. Public package publication is preview/planned, not active release work.

Scripts may exist as explicit-only placeholders or preflight checks, but normal implementation must not require release checks, package smoke checks, public API checks, or publish workflows until repository maturity changes.

## Model

- `./eng/check.sh` is Tier 2 completion validation for ordinary implementation.
- `./eng/release-check.sh <version>` is explicit-only future release-readiness validation.
- Release checks must not publish packages.
- Package smoke validation is not required until package publication becomes active.

## Future Release Validation Scope

Release readiness may include:

- public docs validation (`./eng/public-docs.sh`)
- public API validation (`./eng/public-api.sh`)
- package smoke validation (`./eng/package-smoke.sh <version>`) when packaging is active
- sample validation (`./eng/samples.sh`)
- release notes and versioning verification

## Visual Identity Release Validation

The visual identity sample should be included in release validation once release readiness becomes active.

Future release validation should verify that:

- `samples/BlazorJsonVisualizer.VisualIdentitySample` builds;
- the sample is reachable through the fixed-port sample launcher setup;
- default theme JSON is present;
- the sample can load and export theme JSON;
- public documentation references the visual identity sample and theme JSON contract.

Screenshot regression tests are deferred and are not part of ordinary implementation validation.

## Authority

This document is authoritative for:

- separation between fast development validation and future release-oriented validation
- explicit-only release command policy

## Document Contract

When this document changes, review:

- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/workflows/release-check.md`
- `docs/workflows/release.md`
- `eng/release-check.sh`
