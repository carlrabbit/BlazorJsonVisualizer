# Samples

This directory contains developer-facing sample applications for BlazorJsonVisualizer.

## Fixed ports

| Port | Sample | Status |
| ---: | --- | --- |
| 5100 | Static samples index | Required |
| 5110 | Basic Blazor host/sample (`src/BlazorJsonVisualizer.SampleApp`) | Implemented |
| 5120 | Layer 1 JSON viewer sample | Planned |
| 5130 | Layer 2 schema overlay sample | Planned |
| 5140 | Layer 3 projection sample | Planned |

## Running all samples

Use:

```bash
scripts/dev/start-samples.sh
```

Then open the static samples index on port `5100`.

The sample dev-container/Codespaces variant uses detached startup so repeated starts do not block the container startup hook.

## Rules

- Each sample app must use a fixed port.
- Add new samples to this file and to the static index.
- Do not rely on random ASP.NET development ports for samples.
