# Milestone 008: Create planned Layer 1, Layer 2, and Layer 3 sample apps

## Status

Closed. This milestone is implemented in the repository.

## Goal

Create the planned sample applications for Layer 1, Layer 2, and Layer 3 so the sample launcher and static sample index can demonstrate the project roadmap through concrete runnable samples.

## Scope

- create `samples/BlazorJsonVisualizer.Layer1Sample` on port 5120
- create `samples/BlazorJsonVisualizer.SchemaOverlaySample` on port 5130
- create `samples/BlazorJsonVisualizer.ProjectionSample` on port 5140
- update static sample index to mark new samples as implemented
- update sample launcher to start all three new samples
- update docs, specs, and `README.md`

## Non-goals

- implementing Layer 1, 2, or 3 runtime features beyond what existing specs/milestones require
- production sample portal
- GitHub Pages publishing
- complex demo UX
- long-running browser automation

## Deliverables

- `docs/milestones/008-create-layer-1-2-3-sample-apps.md` (this file)
- `samples/BlazorJsonVisualizer.Layer1Sample/`
- `samples/BlazorJsonVisualizer.SchemaOverlaySample/`
- `samples/BlazorJsonVisualizer.ProjectionSample/`
- updates to `samples/index/samples.js`
- updates to `scripts/dev/start-samples.sh`
- updates to `samples/SAMPLES.md`
- updates to `.devcontainer/samples/devcontainer.json`
- updates to `docs/specs/sample-hosting.md`
- updates to `docs/TESTING.md`
- updates to `README.md`

## Governing documents

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- `docs/TESTING.md`
- `docs/specs/sample-hosting.md`
- `samples/SAMPLES.md`

## Phases

1. Create milestone document and sample projects.
2. Update static index, launcher, devcontainer, and documentation.
3. Build and validate all sample projects.
4. Close milestone with completion notes.

## Exit criteria

- Layer 1 sample exists and builds on port 5120 ✓
- Layer 2 schema overlay sample exists and builds on port 5130 ✓
- Layer 3 projection sample exists and builds on port 5140 ✓
- static sample index links to all three samples ✓
- sample launcher starts all three samples concurrently ✓
- samples devcontainer forwards and labels all sample ports ✓
- docs, specs, and README are updated ✓

## Completion notes

- Created `samples/BlazorJsonVisualizer.Layer1Sample` (port 5120), `samples/BlazorJsonVisualizer.SchemaOverlaySample` (port 5130), and `samples/BlazorJsonVisualizer.ProjectionSample` (port 5140) as Blazor Web App projects referencing the main BlazorJsonVisualizer library.
- Each sample mounts the `JsonVisualizer` component with small deterministic embedded JSON data and shows layer-focused controls (reveal path, schema lookup, projection creation).
- Updated `samples/index/samples.js` to mark all three samples as implemented.
- Updated `scripts/dev/start-samples.sh` to build and start all three new samples on their fixed ports with proper detached mode support and port-conflict checking.
- Updated `samples/SAMPLES.md` with a `Project` column and current implemented status.
- Updated `.devcontainer/samples/devcontainer.json` with descriptive port labels and extended `postCreateCommand` to restore all sample projects.
- Updated `docs/specs/sample-hosting.md` with a `Sample app requirements` section.
- Updated `docs/TESTING.md` with a `Sample app validation` section.
- Updated `README.md` with a `Samples` section.
