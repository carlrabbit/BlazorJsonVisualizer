# Long-Running Test Workflow

## Purpose

Describes the long-running test workflow for BlazorJsonVisualizer.

## Status

Long-running tests are not yet implemented. This document describes the intended workflow when they are added.

## Command

Long-running tests must not run through `./eng/test.sh` or `./eng/check.sh`.

When implemented, long-running tests will use a dedicated command or CI workflow trigger.

Candidate command (not yet implemented):
```sh
./eng/e2e.sh          # browser automation
./eng/benchmark.sh    # benchmarks
```

## Trigger

Long-running tests must be triggered explicitly. They must not run automatically on every push.

## What belongs here

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
- `docs/guardrails/testing.md`
