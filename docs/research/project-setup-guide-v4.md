# Project Setup Guide V4

## Status

Authoritative project-setup guide.

## Purpose

This guide defines how a repository is structured as a documentation-first, AI-assisted engineering system.

The guide is intentionally not stack-specific. It defines the repository knowledge model, documentation conventions, index rules, task best practices, specifications, milestones, workflows, guardrails, issue templates, and agent routing.

For concrete build, test, formatting, benchmark, packaging, .NET, Bun, Biome, Blazor, Playwright, samples, and GitHub Pages setup, use:

- `docs/engineering/dotnet.md`
- `docs/ENGINEERING.md`

The engineering guide is the stack profile. This project setup guide is the repository governance model.

## Core model

The repository separates these responsibilities:

| Layer | Responsibility |
|---|---|
| `README.md` | Human entry point and basic repository navigation. |
| `docs/TERMINOLOGY.md` | Canonical vocabulary. |
| `docs/ARCHITECTURE.md` | Index for structural system design. |
| `docs/DECISIONS.md` | Index for decision records and rationale. |
| `docs/SPECS.md` | Index for behavioral truth and invariants. |
| `docs/MILESTONES.md` | Index for controlled implementation phases. |
| `docs/TBPS.md` | Index for reusable operational methodology. |
| `docs/WORKFLOWS.md` | Index for operational workflow specifications. |
| `docs/GUARDRAILS.md` | Index for cross-cutting implementation and testing constraints. |
| `docs/ENGINEERING.md` | Index for concrete engineering substrate and stack profiles. |
| `docs/RESEARCH.md` | Index for non-authoritative research and rationale. |
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
Issues define concrete work.
Workflows define operations.
```

## Required base structure

```text
/
├─ README.md
├─ AGENTS.md
│
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
│  ├─ RESEARCH.md
│  │
│  ├─ architecture/
│  ├─ decisions/
│  ├─ specs/
│  ├─ milestones/
│  ├─ tbps/
│  ├─ workflows/
│  ├─ guardrails/
│  │  ├─ implementation.md
│  │  ├─ testing.md
│  │  └─ languages/
│  ├─ engineering/
│  │  └─ dotnet.md
│  └─ research/
│     ├─ project-setup-guide-v4.md
│     └─ engineering-guide-v3.md
│
└─ .github/
   ├─ ISSUE_TEMPLATE/
   ├─ workflows/
   ├─ instructions/
   └─ copilot-instructions.md
```

Concrete implementation repositories may add language and stack folders, for example:

```text
eng/
src/
tests/
benchmarks/
samples/
site/
tools/
artifacts/
packages/
.config/
```

Those folders are governed by `docs/ENGINEERING.md`, `docs/engineering/dotnet.md`, and the relevant guardrails.

## README rule

Only the root-level repository `README.md` is allowed.

Do not create additional `README.md` files anywhere else in the repository, including:

```text
docs/**/README.md
eng/README.md
samples/README.md
tools/**/README.md
site/README.md
```

Use named Markdown documents instead, for example:

```text
docs/ENGINEERING.md
docs/engineering/command-contract.md
docs/engineering/samples.md
docs/engineering/tools.md
docs/engineering/site.md
```

## Index document convention

Every documentation folder may have exactly one index document.

The index document is:

```text
docs/<FOLDER>.md
```

where `<FOLDER>` is the folder name written in uppercase.

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

Index documents must state the purpose of the indexed folder, define what belongs and does not belong, list available documents, define authority, and reference relevant TBPs, specs, workflows, guardrails, or engineering documents.

Folders under `docs/` must not contain local `README.md` or other competing meta documents.

## Documentation authority

Every durable document should declare what it is authoritative for:

```md
# Authority

This document is authoritative for:
- <area>

This document is not authoritative for:
- <excluded area>
```

## Document contracts

Documents that are part of a synchronization chain should define a document contract:

```md
# Document Contract

## Related Documents

- docs/TERMINOLOGY.md
- docs/TBPS.md
- docs/GUARDRAILS.md

## Must Be Updated Together

When this document changes, review and update:
- <related document>
```

Document contracts are especially important for workflow specs and GitHub workflow YAML, testing guardrails and engineering commands, public API documentation rules, milestone lifecycle TBPs and issue templates, and engineering command contracts and agent instructions.

## Core documents

### `README.md`

Purpose: human-facing entry point.

Minimum content:

```md
# Project Name

## Goal

Short project summary.

## Documentation Entry Points

- docs/TERMINOLOGY.md
- docs/ARCHITECTURE.md
- docs/SPECS.md
- docs/MILESTONES.md
- docs/TBPS.md
- docs/GUARDRAILS.md
- docs/ENGINEERING.md
- docs/WORKFLOWS.md

## Engineering Commands

See docs/ENGINEERING.md.

## Development

