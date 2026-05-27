# Milestone 0010 — Visual Identity System and Theme Playground

## Status

Draft milestone issue content.

This document is intended to be uploaded to:

```text
docs/milestones/milestone-0010-visual-identity-system-and-theme-playground.md
```

## Goal

Create the first default visual identity system for BlazorJsonVisualizer and a maintained Blazor-based theme iteration playground.

The milestone does **not** finalize the permanent product design. It creates the technical, documentation, and sample infrastructure required to iterate on the design safely across Layer 1, Layer 2, and Layer 3.

The milestone implements the accepted direction from:

```text
docs/research/visual-identity-direction.md
```

The accepted direction is:

```text
Technical calm.
```

The first visual identity milestone is dark-only, token-based, JSON-configured, and validated through a sample that renders representative Layer 1, Layer 2, and Layer 3 states.

## Scope

This milestone covers:

- the default dark theme direction;
- a public JSON theme-token contract;
- plugin-local theme tokens from the first implementation;
- a Blazor-based token editing playground;
- representative Layer 1, Layer 2, and Layer 3 sample states;
- theme import, editing, switching, validation, preview, and export;
- public documentation for theme JSON usage;
- sample validation and release validation integration;
- repository documentation updates required by the new visual identity system.

## Non-Goals

This milestone does **not** cover:

- light theme parity;
- final permanent visual design approval;
- screenshot regression tests;
- full Layer 1 runtime rendering completion;
- full Layer 2 schema behavior;
- full Layer 3 plugin runtime behavior;
- a .NET object model for theme tokens;
- a general-purpose design system package independent of this editor;
- adopting an external component library;
- replacing behavioral specs for Layer 1, Layer 2, or Layer 3.

## Required Decisions

This milestone implements the following decisions:

1. The first visual identity milestone is dark-only.
2. Token editing is implemented in Blazor.
3. Theme JSON is a public extension contract immediately.
4. Plugins may define plugin-local tokens immediately.
5. Screenshot regression tests are deferred.
6. The visual identity sample is included in both sample validation and release validation.
7. Host applications provide theme tokens as JSON only.

## Required Documents to Create or Update

The implementation must create or update the following documents.

```text
docs/milestones/milestone-0010-visual-identity-system-and-theme-playground.md
docs/research/visual-identity-direction.md
docs/RESEARCH.md
docs/specs/visual-identity.md
docs/specs/theme-token-format.md
docs/specs/visual-identity-playground.md
docs/SPECS.md
docs/decisions/0005-token-based-visual-identity.md
docs/DECISIONS.md
docs/TERMINOLOGY.md
docs/engineering/samples.md
docs/engineering/release-readiness.md
docs/workflows/release-check.md
docs/PUBLIC-DOCS.md
public-docs/concepts.md
public-docs/samples.md
public-docs/samples/visual-identity-playground.md
public-docs/release-notes.md
```

If some documents already exist, update them rather than replacing unrelated content.

## Document TODOs with Proposed Content

### TODO — Create or Update `docs/research/visual-identity-direction.md`

Use the accepted research draft as the source.

Required content summary:

```md
# Visual Identity Direction Research Draft

## Status

Research draft.

This document is non-authoritative. It preserves exploratory design direction for the BlazorJsonVisualizer visual identity and should be promoted into architecture, decisions, specs, milestones, guardrails, public documentation, and implementation only after review.

## Accepted Direction

The default visual identity direction is:

```text
Technical calm.
```

## Accepted Open-Question Resolutions

- The first milestone is dark-only.
- Token editing is implemented in Blazor.
- Theme JSON is a public extension contract immediately.
- Plugins may define plugin-local tokens immediately.
- Screenshot regression tests are deferred.
- The visual identity sample participates in sample validation and release validation.
- Host applications provide theme tokens as JSON only.

## Promotion Targets

Stable conclusions from this research are promoted into:

- docs/specs/visual-identity.md
- docs/specs/theme-token-format.md
- docs/specs/visual-identity-playground.md
- docs/decisions/0005-token-based-visual-identity.md
- docs/milestones/milestone-0010-visual-identity-system-and-theme-playground.md
- public-docs/concepts.md
- public-docs/samples/visual-identity-playground.md
```

The research document may include the full visual direction draft, but the authoritative rules must live in specs and decisions after this milestone is implemented.

### TODO — Update `docs/RESEARCH.md`

Add the visual identity research document.

Proposed entry:

