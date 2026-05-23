# Testing

> **This document is superseded by [`docs/guardrails/testing.md`](guardrails/testing.md).**
> It remains here as a compatibility pointer. The authoritative testing policy lives in the guardrail.

## Fast tests

Fast tests are small deterministic tests that may be run by default by humans, agents, and CI.

Examples:

- small parser tests
- small structural index tests
- small viewport tests
- small transaction tests
- DTO/protocol contract tests
- small Blazor interop smoke tests

## Long-running tests

Long-running tests must not run automatically unless explicitly requested.

Examples:

- huge JSON tests
- stress tests
- browser endurance tests
- benchmarks
- fuzzing
- large schema validation matrices
- large Playwright suites

## Agent rule

Agents may create and run fast tests. Agents must not create or run long-running tests unless explicitly requested.

## Layer 1 fast test rules (Milestone 009)

Layer 1 tests created in Milestone 009 are fast tests by default.

Allowed:

- tokenizer unit tests over small strings
- structural index unit tests over small JSON snippets
- viewport calculation tests
- folding state tests
- path reveal tests
- read-only renderer smoke tests

Not allowed by default:

- huge JSON files
- generated massive documents
- benchmarks
- fuzzing
- long browser automation
- endurance tests

Large JSON and performance validation belongs in a later explicitly triggered long-running workflow.

## Running Layer 1 tests

```bash
cd tests/runtime && npm test
```

Or from the runtime workspace:

```bash
cd src/runtime && npm run test:layer1
```

## Sample launch checks

Starting sample applications is a developer-experience check, not a general fast test. The sample launcher may be used manually and by dedicated workflow/dev-container setup, but normal fast-test workflows should not start all samples unless explicitly configured to do so.

## Sample app validation

Sample apps are validated primarily by build and manual launch checks. They must not add large browser automation suites unless explicitly requested.

Required fast checks:

- sample projects build
- launcher can start implemented samples
- static sample index links to implemented samples
- if `scripts/dev/start-samples.sh` changes, `scripts/dev/start-samples.sh --dry-run` must be run and succeed before other launcher validation
