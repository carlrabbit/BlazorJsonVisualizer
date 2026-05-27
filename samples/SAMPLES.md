# Samples

This directory contains developer-facing sample applications for BlazorJsonVisualizer.

## Fixed ports

| Port | Sample | Project | Status |
| ---: | --- | --- | --- |
| 5100 | Static samples index | `samples/index` | Implemented |
| 5110 | Basic Blazor host/sample | `src/BlazorJsonVisualizer.SampleApp` | Implemented |
| 5120 | Layer 1 JSON viewer sample | `samples/BlazorJsonVisualizer.Layer1Sample` | Implemented |
| 5130 | Layer 2 schema overlay sample | `samples/BlazorJsonVisualizer.SchemaOverlaySample` | Implemented |
| 5140 | Layer 3 projection sample | `samples/BlazorJsonVisualizer.ProjectionSample` | Implemented |
| 5150 | Visual Identity Playground | `samples/BlazorJsonVisualizer.VisualIdentitySample` | Implemented |

## Running all samples

Use:

```bash
scripts/dev/start-samples.sh
```

Then open the static samples index on port `5100`.

If you change `scripts/dev/start-samples.sh`, run `scripts/dev/start-samples.sh --dry-run` first.

The sample dev-container/Codespaces variant uses detached startup so repeated starts do not block the container startup hook.

## Codespaces usage

Use the sample-focused devcontainer entry:

```text
.devcontainer/samples/devcontainer.json
```

## Rules

- Each sample app must use its documented fixed port.
- Each sample must bind to `0.0.0.0` when launched from scripts/dev containers.
- Samples should use small deterministic embedded data.
- Samples are for manual development validation, not long-running automated tests.
