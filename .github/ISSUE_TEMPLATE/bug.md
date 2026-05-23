---
name: Bug
about: Report a defect or unexpected behavior
---

# Required Reading

- `docs/TERMINOLOGY.md`
- `docs/GUARDRAILS.md`
- `docs/tbps/bug-investigation.md`
- Relevant spec from `docs/SPECS.md`

# Goal

[Describe the defect and expected vs. actual behavior.]

# Scope

[What component or layer is affected? Layer 1 / Layer 2 / Layer 3 / Blazor Host / TypeScript Runtime]

# Non-Goals

[What will not be fixed in this issue.]

# Related Specs

[Link relevant spec documents.]

# Related Architecture

[Link relevant architecture documents if applicable.]

# Related Milestone

[Link the milestone this belongs to, if any.]

# Testing Expectations

Short-running tests only unless a long-running test is explicitly justified.

# Exit Criteria

- Defect is fixed.
- Relevant spec is updated if the spec was wrong.
- Fast tests cover the fixed behavior.
- `./eng/check.sh` succeeds.