Basic setup instructions.
```

### `AGENTS.md`

Purpose: concise AI-agent entry point.

Required reading should include:

1. `docs/TERMINOLOGY.md`
2. `docs/GUARDRAILS.md`
3. `docs/TBPS.md`
4. `docs/SPECS.md`
5. `docs/ENGINEERING.md`
6. Relevant architecture, specs, decisions, milestones, workflows, TBPs, guardrails, and engineering documents

Agent rules include using canonical terminology, not inventing commands, not creating non-root README files, following testing and implementation guardrails, and using canonical engineering commands.

### `.github/copilot-instructions.md`

Purpose: concise GitHub Copilot routing file.

It should point to `AGENTS.md`, `docs/TERMINOLOGY.md`, `docs/GUARDRAILS.md`, `docs/ENGINEERING.md`, `docs/TBPS.md`, and relevant specs and architecture.

Path-specific Copilot instructions may live under `.github/instructions/`.

## Terminology

`docs/TERMINOLOGY.md` is the canonical vocabulary.

Important terms include Task Best Practice, Specification, Milestone, Guardrail, Engineering Guide, Command Contract, Short-Running Test, Long-Running Test, Document Authority, and Document Contract.

## Guardrails

`docs/GUARDRAILS.md` indexes project-wide constraints.

Recommended guardrails:

```text
docs/guardrails/testing.md
docs/guardrails/implementation.md
docs/guardrails/languages/dotnet.md
docs/guardrails/languages/typescript.md
```

Testing guardrails classify short-running and long-running tests and restrict agent execution of expensive tests.

Implementation guardrails constrain scope, readability, public API documentation, comments, validation, and documentation synchronization.

## Engineering

`docs/ENGINEERING.md` indexes concrete engineering substrate.

Engineering documents are authoritative for command contracts, build/restore/test/format/benchmark/package/release commands, toolchain setup, stack-specific building blocks, and optional engineering modules.

Concrete content for `docs/engineering/dotnet.md` is defined in Engineering Guide V3.

## Specs

`docs/SPECS.md` indexes behavioral truth documents.

Specs are authoritative for behavior, invariants, contracts, inputs and outputs, failure semantics, and validation expectations.

Specs must use canonical terminology, define invariants explicitly, avoid implementation plans, and exist before implementation whenever practical.

## Milestones

`docs/MILESTONES.md` indexes controlled implementation phases.

Milestones define scope, deliverables, dependencies, risks, and exit criteria. They do not define permanent behavioral truth.

## TBPs

`docs/TBPS.md` indexes reusable methodology.

TBPs define operational methodology, required reading, process expectations, validation expectations, and synchronization expectations. They do not define feature behavior, implementation details, architectural decisions, or one-off tasks.

Foundational TBPs include:

```text
docs/tbps/add-tbp.md
docs/tbps/create-spec.md
docs/tbps/create-milestone.md
docs/tbps/start-milestone.md
docs/tbps/finish-milestone.md
docs/tbps/documentation-review.md
docs/tbps/terminology-management.md
docs/tbps/release.md
```

## Workflows

`docs/WORKFLOWS.md` indexes workflow specifications.

Workflow specs are authoritative for workflow goal, constraints, high-level behavior, and validation expectations. GitHub workflow YAML files are implementation artifacts.

Recommended workflow specs:

```text
docs/workflows/build.md
docs/workflows/test-short.md
docs/workflows/test-long.md
docs/workflows/package.md
docs/workflows/release.md
docs/workflows/pages.md
```

## Issue templates

Use simple Markdown issue templates, not YAML forms by default.

Recommended templates:

```text
.github/ISSUE_TEMPLATE/bug.md
.github/ISSUE_TEMPLATE/documentation.md
.github/ISSUE_TEMPLATE/milestone-implementation.md
.github/ISSUE_TEMPLATE/release.md
```

Templates should route work to the correct TBPs and documents without becoming a second process system.

## Research

`docs/RESEARCH.md` indexes non-authoritative research.

Research documents preserve exploratory thinking. Research is non-authoritative unless promoted into terminology, architecture, decisions, specs, TBPs, guardrails, engineering, or workflows.

Store this guide as:

```text
docs/research/project-setup-guide-v4.md
```

Do not make the research copy authoritative. Extract its rules into the actual index documents and guardrails.

## Upgrade guide from V3

1. Add `docs/ENGINEERING.md`, `docs/engineering/`, and `docs/engineering/dotnet.md`.
2. Move stack-specific setup from prior setup guides into `docs/engineering/dotnet.md`.
3. Remove all non-root README files.
4. Keep the ALLCAPS index convention.
5. Move .NET, Bun, Biome, BenchmarkDotNet, Blazor, Playwright, NuGet, samples, GitHub Pages, and `eng/` command details into the engineering guide.
6. Update `AGENTS.md` to include `docs/ENGINEERING.md` and command-contract rules.
7. Update Copilot instructions to include `docs/ENGINEERING.md` and relevant engineering documents.
8. Update issue templates so implementation and release templates reference `docs/ENGINEERING.md`.
9. Store prior guide versions as research.

## Final V4 model

V4 explicitly separates:

```text
Project Setup Guide
  = repository knowledge model and governance

Engineering Guide
  = concrete build/test/toolchain profile
```

The repository should read as:

```text
README.md
  points to docs

docs/*.md
  define authoritative knowledge indexes

docs/<folder>/
  contains content, never README files

docs/ENGINEERING.md
  points to concrete command contracts and stack profiles

AGENTS.md
  routes agents to authoritative documents

.github/copilot-instructions.md
  routes Copilot to authoritative documents

.github/ISSUE_TEMPLATE/*.md
  routes concrete work to TBPs, specs, milestones, guardrails, and engineering commands
```

The main improvement over V3 is that engineering setup no longer competes with semantic project setup. It becomes its own authoritative documentation area.
