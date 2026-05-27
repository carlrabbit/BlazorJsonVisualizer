# BlazorJsonVisualizer

BlazorJsonVisualizer is a Blazor-facing package for a standalone TypeScript browser runtime that visualizes, navigates, and incrementally edits large structured JSON documents.

## Current status

Pre-release project. Public package publishing and release-readiness automation are being prepared; consumer documentation exists but is still maturing.

## Quick start

A finalized consumer quick start is planned for first package release.

For now, contributors can build and validate with:

```bash
./eng/check.sh
```

## Samples

Runnable developer samples live under `samples/`.

```bash
eng/start-samples.sh
```

Then open the samples index on `http://localhost:5100`.

## Public documentation

- [Getting started](public-docs/getting-started.md)
- [Installation](public-docs/installation.md)
- [Concepts](public-docs/concepts.md)
- [Packages](public-docs/packages.md)
- [Samples](public-docs/samples.md)
- [Diagnostics](public-docs/diagnostics.md)
- [Versioning](public-docs/versioning.md)
- [Release notes](public-docs/release-notes.md)

## Contributor documentation

- [`docs/TERMINOLOGY.md`](docs/TERMINOLOGY.md)
- [`docs/SPECS.md`](docs/SPECS.md)
- [`docs/TBPS.md`](docs/TBPS.md)
- [`docs/GUARDRAILS.md`](docs/GUARDRAILS.md)
- [`docs/ENGINEERING.md`](docs/ENGINEERING.md)
- [`docs/PUBLIC-DOCS.md`](docs/PUBLIC-DOCS.md)

## Canonical engineering commands

```bash
./eng/restore.sh         # restore dependencies
./eng/build.sh           # build all projects
./eng/test.sh            # run short-running tests
./eng/format.sh          # apply formatting
./eng/check.sh           # restore + build + test + verify (completion gate)
./eng/frontend-check.sh  # TypeScript/Biome checks
./eng/samples.sh         # build and validate samples
./eng/public-docs.sh     # validate public documentation layout
```

See [`docs/engineering/command-contract.md`](docs/engineering/command-contract.md) for full command usage rules.
