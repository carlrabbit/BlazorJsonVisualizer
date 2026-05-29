# Long-Running Tests Workflow

## Purpose

Describe how stress, endurance, benchmark, and other long-running tests are invoked.

## Direction

- Long-running tests must not run automatically in normal CI.
- Invocation is explicit through `./eng/long-running-tests.sh` or the manual workflow.
- `./eng/long-running-tests.sh --fast` runs the same slow-category test inventory with reduced data sizes for command validation.
- Results should inform performance and resilience work rather than block routine implementation by default.

## GitHub Workflow File

- `.github/workflows/long-running-tests.yml`
