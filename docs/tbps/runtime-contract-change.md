# Runtime Contract Change

## Purpose

Change a runtime-facing contract in a controlled way across specs, protocol types, and host expectations.

## Required reading

- `docs/TERMINOLOGY.md`
- `docs/SPECS.md`
- `docs/specs/runtime-protocol.md`
- The affected milestone and architecture documents

## Steps

1. Identify the contract surface and the consumers it affects.
2. Update the authoritative spec before or with implementation.
3. Define the shape, versioning, and compatibility expectations.
4. Update dependent docs, DTOs, and fast contract tests as needed.
5. Document migration or follow-up work when compatibility is partial.

## Validation

- The contract change is reflected in the governing spec.
- Affected hosts and runtime boundaries are identified.
- Compatibility expectations are explicit.

## Exit criteria

- The new contract is documented and internally consistent.
- Follow-up implementation can proceed from repository docs alone.
