# Document Session Spec

## Purpose

Defines the lifecycle of one document runtime instance.

## Session identity

A session has:

- `sessionId`
- optional `documentId`
- lifecycle state
- runtime options
- host callback target

## Lifecycle states

- `created`
- `mounted`
- `document-loaded`
- `disposed`

## Rules

- A disposed session must reject further commands.
- Runtime internals must not depend on Blazor component instances.
- The session API must be testable without Blazor.
- Milestone 002 may use placeholder rendering only.
