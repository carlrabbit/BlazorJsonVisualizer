# Samples Engineering

## Purpose

This document describes the sample project conventions and launch procedures for BlazorJsonVisualizer.

## Sample Projects

| Sample | Port | Purpose |
|---|---|---|
| BlazorJsonVisualizer.SampleApp | 5100 (index), 5110 | Basic sample Blazor application. |
| BlazorJsonVisualizer.Layer1Sample | 5120 | Layer 1 runtime demonstration. |
| BlazorJsonVisualizer.SchemaOverlaySample | 5130 | Layer 2 schema overlay demonstration. |
| BlazorJsonVisualizer.ProjectionSample | 5140 | Layer 3 projection demonstration. |

## Sample Conventions

- Samples must be small.
- Samples must compile.
- Samples must reference source projects or published packages intentionally.
- Samples must not contain hidden test assertions.
- Samples must not become a second application architecture.
- Samples must not be required for normal production builds unless explicitly documented.
- Samples should prefer clarity over completeness.
- No local README files in `samples/`.

## Validation

```sh
# Build and validate samples
./eng/samples.sh
```

## Developer Launch

```sh
# Launch all samples
scripts/dev/start-samples.sh

# Dry run (no build/start)
scripts/dev/start-samples.sh --dry-run

# Detached launch (non-blocking)
scripts/dev/start-samples.sh --detach
```

Then open the samples index on port `5100`.

## Authority

This document is authoritative for:
- sample project list and ports
- sample conventions
- sample validation requirements

## Document Contract

When this document changes, review:
- `docs/ENGINEERING.md`
- `README.md`
