---
name: Release
about: Prepare and publish a versioned release
---

# Required Reading

- `README.md`
- `docs/PUBLIC-DOCS.md`
- `docs/ENGINEERING.md`
- `docs/engineering/command-contract.md`
- `docs/tbps/release.md`

# Goal

[Describe the release version and goals.]

# Scope

[What is included in this release.]

# Non-Goals

[What is deferred to a later release.]

# Related Milestone

[Link the milestone being released.]

# Public Documentation Release Checklist

- [ ] README is user-first.
- [ ] NuGet package README content is current.
- [ ] Getting started docs are current.
- [ ] Public API docs are current.
- [ ] Diagnostics reference is current.
- [ ] Samples documentation is current.
- [ ] Versioning policy is current.
- [ ] Release notes are current.

# Testing Expectations

- `./eng/check.sh` must succeed.
- `./eng/release-check.sh <version>` must succeed when release readiness prerequisites are active.

# Exit Criteria

- Release tag created.
- Artifacts published or documented.
- Milestone marked complete.
- CHANGELOG or release notes updated.
