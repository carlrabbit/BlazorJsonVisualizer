# Project Setup Guide V5

## Status

Authoritative project-setup guide.

## Purpose

This guide defines how a repository is structured as a documentation-first, AI-assisted engineering system.

Version 5 extends Version 4 with a first-class public documentation layer for repositories that publish NuGet packages, public APIs, source generators, command-line tools, websites, or other externally consumed artifacts.

The guide remains stack-independent. It defines the repository knowledge model, documentation conventions, public documentation model, index rules, task best practices, specifications, milestones, workflows, guardrails, issue templates, and agent routing.

For concrete build, test, formatting, benchmark, package, release, .NET, Bun, Biome, Blazor, Playwright, samples, public documentation validation, and GitHub Pages setup, use:

- `docs/ENGINEERING.md`
- `docs/engineering/dotnet.md`

## Core model

The repository separates the following responsibilities.

| Layer | Responsibility |
|---|---|
| `README.md` | First-contact public and contributor entry point. |
| `docs/TERMINOLOGY.md` | Canonical vocabulary. |
| `docs/ARCHITECTURE.md` | Index for structural system design. |
| `docs/DECISIONS.md` | Index for decision records and rationale. |
| `docs/SPECS.md` | Index for behavioral truth and invariants. |
| `docs/MILESTONES.md` | Index for controlled implementation phases. |
| `docs/TBPS.md` | Index for reusable operational methodology. |
| `docs/WORKFLOWS.md` | Index for operational workflow specifications. |
| `docs/GUARDRAILS.md` | Index for cross-cutting implementation and testing constraints. |
| `docs/ENGINEERING.md` | Index for concrete engineering substrate and stack profiles. |
| `docs/PUBLIC-DOCS.md` | Index and synchronization contract for public user-facing documentation. |
| `docs/RESEARCH.md` | Index for non-authoritative research and rationale. |
| `public-docs/` | Source for externally consumable documentation. |
| `AGENTS.md` | Concise agent routing and repository synchronization rules. |
| `.github/copilot-instructions.md` | Concise GitHub Copilot routing rules. |
| `.github/ISSUE_TEMPLATE/*.md` | Lightweight issue templates that route work to the correct documents and TBPs. |

The governing rule is:

```text
Terminology defines words.
Architecture defines structure.
Specs define truth.
Decisions define rationale.
Milestones define sequencing.
TBPs define methodology.
Guardrails define project-wide constraints.
Engineering defines command contracts and toolchain setup.
Public docs explain supported usage to consumers.
Issues define concrete work.
Workflows define operations.
```

## Internal documentation vs public documentation

The repository has two documentation bases.

```text
docs/
  internal authoritative engineering and semantic documentation

public-docs/
  external consumer-facing documentation source
```

`docs/` is the internal knowledge system. It contains specs, architecture, decisions, TBPs, milestones, guardrails, engineering instructions, workflow specs, and research.

`public-docs/` is the public documentation source. It contains user-facing material such as installation guides, getting-started guides, package docs, diagnostics references, API documentation, sample walkthroughs, versioning policy, release notes, and website source content.

The public documentation layer is core to the repository. It is not a separate guide and not an afterthought. Public documentation must be kept synchronized with specs, public API, package metadata, diagnostics, samples, release behavior, and website publication.

## Required base structure

```text
/
├─ README.md
├─ AGENTS.md
├─ docs/
│  ├─ TERMINOLOGY.md
│  ├─ ARCHITECTURE.md
│  ├─ DECISIONS.md
│  ├─ SPECS.md
│  ├─ MILESTONES.md
│  ├─ TBPS.md
│  ├─ WORKFLOWS.md
│  ├─ GUARDRAILS.md
│  ├─ ENGINEERING.md
│  ├─ PUBLIC-DOCS.md
│  ├─ RESEARCH.md
│  ├─ architecture/
│  ├─ decisions/
│  ├─ specs/
│  ├─ milestones/
│  ├─ tbps/
│  ├─ workflows/
│  ├─ guardrails/
│  ├─ engineering/
│  └─ research/
│     ├─ project-setup-guide-v5.md
│     └─ engineering-guide-v4.md
├─ public-docs/
│  ├─ getting-started.md
│  ├─ installation.md
│  ├─ concepts.md
│  ├─ packages.md
│  ├─ samples.md
│  ├─ diagnostics.md
│  ├─ versioning.md
│  ├─ release-notes.md
│  ├─ guides/
│  ├─ api/
│  ├─ diagnostics/
│  ├─ nuget/
│  ├─ samples/
│  └─ website/
└─ .github/
   ├─ ISSUE_TEMPLATE/
   ├─ workflows/
   ├─ instructions/
   └─ copilot-instructions.md
```