```md
| research/visual-identity-direction.md | Non-authoritative research for the default visual identity, theme-token model, and visual identity playground across Layer 1, Layer 2, and Layer 3. |
```

Also ensure that `docs/RESEARCH.md` states that research is non-authoritative unless promoted into specs, decisions, milestones, guardrails, engineering docs, workflows, or public docs.

### TODO — Create `docs/specs/visual-identity.md`

Proposed content:

```md
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
```

### TODO — Create `docs/specs/theme-token-format.md`

Proposed content:

```md
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
```

### TODO — Create `docs/specs/visual-identity-playground.md`

Proposed content:

```md
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
samples/VisualIdentity
```

The exact project name should follow repository sample naming conventions.

## Fixed Port

Assign the sample a fixed port that does not conflict with existing samples.

Recommended port:

```text
5150
```

Update the sample index and launcher scripts accordingly.

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
```

### TODO — Create `docs/decisions/0005-token-based-visual-identity.md`

Proposed content:

```md
# 0005 — Token-Based Visual Identity

## Status

Accepted.

## Context

BlazorJsonVisualizer needs a coherent visual identity across a structured JSON viewer, schema-aware overlays, and projection plugins.

The visual identity must be iterable, host-configurable, and suitable for a public Blazor component library.

Layer 3 plugins are expected to become a major part of the library, so the visual identity must support plugin-local tokens from the start.

## Decision

BlazorJsonVisualizer defines visual identity through semantic design tokens supplied as JSON.

Theme JSON is a public extension contract immediately.

The first milestone supports dark mode only.

Token editing is implemented in a Blazor sample playground.

Host applications provide theme tokens as JSON only.

Plugins may define plugin-local tokens immediately.

Screenshot regression testing is deferred until runtime rendering stabilizes.

The visual identity sample participates in both sample validation and release validation.

## Consequences

- Theme JSON requires public documentation and compatibility discipline.
- The runtime must consume theme JSON without requiring a .NET object-token API.
- Plugin token namespaces must be supported early.
- The visual identity can be iterated through a maintained sample instead of prose alone.
- Light theme support is intentionally deferred.
- Screenshot regression tests are not a prerequisite for this milestone.

## Related Documents

- docs/research/visual-identity-direction.md
- docs/specs/visual-identity.md
- docs/specs/theme-token-format.md
- docs/specs/visual-identity-playground.md
```

### TODO — Update `docs/DECISIONS.md`

Add:

```md
| decisions/0005-token-based-visual-identity.md | Accepts semantic JSON design tokens as the public visual identity contract and defines the first dark-only visual identity playground direction. |
```

### TODO — Update `docs/SPECS.md`

Add:

```md
| specs/visual-identity.md | Visual identity semantics across Layer 1, Layer 2, and Layer 3. |
| specs/theme-token-format.md | Public JSON contract for shared and plugin-local theme tokens. |
| specs/visual-identity-playground.md | Required behavior and validation rules for the Blazor visual identity playground sample. |
```

### TODO — Update `docs/MILESTONES.md`

Add:

```md
| milestones/milestone-0010-visual-identity-system-and-theme-playground.md | Draft | Creates the first dark-only token-based visual identity system and Blazor theme playground. |
```

Adjust the status according to repository conventions when the milestone is accepted or implemented.

### TODO — Update `docs/TERMINOLOGY.md`

Add or revise terms:

```md
### Visual Identity
The visual semantics, token model, and representative states that define how BlazorJsonVisualizer presents structure, schema information, and projections.

### Theme
A JSON document that supplies semantic design-token values to BlazorJsonVisualizer.

### Theme Token
A named semantic visual value from a theme JSON document.

### Shared Theme Token
A theme token available to the core editor layers and plugins.

### Plugin-Local Theme Token
A token scoped to a specific plugin identifier and used by that plugin for projection-specific presentation.

### Visual Identity Playground
A maintained Blazor sample used to import, edit, validate, preview, and export theme JSON across representative Layer 1, Layer 2, and Layer 3 states.

### Technical Calm
The default visual identity direction: dense, precise, restrained, dark-first, and suitable for structured-data inspection.
```

### TODO — Update `docs/engineering/samples.md`

Add the visual identity sample.

Proposed content:

```md
## Visual Identity Sample

Path:

```text
samples/VisualIdentity
```

Purpose:

The Visual Identity sample is the maintained Blazor playground for theme JSON import, token editing, validation, preview, and export.

