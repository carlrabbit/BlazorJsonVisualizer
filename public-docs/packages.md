# Packages

## Status

Preview / planned for first package publication.

This surface is not release-ready because NuGet packaging is currently planned, not active.

## Repository source projects

The repository currently contains implementation projects that are expected to inform future packages. These names are source project names, not finalized NuGet package identifiers:

| Source project | Purpose |
|---|---|
| `BlazorJsonVisualizer` | Blazor-facing component/runtime integration surface. |
| `BlazorJsonVisualizer.Storage.EFCore` | Provider-neutral EF Core prepared-document storage backend. |
| `BlazorJsonVisualizer.Storage.EFCore.SqlServer` | Optional SQL Server prepared-document storage optimization helpers. |

## Planned package documentation

Before first public package release, this surface must document:

- finalized NuGet package identifiers;
- supported target frameworks;
- installation snippets;
- storage-provider compatibility notes;
- package dependency guidance;
- package smoke-test expectations.

## Current guidance

Use repository docs and source projects for development. Do not treat the source project names as finalized package publication commitments.
