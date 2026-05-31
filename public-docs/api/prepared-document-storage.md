# Prepared Document Storage API

## Status

Preview.

The prepared-document storage API has two layers:

- the application-facing prepared document store and handle API;
- the replacement-provider API for storage providers.

Use the store API for application code. Use the provider API only when implementing a storage backend that replaces the default file-backed provider.

## Store behavior

The store imports JSON streams, lists ready prepared documents, opens read handles, and deletes documents when no handles are active.

## Handle behavior

A handle exposes source range reads, literal search, and streaming export for the revision it opened. The handle does not expose physical file paths as its public contract.
