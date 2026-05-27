# Visual Identity Playground

## Purpose

The Visual Identity Playground demonstrates how theme JSON affects BlazorJsonVisualizer visual states.

It is intended for theme iteration and visual review.

## What It Shows

The sample shows representative states for:

- Layer 1 structured JSON viewing;
- Layer 2 schema overlays;
- Layer 3 projection plugins.

## Theme Editing

Theme editing is provided by the Blazor sample shell.

Users can:

- import theme JSON;
- edit shared tokens;
- edit plugin-local tokens;
- validate the theme;
- preview changes;
- export normalized theme JSON.

## Theme Contract

Theme JSON is a public extension contract.

The first supported mode is:

```json
"dark"
```

Host applications provide theme tokens as JSON.

## Plugin Tokens

Plugins may define plugin-local tokens under their plugin identifier.

## Validation

The sample participates in sample validation and release validation.

Screenshot regression tests are deferred for the first milestone.
