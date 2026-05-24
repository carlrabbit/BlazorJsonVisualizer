# Release

## Purpose

Prepare and publish a versioned release of BlazorJsonVisualizer.

## Required reading

- `README.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- The relevant milestone

## Steps

1. Confirm all milestone exit criteria are met.
2. Run `./eng/check.sh` and verify it succeeds.
3. Update version numbers in project files.
4. Update CHANGELOG or release notes.
5. Tag the release commit.
6. Trigger the release workflow or publish manually.

## Validation

- `./eng/check.sh` succeeds.
- Version numbers are consistent across project files.
- Release notes or changelog is updated.

## Exit criteria

- Release tag exists.
- Release artifacts are published or documented.
- Milestone is marked complete.
