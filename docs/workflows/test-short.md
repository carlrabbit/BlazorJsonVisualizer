# Short-Running Test Workflow

## Purpose

Describes the short-running (fast) test workflow for BlazorJsonVisualizer.

## Command

```sh
./eng/test.sh
```

Runs short-running tests only. Filters out slow and E2E test categories.

Filter applied: `--filter "TestCategory!=Slow&TestCategory!=E2E"`

## CI Trigger

The CI workflow runs `./eng/check.sh` which includes short-running tests.

## What is tested

- Unit tests over TypeScript runtime modules (tokenizer, structural index, viewport, navigation)
- .NET unit tests

## What is excluded

- Tests with `TestCategory=Slow`
- Tests with `TestCategory=E2E`
- Benchmarks

See `docs/engineering/command-contract.md` for classification rules.

## Authority

This document is authoritative for the short-running test workflow spec.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/engineering/command-contract.md`
- `docs/ENGINEERING.md`
