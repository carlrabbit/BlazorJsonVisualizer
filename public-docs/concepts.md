# Concepts

## Status

Preview.

This surface defines consumer-facing concepts at a high level. Supported behavior and planned behavior are separated as public APIs stabilize.

## Themes

### Supported now

BlazorJsonVisualizer themes are JSON documents that provide semantic design-token values.

Themes are a public extension contract.

The first supported mode is dark mode.

Host applications provide theme tokens as JSON.

Plugins may define plugin-local tokens under their plugin identifier.

See:

- public-docs/samples/visual-identity-playground.md

### Planned

The first milestone does not provide a parallel .NET object model for theme tokens.

## Prepared Documents

### Preview workflow

For huge JSON workflows, BlazorJsonVisualizer imports a raw JSON source into a prepared document before interactive operations.

A prepared document stores source representation, derived index metadata, and transaction-log state so the document can be reopened and exported without reparsing raw source from scratch on every interaction.

Prepared-document storage details are internal. Consumers should use the prepared document store and handle APIs rather than relying on physical file names.

See:

- public-docs/guides/huge-json-documents.md

### Current limits

Prepared-document APIs and docs are preview surfaces while package publication is planned.
