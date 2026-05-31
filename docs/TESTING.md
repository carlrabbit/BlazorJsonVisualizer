# Testing

The authoritative testing policy now lives in `docs/engineering/command-contract.md` as part of repository validation-tier routing.

## Short-running tests

Short-running tests are small deterministic tests that may be run by default by humans, agents, and CI.

Examples:

- small parser tests
- small structural index tests
- small viewport tests
- small transaction tests
- DTO/protocol contract tests
- small Blazor interop smoke tests

## Long-running tests

Long-running tests must not run automatically unless explicitly requested. Use `./eng/long-running-tests.sh` for explicit full-size runs and `./eng/long-running-tests.sh --fast` only to validate the long-running inventory with reduced data sizes.

Examples:

- huge JSON tests
- stress tests
- browser endurance tests
- benchmarks
- fuzzing
- large schema validation matrices
- large Playwright suites

## Package smoke tests

Package smoke tests are explicit-only future release/package validation. They must not run through `./eng/test.sh` or `./eng/check.sh` until package maturity changes and the explicit release workflow asks for them.

## Agent rule

Agents may create and run short-running tests. Agents must not create or run long-running tests unless explicitly requested.

## Layer 1 short-running test rules

Layer 1 tests are short-running tests by default when they use small inputs.

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

## Sample app validation

Sample apps are validated primarily by build and manual launch checks. They must not add large browser automation suites unless explicitly requested.

Required focused checks:

- sample projects build
- launcher can start implemented samples
- static sample index links to implemented samples
- if `eng/start-samples.sh` changes, `eng/start-samples.sh --dry-run` must be run and succeed before other launcher validation