Fixed port:

```text
5150
```

Rules:

- The sample must build through the canonical sample command.
- The sample must be included in sample validation.
- The sample must be included in release validation.
- The sample must not introduce screenshot regression tests in this milestone.
- The sample must not define a parallel .NET object-token API.
```

### TODO — Update `docs/engineering/release-readiness.md`

Add:

```md
## Visual Identity Release Validation

The visual identity sample is part of release validation.

Release validation must verify that:

- samples/VisualIdentity builds;
- the sample is reachable through the fixed-port sample launcher setup;
- default theme JSON is present;
- the sample can load and export theme JSON;
- public documentation references the visual identity sample and theme JSON contract.

Screenshot regression tests are deferred and are not part of this milestone's release gate.
```

### TODO — Update `docs/workflows/release-check.md`

Add:

```md
## Visual Identity Sample

The release-check workflow must include the Visual Identity sample through the canonical sample validation command.

The workflow must not require screenshot regression tests for this milestone.

When visual identity validation changes, review:

- docs/specs/visual-identity-playground.md
- docs/engineering/samples.md
- docs/engineering/release-readiness.md
- public-docs/samples/visual-identity-playground.md
```

### TODO — Update `docs/PUBLIC-DOCS.md`

Add the public theme contract and visual identity sample surfaces.

Proposed entries:

```md
| Theme JSON contract | public-docs/concepts.md |
| Visual identity sample | public-docs/samples/visual-identity-playground.md |
```

Add synchronization rule:

```md
When the theme JSON contract changes, review and update:

- docs/specs/theme-token-format.md
- public-docs/concepts.md
- public-docs/samples/visual-identity-playground.md
- public-docs/release-notes.md
```

### TODO — Update `public-docs/concepts.md`

Add:

```md
## Themes

BlazorJsonVisualizer themes are JSON documents that provide semantic design-token values.

Themes are a public extension contract.

The first supported mode is dark mode.

Host applications provide theme tokens as JSON.

The first milestone does not provide a parallel .NET object model for theme tokens.

Plugins may define plugin-local tokens under their plugin identifier.

See:

- public-docs/samples/visual-identity-playground.md
```

### TODO — Update `public-docs/samples.md`

Add:

```md
| Visual Identity Playground | Demonstrates theme JSON import, Blazor token editing, validation, preview, and export across representative Layer 1, Layer 2, and Layer 3 states. |
```

### TODO — Create `public-docs/samples/visual-identity-playground.md`

Proposed content:

```md
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
```

### TODO — Update `public-docs/release-notes.md`

Add a draft entry:

```md
## Unreleased

### Added

