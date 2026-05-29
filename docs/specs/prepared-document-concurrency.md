# Prepared Document Concurrency

## Goal

Define the concurrency model for department-scale prepared document storage.

## Rules

- Multiple readers may access one prepared document concurrently.
- One writer may commit to one prepared document at a time.
- Different documents may be written concurrently.
- Delete while open fails clearly.
- Export observes one consistent revision.
- Search reports the revision it searched.
- Process-local coordination is sufficient for the first implementation.

## Non-Goals

- distributed locking
- collaborative editing
- merge/conflict resolution
- cross-process write coordination

## Authority

This document is authoritative for prepared document concurrency behavior.
