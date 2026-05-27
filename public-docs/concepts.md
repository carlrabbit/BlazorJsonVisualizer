# Concepts

## Status

Current as a placeholder.

This surface defines consumer-facing concepts at a high level and will expand as public APIs are finalized.

## Themes

BlazorJsonVisualizer themes are JSON documents that provide semantic design-token values.

Themes are a public extension contract.

The first supported mode is dark mode.

Host applications provide theme tokens as JSON.

The first milestone does not provide a parallel .NET object model for theme tokens.

Plugins may define plugin-local tokens under their plugin identifier.

See:

- public-docs/samples/visual-identity-playground.md
