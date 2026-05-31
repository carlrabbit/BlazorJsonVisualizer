# Public Documentation

## Purpose

This document defines the public documentation preview surfaces and synchronization rules for BlazorJsonVisualizer.

Public docs are currently **Preview**. They are allowed to be intentionally incomplete while package publication is planned, but each file must clearly separate supported behavior from planned behavior.

## What belongs here

- public documentation surface inventory
- synchronization rules between README, package docs, API docs, samples, diagnostics, versioning, release notes, and website content if any
- preview/planned status for public-package material

## What does not belong here

- product behavioral specs (use `docs/SPECS.md`)
- engineering command implementations (use `docs/ENGINEERING.md` and `docs/engineering/command-contract.md`)
- durable architecture (use `docs/ARCHITECTURE.md` when needed)

## Public Documentation Surfaces

| Surface | Source | Current status |
|---|---|---|
| Root README user sections | `README.md` | Preview status and contributor entry point |
| Getting started docs | `public-docs/getting-started.md` | Preview/planned |
| Installation docs | `public-docs/installation.md` | Planned |
| Package docs | `public-docs/packages.md`, `public-docs/nuget/package-readme.md` | Planned |
| Public API documentation | `public-docs/api/` | Preview for implemented APIs |
| Diagnostics reference | `public-docs/diagnostics.md` | Preview/planned |
| Samples documentation | `public-docs/samples.md`, `public-docs/samples/` | Preview for repository samples |
| Release notes | `public-docs/release-notes.md` | Pre-release placeholder |
| Versioning policy | `public-docs/versioning.md` | Planned |
| Theme JSON contract | `public-docs/concepts.md`, `public-docs/samples/visual-identity-playground.md` | Preview |
| Huge JSON lifecycle guide | `public-docs/guides/huge-json-documents.md` | Preview planned workflow |

## Synchronization Rules

When any listed surface changes, keep related public surfaces aligned.

- README user-facing sections must align with `public-docs/getting-started.md`, `public-docs/installation.md`, and current preview/release status.
- NuGet package metadata-facing documentation must align with `public-docs/nuget/package-readme.md` and `public-docs/packages.md` once package publication becomes active.
- Public API-facing behavior changes must update `public-docs/api/` and relevant getting-started material.
- Diagnostics behavior changes must update `public-docs/diagnostics.md` and `public-docs/diagnostics/` when those surfaces exist.
- Sample behavior changes must update `public-docs/samples.md` and `public-docs/samples/`.
- Versioning policy changes must update `public-docs/versioning.md`.
- Release behavior changes must update `public-docs/release-notes.md`.
- Website content, if used later, must originate from `public-docs/website/` and remain consistent with README and release notes.
- When the theme JSON contract changes, review and update `docs/specs/theme-token-format.md`, `public-docs/concepts.md`, `public-docs/samples/visual-identity-playground.md`, and `public-docs/release-notes.md`.
- When prepared-document lifecycle behavior changes, review and update `docs/specs/prepared-document.md`, `public-docs/concepts.md`, `public-docs/getting-started.md`, and `public-docs/guides/huge-json-documents.md`.

## Release Readiness

Release readiness is future work. Public docs validation may run during normal documentation changes, but release checks, package smoke checks, and publish workflows are explicit-only and must not be required for ordinary implementation.

## Document Contract

When this document changes, review:

- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/ENGINEERING.md`
- `docs/WORKFLOWS.md`
- `public-docs/`
