# Long-Running Test Workflow

## Purpose

Describes the long-running test workflow for BlazorJsonVisualizer.

## Status

Prepared-document storage long-running tests are implemented as explicit slow-category tests. They are not part of normal CI, `./eng/test.sh`, or `./eng/check.sh`.

## Command

Long-running tests must not run through `./eng/test.sh` or `./eng/check.sh`.

Use the dedicated command:

```sh
./eng/long-running-tests.sh          # full explicit long-running data sizes
./eng/long-running-tests.sh --fast   # minimal data sizes for command validation
```

## Trigger

Long-running tests must be triggered explicitly. They must not run automatically on every push.

## What belongs here

- prepared-document 100 MB and 500 MB import smoke tests
- 100 prepared documents in one store
- 10 concurrent prepared-document sessions
- large search latency smoke tests
- large export smoke tests
- huge JSON document tests
- stress tests
- browser endurance tests
- benchmarks
- fuzzing
- large schema validation matrices
- large Playwright suites

## Agent rule

Agents must not run long-running tests unless explicitly requested.

## Authority

This document is authoritative for the long-running test workflow spec.

## Document Contract

When this document changes, review:
- `docs/WORKFLOWS.md`
- `docs/engineering/command-contract.md`
