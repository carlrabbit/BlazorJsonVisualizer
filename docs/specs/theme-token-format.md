# Theme Token Format

## Goal

Define the public JSON contract for BlazorJsonVisualizer themes.

## Scope

This spec defines:

- theme JSON document shape;
- required fields;
- token naming rules;
- plugin-local token structure;
- validation behavior;
- public compatibility expectations.

## Non-Goals

This spec does not define:

- a .NET object theme API;
- light theme parity;
- CSS generation internals;
- permanent final token values.

## Public Contract

Theme JSON is a public extension contract immediately.

Breaking changes to the theme JSON format must be intentional, documented, and reflected in public documentation.

## Host Input Rule

Host applications provide theme tokens as JSON only.

The first milestone must not introduce a parallel .NET object-token API.

A Blazor host may expose parameters such as:

```csharp
[Parameter]
public string? ThemeJson { get; set; }
```

The exact API name is implementation-defined, but the theme payload contract is JSON.

## Required Theme Shape

A theme document must use this shape:

```json
{
  "schemaVersion": "1.0",
  "id": "technical-calm-dark",
  "name": "Technical Calm Dark",
  "mode": "dark",
  "tokens": {
    "color.canvas.background": "#0f1117",
    "color.surface.background": "#151923",
    "color.text.primary": "#e6e8ee"
  },
  "plugins": {
    "example.tableProjection": {
      "tokens": {
        "color.row.metricPositive.foreground": "#9ece6a"
      }
    }
  }
}
```

## Required Fields

| Field | Required | Purpose |
|---|---:|---|
| `schemaVersion` | Yes | Theme contract version. |
| `id` | Yes | Stable theme identifier. |
| `name` | Yes | Human-readable theme name. |
| `mode` | Yes | Theme mode. First milestone supports only `dark`. |
| `tokens` | Yes | Shared semantic token map. |
| `plugins` | No | Plugin-local token map keyed by plugin identifier. |

## Theme Mode

The only supported `mode` value in this milestone is:

```json
"dark"
```

Implementations must reject or clearly report unsupported modes such as `light` or `system` during this milestone.

## Token Value Types

The first milestone supports string token values only.

Valid string values may include:

- CSS color strings;
- CSS length strings;
- CSS font-family strings;
- CSS font-weight strings;
- CSS duration strings.

The token namespace determines expected meaning.

## Shared Token Naming Rules

Shared tokens must use dot-separated semantic names.

Preferred namespaces:

```text
color.*
space.*
radius.*
border.*
font.*
shadow.*
motion.*
layer1.*
layer2.*
layer3.*
syntax.*
state.*
focus.*
selection.*
```

Avoid implementation-only names such as:

```text
blue500
leftPanelGray
magicBorderColor
```

## Required Shared Tokens

The default theme must define at least:

```text
color.canvas.background
color.surface.background
color.surface.elevated.background
color.border.default
color.border.subtle
color.text.primary
color.text.secondary
color.text.muted
color.focus.ring
color.selection.background
color.selection.foreground
syntax.property.foreground
syntax.string.foreground
syntax.number.foreground
syntax.boolean.foreground
syntax.null.foreground
syntax.punctuation.foreground
syntax.invalid.foreground
state.error.foreground
state.error.background
state.warning.foreground
state.warning.background
state.info.foreground
state.info.background
state.suggestion.foreground
layer1.activePath.background
layer1.row.hover.background
layer1.fold.control.foreground
layer2.schemaHint.foreground
layer2.validationMarker.error
layer2.validationMarker.warning
layer3.projection.selection.background
layer3.projection.sourceLink.foreground
font.ui.family
font.mono.family
space.1
space.2
space.3
radius.1
radius.2
```

## Plugin-Local Tokens

Plugins may define plugin-local tokens immediately.

Plugin-local tokens must be scoped under:

```json
{
  "plugins": {
    "plugin.identifier": {
      "tokens": {
        "plugin.token.name": "value"
      }
    }
  }
}
```

Plugin identifiers must be stable strings.

Plugin-local token names must not be merged into the shared namespace.

A plugin may consume shared tokens as fallbacks.

## Validation Behavior

The implementation must validate:

- JSON parseability;
- required fields;
- supported `schemaVersion`;
- supported `mode`;
- presence of `tokens`;
- token value type is string;
- plugin token objects are valid maps.

Validation errors must be visible in the Blazor visual identity playground.

## Export Behavior

The playground must export normalized JSON.

Exported JSON must preserve:

- `schemaVersion`;
- `id`;
- `name`;
- `mode`;
- shared tokens;
- plugin-local tokens.

Formatting may be normalized.

## Authority

This document is authoritative for:

- theme JSON contract;
- token naming rules;
- plugin-local token structure;
- theme validation expectations.

This document is not authoritative for:

- final theme aesthetics;
- visual identity layer semantics;
- internal CSS implementation.

## Document Contract

When this spec changes, review and update:

- docs/specs/visual-identity.md
- docs/specs/visual-identity-playground.md
- public-docs/concepts.md
- public-docs/samples/visual-identity-playground.md
- public-docs/release-notes.md
