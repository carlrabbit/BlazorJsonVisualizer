# Release Readiness

## Purpose

Define release-oriented validation for BlazorJsonVisualizer without changing the fast development gate.

## Model

- `./eng/check.sh` remains the fast development gate.
- `./eng/release-check.sh <version>` is the explicit release-readiness gate.
- Release checks must not publish packages.

## Release Validation Scope

Release readiness may include:

- public docs validation (`./eng/public-docs.sh`)
- public API validation (`./eng/public-api.sh`)
- package smoke validation (`./eng/package-smoke.sh <version>`) when BB14 is active
- sample validation (`./eng/samples.sh`)
- release notes and versioning verification

## Current Status

Full release-readiness automation is planned (BB20). Scripts exist with prerequisite checks and clear failure messages where modules are not yet active.

## Visual Identity Release Validation

The visual identity sample is part of release validation.

Release validation must verify that:

- samples/BlazorJsonVisualizer.VisualIdentitySample builds;
- the sample is reachable through the fixed-port sample launcher setup;
- default theme JSON is present;
- the sample can load and export theme JSON;
- public documentation references the visual identity sample and theme JSON contract.

Screenshot regression tests are deferred and are not part of this milestone's release gate.

## Authority

This document is authoritative for:
- separation between fast development validation and release-oriented validation
- explicit-only release command policy

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/workflows/release-check.md`
- `docs/workflows/release.md`
- `eng/release-check.sh`
