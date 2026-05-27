# Visual Identity Playground

## Goal

Define the maintained Blazor sample used to iterate on the BlazorJsonVisualizer visual identity.

## Scope

The playground must provide:

- a Blazor-based theme editor;
- JSON import;
- JSON validation;
- token editing;
- theme switching;
- JSON export;
- representative Layer 1, Layer 2, and Layer 3 preview states;
- plugin-local token preview;
- participation in sample validation and release validation.

## Non-Goals

The playground does not provide:

- screenshot regression tests;
- final product design approval;
- full runtime feature parity;
- full Layer 2 schema implementation;
- full Layer 3 plugin implementation;
- a .NET object theme API.

## Sample Location

Use:

```text
samples/BlazorJsonVisualizer.VisualIdentitySample
```

## Fixed Port

The sample uses fixed port:

```text
5150
```

## Blazor Ownership

Token editing must be implemented in Blazor.

The TypeScript runtime may consume the resolved JSON theme and render previews, but the editing experience belongs to the Blazor sample shell.

## Required Playground Areas

The sample must include:

1. Theme source panel
2. Token editor panel
3. Validation panel
4. Export panel
5. Layer 1 preview section
6. Layer 2 preview section
7. Layer 3 preview section
8. Plugin-local token preview section

## Theme Source Panel

The theme source panel must allow users to paste or load theme JSON.

It must show parse and validation errors clearly.

## Token Editor Panel

The token editor panel must allow editing of representative shared tokens and plugin-local tokens.

The first implementation may use simple input fields grouped by namespace.

It does not need a sophisticated design-token editor.

## Export Panel

The export panel must allow users to copy normalized theme JSON.

The exported JSON must remain valid according to `docs/specs/theme-token-format.md`.

## Layer 1 Preview Requirements

The Layer 1 preview must show representative states:

- normal JSON object;
- nested object/array;
- folded object;
- folded array;
- active path;
- selected row;
- hovered row;
- search match;
- invalid token.

Runtime placeholders are acceptable where Layer 1 is not fully implemented, but placeholders must be visually representative and must not fake unsupported runtime behavior as production behavior.

## Layer 2 Preview Requirements

The Layer 2 preview must show representative states:

- schema hint;
- validation error;
- validation warning;
- required property indicator;
- optional property indicator;
- enum/value suggestion;
- schema-aware action;
- destructive action warning.

Layer 2 behavior may be mocked visually in this milestone.

## Layer 3 Preview Requirements

The Layer 3 preview must show representative states:

- table projection;
- selected projection row;
- source JSON path link;
- statistics card;
- plugin capability indicator;
- plugin-local token usage;
- plugin warning or error state.

Layer 3 behavior may be mocked visually in this milestone.

## Screenshot Regression Rule

Screenshot regression tests are deferred.

The implementation must not introduce mandatory screenshot regression tooling in this milestone.

Manual visual review through the sample is sufficient for this milestone.

## Validation

The sample is valid when:

- it builds;
- it has a fixed port;
- it appears in the static sample index;
- it is included in sample launcher scripts;
- it is included in sample validation;
- it is included in release validation;
- default theme JSON loads;
- invalid theme JSON reports validation errors;
- exported theme JSON is valid;
- representative Layer 1, Layer 2, and Layer 3 states are visible.

## Authority

This document is authoritative for:

- visual identity playground behavior;
- required preview states;
- validation expectations for the playground sample.

This document is not authoritative for:

- final visual design values;
- complete Layer 1, Layer 2, or Layer 3 behavior;
- screenshot regression policy beyond this milestone.

## Document Contract

When this spec changes, review and update:

- docs/specs/visual-identity.md
- docs/specs/theme-token-format.md
- docs/engineering/samples.md
- docs/engineering/release-readiness.md
- docs/workflows/release-check.md
- public-docs/samples/visual-identity-playground.md
