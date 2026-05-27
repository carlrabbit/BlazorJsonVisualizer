# Visual Identity

## Goal

Define the visual semantics for the default BlazorJsonVisualizer identity across Layer 1, Layer 2, and Layer 3.

## Scope

This spec defines:

- default visual identity principles;
- dark-only first milestone behavior;
- layer-specific visual roles;
- semantic design-token categories;
- required visual states;
- plugin visual consistency rules;
- validation expectations.

## Non-Goals

This spec does not define:

- exact permanent colors;
- light theme parity;
- CSS implementation mechanics;
- screenshot regression testing;
- full Layer 1, Layer 2, or Layer 3 behavior.

## Design Direction

The default identity is:

```text
Technical calm.
```

This means:

- dense but not cramped;
- precise but not harsh;
- dark-only first;
- restrained syntax colors;
- strong hierarchy and indentation cues;
- subtle panels;
- clear focus, selection, validation, and projection states;
- minimal decorative branding;
- suitable for public library and enterprise use.

## Layer 1 Visual Role

Layer 1 is the base structured JSON inspection surface.

Layer 1 must prioritize:

- syntax legibility;
- document hierarchy;
- indentation depth;
- fold state;
- active path;
- row hover;
- selection;
- search result state;
- invalid token state.

Layer 1 must remain restrained and technical.

## Layer 2 Visual Role

Layer 2 adds schema-aware semantic overlays.

Layer 2 must prioritize:

- validation errors;
- validation warnings;
- schema hints;
- schema documentation;
- required and optional property indicators;
- enum/value suggestions;
- safe and destructive schema-aware actions.

Layer 2 may use stronger semantic colors than Layer 1, but only to communicate meaning.

## Layer 3 Visual Role

Layer 3 adds projection plugins.

Layer 3 must prioritize:

- source/projection synchronization;
- selected source path;
- plugin capability state;
- plugin error state;
- table projection states;
- statistics/projection summary states.

Layer 3 may be visually richer than Layer 1 and Layer 2, but it must use the shared token contract and remain visually connected to the editor.

## Required Shared States

The visual identity must define token coverage for:

- normal background;
- panel background;
- elevated surface;
- primary text;
- secondary text;
- muted text;
- border;
- subtle border;
- focus ring;
- active row;
- hovered row;
- selected row;
- active path;
- syntax property;
- syntax string;
- syntax number;
- syntax boolean;
- syntax null;
- syntax punctuation;
- syntax invalid;
- search match;
- validation error;
- validation warning;
- informational hint;
- suggestion;
- destructive action;
- safe action.

## Plugin Token Rule

Plugins may define plugin-local tokens immediately.

Plugin-local tokens must:

- be namespaced by plugin identifier;
- declare fallback shared tokens;
- not override unrelated shared tokens implicitly;
- not require host applications to load plugin CSS outside the token system for basic visual integration.

## Theme Mode Rule

The first milestone supports dark mode only.

Light theme parity is deferred until Layer 1 stabilizes.

The theme JSON must still declare its mode explicitly as `dark`.

## Accessibility Baseline

The first milestone must avoid obviously inaccessible defaults.

Implementation must prefer:

- readable foreground/background contrast;
- visible focus indicators;
- non-color-only state where practical;
- stable state naming that allows future accessibility review.

Full accessibility certification is not required in this milestone.

## Validation

The visual identity is valid when:

- the visual identity playground renders representative Layer 1, Layer 2, and Layer 3 states;
- the default dark theme can be loaded from JSON;
- shared and plugin-local tokens are visible in the sample;
- the sample participates in sample validation;
- the sample participates in release validation;
- screenshot regression tests are not required.

## Authority

This document is authoritative for:

- visual identity principles;
- layer-specific visual semantics;
- required visual states;
- plugin visual token expectations.

This document is not authoritative for:

- theme JSON schema details;
- runtime behavior outside visual presentation;
- permanent color values after future design iteration.

## Document Contract

When this spec changes, review and update:

- docs/specs/theme-token-format.md
- docs/specs/visual-identity-playground.md
- docs/decisions/0005-token-based-visual-identity.md
- public-docs/concepts.md
- public-docs/samples/visual-identity-playground.md
