# Milestone 007: Workspace sample launcher and fixed sample ports

## Status

In progress.

## Goal

Create a workspace-friendly sample execution setup where all sample applications can run concurrently on fixed ports, with a static index page that links to each sample from local and GitHub workspace/dev-container URLs.

## Scope

- define and document fixed sample ports
- add a static sample index under `samples/index`
- compute sample links from browser location for localhost and forwarded workspace URL patterns
- add one launcher script to start implemented samples and static index concurrently
- add a sample-focused dev-container variant that forwards sample ports and starts the launcher
- update docs/workflow/testing references for sample hosting

## Non-goals

- production hosting
- GitHub Pages deployment
- long-running browser automation
- implementing future sample applications beyond the currently available sample app

## Deliverables

- `docs/specs/sample-hosting.md`
- `samples/SAMPLES.md`
- `samples/index/index.html`
- `samples/index/samples.js`
- `samples/index/styles.css`
- `scripts/dev/start-samples.sh`
- `.devcontainer/samples/devcontainer.json`
- updates to `docs/WORKFLOWS.md`
- updates to `docs/TESTING.md`

## Governing documents

- `README.md`
- `docs/TERMINOLOGY.md`
- `docs/TBPS.md`
- `docs/SPECS.md`
- `docs/TESTING.md`
- `docs/WORKFLOWS.md`
- `docs/tbps/create-milestone.md`
- `docs/tbps/start-milestone.md`
- `docs/tbps/finish-milestone.md`
- `docs/specs/sample-hosting.md`

## Phases

1. Add milestone/spec/document updates for sample hosting and fixed-port policy.
2. Add static samples index files and workspace-safe link generation.
3. Add sample launcher and sample-focused dev-container variant.
4. Validate fast checks, run manual sample-launch checks, and close milestone.

## Exit criteria

- fixed sample ports are documented
- static sample index exists and lists implemented/planned samples
- launcher script starts static index and implemented sample concurrently
- sample-focused dev-container variant forwards sample ports and starts launcher
- docs/specs/workflow/testing references are aligned
