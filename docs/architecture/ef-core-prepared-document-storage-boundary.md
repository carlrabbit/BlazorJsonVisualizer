# EF Core Prepared Document Storage Boundary

## Purpose

Describe the durable boundary between the prepared-document storage abstraction, the EF Core storage backend, user-owned DbContexts, and SQL Server optimization helpers.

## Status

Architecture note for Milestone 0016.

## Boundary Summary

```text
Prepared document services
  -> prepared-document store abstraction
    -> EF Core storage backend
      -> user-owned DbContext contract
        -> consumer database and migrations

SQL Server optimization helpers
  -> optional migration/script layer
  -> not required for provider-neutral correctness
```

## Ownership

### Library owns

- entity types used by the EF Core prepared-document backend;
- model-builder configuration extension;
- storage backend implementation;
- dependency-injection registration;
- provider-neutral behavior specs;
- SQL Server optimization helper APIs or scripts.

### Application owns

- DbContext type;
- connection string and provider configuration;
- migrations;
- database deployment;
- whether SQL Server optimizations are applied;
- backup/restore and database operations.

## DbContext Boundary

The EF Core backend must not require consumers to inherit from a library-owned context.

The consumer integrates storage by implementing the required DbSet contract and calling the model-builder extension.

An optional reference context may exist for samples/tests, but it is not the primary integration boundary.

## Storage Abstraction Boundary

The EF Core backend is one storage-provider implementation. The prepared-document store abstraction remains the public storage lifecycle boundary.

Consumers should not need to query EF entities directly for normal prepared-document import, open, search, or export behavior.

## SQL Server Boundary

SQL Server optimizations are a provider-specific layer above the provider-neutral EF Core model.

SQL Server 2022 and SQL Server 2025 helpers must be separate enough that SQL Server 2025-only behavior cannot accidentally become required for SQL Server 2022 users.

## Public Documentation Boundary

Public docs should explain how to integrate the EF Core backend and opt into SQL Server recommendations, but they must not present the repository as release-ready unless a later release task changes the repository maturity.

## Authority

This document is authoritative for the EF Core storage subsystem ownership boundary.

## Document Contract

When this architecture document changes, review:

- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `docs/decisions/0006-user-owned-ef-core-dbcontext-for-prepared-document-storage.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
