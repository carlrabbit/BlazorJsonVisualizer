# Testing

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
