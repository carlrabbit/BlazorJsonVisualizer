# BlazorJsonVisualizer

BlazorJsonVisualizer is a Blazor-facing package for a standalone TypeScript browser runtime that visualizes, navigates, searches, and incrementally edits large structured JSON documents.

## Current status

BlazorJsonVisualizer is in **Exploration / Active Design** mode.

The repository is behavior-rich and has strong specs for the runtime, prepared-document lifecycle, ingestion, prepared-document storage, EF Core storage, search/indexing, controlled Layer 1 editing, edited export, visual identity, and browser/Blazor boundaries. Architecture remains emerging and should be documented only where durable subsystem boundaries need explanation.

Public package publication is **preview/planned**. Public docs are preview surfaces and may intentionally distinguish implemented repository behavior from planned consumer workflows. Release readiness is future work and must not be treated as a normal implementation requirement.

## Quick start

A finalized consumer quick start is planned for the first package release.

For now, contributors can build and validate with:

```bash
./eng/check.sh
```

## Huge JSON workflow

The current repository direction for huge JSON is:

```text
import raw JSON once
  -> create a prepared document
  -> open it through the range-backed Layer 1 viewer
  -> search and reveal through prepared-document services
  -> apply controlled Layer 1 edits as transactions
  -> export the current revision when needed
```

Prepared documents can be stored through the default storage path or through the EF Core prepared-document storage backend. Applications should depend on the prepared-document store/runtime contracts, not on a provider's internal storage layout.

## Samples

Runnable developer samples live under `samples/`.

```bash
eng/start-samples.sh
```

Then open the samples index on `http://localhost:5100`.

## Public documentation preview

These preview docs describe currently useful concepts and planned consumer workflows. Installation, package, versioning, and release material remains planned until package publication matures.

- [Getting started](public-docs/getting-started.md)
- [Installation](public-docs/installation.md)
- [Concepts](public-docs/concepts.md)
- [Packages](public-docs/packages.md)
- [Samples](public-docs/samples.md)
- [Diagnostics](public-docs/diagnostics.md)
- [Versioning](public-docs/versioning.md)
- [Release notes](public-docs/release-notes.md)
- [Huge JSON documents](public-docs/guides/huge-json-documents.md)
- [Import huge JSON](public-docs/guides/import-huge-json.md)
- [Open a prepared document](public-docs/guides/open-prepared-document.md)
- [Layer 1 prepared-document search](public-docs/guides/layer1-prepared-document-search.md)
- [Layer 1 controlled editing](public-docs/guides/layer1-controlled-editing.md)
- [Export edited prepared documents](public-docs/guides/export-edited-prepared-document.md)
- [EF Core prepared-document storage](public-docs/guides/ef-core-prepared-document-storage.md)
- [SQL Server prepared-document storage optimizations](public-docs/guides/sql-server-prepared-document-storage-optimizations.md)
- [Import diagnostics](public-docs/diagnostics/import-diagnostics.md)
- [Layer 1 viewer diagnostics](public-docs/diagnostics/layer1-viewer-diagnostics.md)
- [EF Core storage diagnostics](public-docs/diagnostics/ef-core-storage-diagnostics.md)

## Contributor documentation

- [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md)
- [`docs/SPECS.md`](docs/SPECS.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DECISIONS.md`](docs/DECISIONS.md)
- [`docs/ENGINEERING.md`](docs/ENGINEERING.md)
- [`docs/PUBLIC-DOCS.md`](docs/PUBLIC-DOCS.md)
- [`docs/MILESTONES.md`](docs/MILESTONES.md)

## Canonical engineering commands

```bash
./eng/restore.sh         # restore dependencies
./eng/build.sh           # build all projects
./eng/test.sh            # run short-running tests
./eng/format.sh          # apply formatting
./eng/check.sh           # Tier 2 completion gate: restore + build + test + verify
./eng/frontend-check.sh  # focused TypeScript/Biome checks
./eng/samples.sh         # focused sample validation
./eng/public-docs.sh     # focused public documentation validation
```

Release/public-package commands such as `./eng/release-check.sh <version>`, `./eng/package-smoke.sh <version>`, and `./eng/public-api.sh` are explicit-only future-readiness workflows.

See [`docs/engineering/command-contract.md`](docs/engineering/command-contract.md) for full command usage rules.