Concrete implementation repositories may add `eng/`, `src/`, `tests/`, `benchmarks/`, `samples/`, `site/`, `tools/`, `artifacts/`, `packages/`, and `.config/`. These folders are governed by `docs/ENGINEERING.md`, `docs/engineering/*`, and the relevant guardrails.

## README rule

Only the root-level repository `README.md` is allowed.

Do not create additional `README.md` files anywhere else in the repository, including `docs/**/README.md`, `public-docs/**/README.md`, `eng/README.md`, `samples/README.md`, `tools/**/README.md`, and `site/README.md`.

Use named Markdown documents instead, such as `docs/ENGINEERING.md`, `docs/PUBLIC-DOCS.md`, `docs/engineering/command-contract.md`, `public-docs/getting-started.md`, `public-docs/nuget/package-readme.md`, and `public-docs/samples/getting-started.md`.

## Index document convention

Every documentation folder under `docs/` may have exactly one index document. The index document is `docs/<FOLDER>.md`, where `<FOLDER>` is the folder name written in uppercase.

Examples:

```text
docs/ARCHITECTURE.md indexes docs/architecture/
docs/DECISIONS.md indexes docs/decisions/
docs/SPECS.md indexes docs/specs/
docs/MILESTONES.md indexes docs/milestones/
docs/TBPS.md indexes docs/tbps/
docs/WORKFLOWS.md indexes docs/workflows/
docs/GUARDRAILS.md indexes docs/guardrails/
docs/ENGINEERING.md indexes docs/engineering/
docs/RESEARCH.md indexes docs/research/
```

`public-docs/` is a root-level public documentation source folder. Its internal governance is defined by `docs/PUBLIC-DOCS.md`. Do not create `public-docs/README.md`.

## Documentation authority and contracts

Every durable document should declare what it is authoritative for. Documents that are part of a synchronization chain should define a document contract. Document contracts are especially important for workflow specs and GitHub workflow YAML, testing guardrails and engineering commands, public API documentation rules and language guardrails, package metadata and public NuGet documentation, diagnostics behavior and diagnostics reference pages, milestone lifecycle TBPs and issue templates, public documentation and release notes, and engineering command contracts and agent instructions.

## Root files

The root `README.md` is the first-contact entry point for users and contributors. It must be user-first when the repository publishes a package, public API, CLI, source generator, website, or other externally consumed artifact. The README may include quick-start commands, but it must not become the full engineering guide.

`AGENTS.md` is the concise AI-agent entry point. It must route agents to `docs/TERMINOLOGY.md`, `docs/GUARDRAILS.md`, `docs/TBPS.md`, `docs/SPECS.md`, `docs/ENGINEERING.md`, `docs/PUBLIC-DOCS.md` when public behavior changes, and relevant architecture, specs, decisions, milestones, workflows, TBPs, guardrails, engineering documents, and public documentation.

`.github/copilot-instructions.md` is the concise GitHub Copilot routing file and should point to `AGENTS.md`, `docs/TERMINOLOGY.md`, `docs/GUARDRAILS.md`, `docs/ENGINEERING.md`, `docs/TBPS.md`, `docs/PUBLIC-DOCS.md` when public-facing behavior changes, relevant specs, relevant architecture documents, and relevant language guardrails.

## Public documentation

`docs/PUBLIC-DOCS.md` is the internal authority and synchronization contract for public documentation.

Public documentation is documentation intended for package consumers, API users, website readers, and release consumers. Public documentation lives under `public-docs/`.

Public documentation surfaces include:

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

Rules:

- Public documentation must be user-first.
- Public documentation must not expose internal implementation structure unless relevant to users.
- Public documentation must link to public concepts before internal specs.
- Public documentation must use canonical terminology from `docs/TERMINOLOGY.md`.
- Public documentation must be updated when specs, public API, diagnostics, package metadata, samples, or release behavior changes.
- Public documentation must not duplicate internal specs verbatim.
- Public documentation must explain supported usage, not internal rationale.

## Public documentation structure

Recommended starting structure:

```text
public-docs/
├─ getting-started.md
├─ installation.md
├─ concepts.md
├─ packages.md
├─ samples.md
├─ diagnostics.md
├─ versioning.md
├─ release-notes.md
├─ guides/
├─ api/
├─ diagnostics/
├─ nuget/
├─ samples/
└─ website/
```

Diagnostics pages should describe severity, message, cause, invalid example, fixed example, and related docs.

NuGet package README source should live under `public-docs/nuget/`. For a single-package repository, use `public-docs/nuget/package-readme.md`; for multi-package repositories, use `public-docs/nuget/<PackageId>.md` and document the mapping in `docs/PUBLIC-DOCS.md`.

