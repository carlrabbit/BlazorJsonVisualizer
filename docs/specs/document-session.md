# Document Session

## Purpose

Define the lifecycle and state model for one loaded structural JSON document in the runtime.

## Initial direction

- A session owns one document, its revision, viewport state, and change state.
- Session behavior must support deterministic transactions.
- Session boundaries must remain host-agnostic inside the runtime core.
