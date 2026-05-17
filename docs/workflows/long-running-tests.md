# Long-Running Tests Workflow

## Purpose

Describe how stress, endurance, benchmark, and other long-running tests are invoked.

## Initial direction

- Long-running tests must not run automatically in normal CI.
- Invocation should be explicit and documented.
- Results should inform performance and resilience work rather than block routine implementation by default.
