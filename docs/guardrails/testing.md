# Testing Guardrail

## Purpose

This guardrail defines testing policy for BlazorJsonVisualizer: how tests are classified, which tests agents may run automatically, and which require explicit requests.

This document supersedes `docs/TESTING.md` as the primary testing authority. `docs/TESTING.md` remains as a compatibility pointer.

## Test Classification

### Short-Running Tests

Short-running tests are small, deterministic tests that complete quickly and have no external dependencies.

Allowed in short-running tests:
- small parser and tokenizer tests
- structural index tests over small JSON snippets
- viewport calculation tests
- folding state tests
- path reveal tests
- read-only renderer smoke tests
- DTO and protocol contract tests
- small Blazor interop smoke tests

Not allowed in short-running tests:
- huge JSON files or generated massive documents
- browser automation
- network calls
- endurance loops
- benchmarks
- fuzzing
- package smoke tests

### Long-Running Tests

Long-running tests include stress tests, benchmark runners, huge-document tests, fuzzing harnesses, endurance tests, and large browser automation suites.

Long-running tests must not run automatically unless explicitly requested.

Examples:
- huge JSON tests
- stress tests
- browser endurance tests
- benchmarks
- fuzzing
- large schema validation matrices
- large Playwright suites

### PackageSmoke Tests

Package smoke tests validate packed artifacts from a consumer perspective.

- Category: `PackageSmoke`
- Excluded from `./eng/test.sh`
- Excluded from `./eng/check.sh`
- Included only in explicit release validation workflows (for example `./eng/package-smoke.sh <version>` or `./eng/release-check.sh <version>` once packaging prerequisites exist)

## Agent Rules

- Agents may create and run short-running tests.
- Agents must not create or run long-running tests unless explicitly requested.
- `./eng/test.sh` runs short-running tests only.
- `./eng/check.sh` is the default completion gate and only runs short-running tests.
- Long-running tests and package smoke tests require separate explicit commands or workflow triggers.
- `./eng/long-running-tests.sh --fast` is allowed only when long-running test infrastructure itself is being implemented or explicitly requested; it must keep data sizes minimal.

## Layer 1 Fast Test Rules

Layer 1 tests (introduced in Milestone 009) are short-running by default.

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

## Sample App Validation

Sample apps are validated primarily by build and manual launch checks. They must not add large browser automation suites unless explicitly requested.

Required fast checks:
- sample projects build
- launcher can start implemented samples
- static sample index links to implemented samples
- if `eng/start-samples.sh` changes, run `eng/start-samples.sh --dry-run` before other launcher validation

Starting sample applications is a developer-experience check, not a general fast test. Sample launch must not block normal fast-test workflows.

## Authority

This document is authoritative for:
- short-running vs. long-running test classification
- package smoke test classification and default exclusions
- which tests agents may run automatically
- sample validation rules

## Document Contract

When this document changes, review:
- `docs/GUARDRAILS.md`
- `docs/TESTING.md`
- `AGENTS.md`
- `docs/engineering/command-contract.md`
- `docs/workflows/test-short.md`
- `docs/workflows/test-long.md`
- `docs/workflows/release-check.md`