- Added the first visual identity system for BlazorJsonVisualizer.
- Added the public JSON theme-token contract.
- Added plugin-local theme token support.
- Added the Visual Identity Playground sample for theme import, editing, validation, preview, and export.
```

## Implementation Requirements

### Theme JSON Runtime Support

Implement enough runtime support to:

- parse theme JSON;
- validate the required fields;
- reject unsupported modes;
- expose validation diagnostics to the Blazor sample;
- resolve shared token values;
- resolve plugin-local token values;
- export normalized theme JSON.

The runtime does not need to implement a full CSS-in-JS system.

### Blazor Theme Editor

Implement the token editing experience in Blazor.

The Blazor sample must:

- load the default dark theme JSON;
- allow editing JSON source;
- allow editing representative tokens through form controls;
- show validation errors;
- preview updates;
- export normalized JSON.

The Blazor host must not require host applications to construct a .NET object model for tokens.

### Default Theme

Create a default theme file.

Recommended path:

```text
src/runtime/runtime-core/src/theme/defaultTheme.dark.json
```

or another documented location if the repository uses a different asset convention.

The default theme must be dark mode.

### Visual Identity Sample

Create:

```text
samples/VisualIdentity
```

The sample must:

- use fixed port `5150` unless that conflicts with existing repository assignments;
- appear in the static sample index;
- be launchable with the sample launcher setup;
- be included in sample validation;
- be included in release validation.

### Representative Preview States

The sample must display all required preview states from `docs/specs/visual-identity-playground.md`.

When runtime features are incomplete, use visually representative placeholders.

Placeholders must be marked as preview scenarios and must not imply completed runtime behavior.

### Sample Index and Launcher

Update sample infrastructure so the Visual Identity sample is discoverable.

Required updates may include:

```text
samples/SAMPLES.md
samples/index.html
eng/samples.sh
.devcontainer samples launcher configuration
release-check sample validation path
```

Use actual repository file names if they differ.

## Testing and Validation

### Required Fast Validation

Run the minimal relevant validation defined by repository engineering docs.

Expected validation categories:

- TypeScript theme parser/unit tests if the parser is TypeScript;
- .NET/Blazor component tests if available and appropriate;
- build validation for the Visual Identity sample;
- sample validation command;
- public docs validation if present;
- release validation path includes the sample.

### Required Test Coverage

Add short-running tests for:

- valid default theme JSON parses;
- missing required fields fail validation;
- unsupported `mode` fails validation;
- plugin-local token objects parse;
- non-string token values fail validation;
- normalized export preserves shared and plugin-local tokens.

### Explicitly Deferred Validation

Do not add required screenshot regression tests in this milestone.

Screenshot regression can be introduced later after runtime rendering stabilizes.

## Acceptance Criteria

The milestone is complete when:

- `docs/research/visual-identity-direction.md` exists or is updated with the accepted direction;
- `docs/RESEARCH.md` indexes the research document;
- `docs/specs/visual-identity.md` exists;
- `docs/specs/theme-token-format.md` exists;
- `docs/specs/visual-identity-playground.md` exists;
- `docs/SPECS.md` indexes the new specs;
- `docs/decisions/0005-token-based-visual-identity.md` exists;
- `docs/DECISIONS.md` indexes the decision;
- `docs/TERMINOLOGY.md` includes the visual identity and theme terms;
- `docs/MILESTONES.md` indexes this milestone;
- the default dark theme JSON exists;
- theme JSON is treated as a public contract;
- host theme input is JSON-only;
- plugin-local tokens are supported by the theme format;
- the Blazor Visual Identity sample exists;
- the sample supports JSON import, token editing, validation, preview, and export;
- the sample renders representative Layer 1, Layer 2, and Layer 3 states;
- the sample uses a fixed port;
- the sample is linked from the static sample index;
- sample validation includes the Visual Identity sample;
- release validation includes the Visual Identity sample;
- public docs describe the theme JSON contract and visual identity sample;
- screenshot regression tests are not required for completion;
- canonical repository validation passes or failures are documented with exact failing commands.

## Risks

### Risk — Theme JSON becomes too broad too early

Mitigation:

- keep token values string-based;
- require only the minimum shared token set;
- allow future schema versions.

### Risk — Blazor editor duplicates runtime theme logic

Mitigation:

- Blazor owns editing UI;
- runtime owns parsing, validation, resolution, and preview consumption where applicable.

### Risk — Plugin-local tokens become ungoverned

Mitigation:

- require plugin identifier namespace;
- keep plugin-local tokens separate from shared tokens;
- require fallback behavior where practical.

### Risk — Visual sample implies unsupported runtime behavior

Mitigation:

- mark mocked Layer 2 and Layer 3 states as visual preview scenarios;
- do not describe mocked behavior as completed runtime functionality.

## Implementation Notes

- Keep the first implementation boring and explicit.
- Prefer static token groups over dynamic token editor abstractions.
- Avoid adding a design framework.
- Avoid broad refactoring of existing samples.
- Avoid screenshot testing until a later milestone.
- Prefer a stable JSON contract over a rich .NET theme object model.

## Related Research

```text
docs/research/visual-identity-direction.md
```

## Related Existing Milestones

This milestone complements the Layer 1, Layer 2, Layer 3, sample-hosting, and release-readiness work. It must not replace those milestones.

## Authority

This document is authoritative for:

- milestone scope;
- milestone deliverables;
- milestone acceptance criteria;
- required document creation/update work for this milestone.

This document is not authoritative for:

- permanent visual design values after future iteration;
- complete Layer 1 behavior;
- complete Layer 2 behavior;
- complete Layer 3 behavior;
- repository-wide engineering command contracts.

## Document Contract

When this milestone changes, review and update:

- docs/MILESTONES.md
- docs/research/visual-identity-direction.md
- docs/specs/visual-identity.md
- docs/specs/theme-token-format.md
- docs/specs/visual-identity-playground.md
- docs/decisions/0005-token-based-visual-identity.md
- docs/engineering/samples.md
- docs/engineering/release-readiness.md
- docs/workflows/release-check.md
- docs/PUBLIC-DOCS.md
- public-docs/samples/visual-identity-playground.md
