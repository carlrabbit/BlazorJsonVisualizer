# 0006 — Use user-owned EF Core DbContexts for prepared document storage

## Status

Accepted for Milestone 0016.

## Context

BlazorJsonVisualizer needs an EF Core storage backend for prepared documents.

A simple implementation could provide a library-owned `DbContext` and require consumers to inherit from it or use it directly. That would simplify the library but would not fit common application persistence ownership. Consumers need to control connection strings, provider configuration, migrations, schema placement, deployment, and database operations.

The storage backend also needs EF Core to discover the required entity types so migrations include prepared-document tables.

## Decision

BlazorJsonVisualizer EF Core storage will integrate with a user-owned `DbContext` through an explicit DbSet contract interface plus a model-builder extension.

The library may provide an optional reference context for samples and tests, but consumers are not required to inherit from a library-owned context.

SQL Server-specific optimizations will be opt-in migration helpers or scripts, not required provider-neutral model behavior.

## Consequences

### Positive

- Applications keep ownership of their database model and migrations.
- EF Core entity discovery and migration generation can be made explicit.
- The storage backend remains replaceable through the prepared-document storage abstraction.
- Provider-neutral EF Core behavior remains separate from SQL Server-specific tuning.
- Consumers can opt into SQL Server 2022 or SQL Server 2025 recommendations when appropriate.

### Negative

- Consumer setup requires several DbSet properties and an `OnModelCreating` call.
- Documentation must clearly explain entity discovery and migration ownership.
- The library must test model configuration and clear failure behavior for misconfigured contexts.

## Rejected Alternatives

### Require inheritance from a library DbContext

Rejected because it would force a persistence architecture on consumers and make application-owned migrations harder.

### Use only `OnModelCreating` without a DbSet contract

Rejected because it hides required entity sets from the consumer integration surface and makes migrations less obvious.

### Make SQL Server optimizations mandatory

Rejected because the provider-neutral EF Core backend must work without SQL Server-specific features.

## Authority

This decision is authoritative for the EF Core prepared-document storage integration strategy.

## Document Contract

When this decision changes, review:

- `docs/architecture/ef-core-prepared-document-storage-boundary.md`
- `docs/specs/ef-core-prepared-document-storage.md`
- `docs/specs/ef-core-prepared-document-dbcontext-contract.md`
- `docs/specs/sql-server-prepared-document-storage-optimizations.md`
- `public-docs/guides/ef-core-prepared-document-storage.md`