## Guardrails

`docs/GUARDRAILS.md` indexes project-wide constraints. It must include testing, implementation, .NET, and TypeScript language guardrails. It must reference `docs/PUBLIC-DOCS.md` and `public-docs/` when public documentation applies.

`docs/guardrails/implementation.md` must include a public API documentation rule: public APIs must document intent, contract, constraints, and failure behavior. Public API documentation must not merely restate implementation mechanics. When public API documentation changes, review `public-docs/api/`, `public-docs/getting-started.md`, `public-docs/nuget/`, and `public-docs/release-notes.md`.

## Engineering

`docs/ENGINEERING.md` indexes the concrete engineering substrate. It must add public documentation validation to the engineering index and document commands such as `./eng/public-docs.sh` and `./eng/release-check.sh <version>`.

Engineering Guide V4 defines BB19 Public Documentation and BB20 Release Readiness.

## Specs

Specs remain internal behavioral authority. Public documentation must not replace specs.

Rules:

- Specs define what must be true.
- Public docs explain how consumers use what is true.
- Public docs must be updated when externally visible spec-defined behavior changes.
- Specs may link to public docs, but public docs must not become internal implementation authority.

## Milestones

Milestones that affect public release readiness must include public documentation impact. Version 1.0 milestones require public documentation.

Public documentation impact should list affected surfaces such as `README.md`, `public-docs/getting-started.md`, `public-docs/installation.md`, `public-docs/nuget/`, `public-docs/api/`, `public-docs/diagnostics/`, `public-docs/samples/`, and `public-docs/release-notes.md`.

## TBPs

`docs/TBPS.md` must include `docs/tbps/public-documentation-update.md`.

The public documentation update TBP keeps user-facing documentation synchronized with repository behavior, packages, diagnostics, samples, public API, and release state. It requires reading `docs/TERMINOLOGY.md`, `docs/PUBLIC-DOCS.md`, `docs/SPECS.md`, `docs/ENGINEERING.md`, and relevant specs, package docs, diagnostics docs, and samples docs.

## Workflows

Add public documentation and release-readiness workflow specs:

```text
docs/workflows/public-docs.md
docs/workflows/release-check.md
```

The public documentation workflow validates public documentation before release or public-facing changes. It must not require secrets or publish by default. It should check links, required files, diagnostics pages, NuGet README source, and sample documentation references where practical.

## Issue templates

Use simple Markdown issue templates. Documentation, milestone implementation, and release templates must include public documentation impact sections. Release templates must include a public documentation release checklist.

## Research

Store this guide as:

```text
docs/research/project-setup-guide-v5.md
```

Do not make the research copy authoritative. Extract its rules into actual index documents, TBPs, guardrails, public documentation docs, and engineering docs.

## Upgrade guide from V4

1. Add `docs/PUBLIC-DOCS.md` and reference it from `README.md`, `AGENTS.md`, `.github/copilot-instructions.md`, and `docs/RESEARCH.md`.
2. Add `public-docs/` and initial public docs, without `public-docs/README.md`.
3. Update terminology with public documentation terms.
4. Make the root README user-first if the repository publishes packages or public APIs.
5. Add `docs/tbps/public-documentation-update.md` and update `docs/TBPS.md`.
6. Update guardrails with public API documentation rules and public documentation synchronization references.
7. Upgrade engineering to Engineering Guide V4 and add BB19/BB20 plus `eng/public-docs.sh`, `eng/package-smoke.sh`, `eng/public-api.sh`, and `eng/release-check.sh`.
8. Add `docs/workflows/public-docs.md`, `docs/workflows/release-check.md`, and update `docs/workflows/release.md`.
9. Add public documentation impact sections to issue templates.
10. Update release readiness to include package smoke tests, public API validation, samples validation, public documentation validation, and release notes validation.
11. Store the previous setup guide as `docs/research/project-setup-guide-v4.md` if history is needed.

## Final V5 model

V5 explicitly separates:

```text
Project-internal authority
  docs/

Public consumer-facing source
  public-docs/

Publication mechanisms
  README.md
  NuGet package README
  generated API docs
  website
  release notes
```

The repository should now read as:

```text
README.md
  first-contact user and contributor entry point

docs/*.md
  authoritative internal knowledge indexes

docs/<folder>/
  internal documentation content, never README files

public-docs/
  public documentation source, never README files

docs/PUBLIC-DOCS.md
  public documentation authority and synchronization contract

AGENTS.md
  routes agents to authoritative documents

.github/copilot-instructions.md
  routes Copilot to authoritative documents

.github/ISSUE_TEMPLATE/*.md
  routes concrete work to TBPs, specs, milestones, guardrails, engineering commands, and public docs
```
