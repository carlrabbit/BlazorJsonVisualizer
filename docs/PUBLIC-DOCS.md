# Public Documentation

## Purpose

This document defines the authority and synchronization contract for BlazorJsonVisualizer public documentation.

Public documentation explains supported usage to external consumers (package users, sample users, release readers, and API consumers).

## Public Documentation Source

Public documentation source lives in:

- `public-docs/`

The root `README.md` user-facing sections are also part of the public documentation surface.

## Authority

This document is authoritative for:

- the purpose and governance of `public-docs/`
- public documentation surface definitions
- synchronization rules for user-facing documentation

This document is not authoritative for:

- product behavior (use `docs/SPECS.md`)
- engineering command implementations (use `docs/ENGINEERING.md` and `docs/engineering/command-contract.md`)
- implementation constraints (use `docs/GUARDRAILS.md`)

## Public Documentation Surfaces

| Surface | Source |
|---|---|
| Root README user sections | `README.md` |
| Getting started docs | `public-docs/getting-started.md` |
| Installation docs | `public-docs/installation.md` |
| Package docs | `public-docs/nuget/` |
| NuGet package README content | `public-docs/nuget/package-readme.md` |
| Public API documentation | `public-docs/api/` |
| Diagnostics reference | `public-docs/diagnostics/` |
| Samples documentation | `public-docs/samples/` |
| Website source content | `public-docs/website/` |
| Release notes | `public-docs/release-notes.md` |
| Versioning policy | `public-docs/versioning.md` |

## Synchronization Rules

When any listed surface changes, keep related public surfaces aligned.

- README user-facing sections must align with `public-docs/getting-started.md`, `public-docs/installation.md`, and current release status.
- NuGet package metadata-facing documentation must align with `public-docs/nuget/package-readme.md` and `public-docs/packages.md`.
- Public API-facing behavior changes must update `public-docs/api/` and relevant getting-started material.
- Diagnostics behavior changes must update `public-docs/diagnostics.md` and `public-docs/diagnostics/`.
- Sample behavior changes must update `public-docs/samples.md` and `public-docs/samples/`.
- Versioning policy changes must update `public-docs/versioning.md`.
- Release behavior changes must update `public-docs/release-notes.md`.
- Website content (if used) must originate from `public-docs/website/` and remain consistent with README and release notes.

## Document Contract

When this document changes, review:

- `README.md`
- `AGENTS.md`
- `.github/copilot-instructions.md`
- `docs/GUARDRAILS.md`
- `docs/ENGINEERING.md`
- `docs/WORKFLOWS.md`
- `public-docs/`
