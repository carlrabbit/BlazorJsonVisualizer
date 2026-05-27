# Visual Identity Direction Research Draft

## Status

Research draft.

This document is non-authoritative. It preserves exploratory design direction for the BlazorJsonVisualizer visual identity and should be promoted into architecture, decisions, specs, milestones, guardrails, public documentation, and implementation only after review.

## Purpose

This research draft explores a default visual identity for BlazorJsonVisualizer across:

- Layer 1: large JSON viewing, navigation, folding, search, and controlled text-oriented interaction;
- Layer 2: JSON Schema overlays, validation, hints, schema-aware actions, and guided editing;
- Layer 3: projection plugins that present JSON through alternate views such as tables, statistics, or domain-specific visualizations.

The goal is not to finalize the permanent design. The goal is to define a coherent direction and a practical design-token/playground workflow so the visual identity can be iterated with representative states instead of discussed only in prose.

## Project Context

BlazorJsonVisualizer is a Blazor-facing package around a standalone TypeScript browser runtime for structured JSON visualization, navigation, and eventually editing.

The visual identity must support this architecture:

```text
Blazor host
  -> TypeScript browser runtime
    -> Layer 1 structured JSON view
    -> Layer 2 schema overlays
    -> Layer 3 projection plugins
```

The visual identity must therefore serve both:

- a low-level structured-data instrument; and
- a public Blazor component surface that should feel stable, reusable, and professional.

## Relationship to Repository Standards

This research belongs under:

```text
docs/research/visual-identity-direction.md
```

It is not authoritative by itself.

If accepted, stable conclusions should be promoted into:

```text
docs/specs/visual-identity.md
docs/specs/theme-token-format.md
docs/decisions/0005-token-based-visual-identity.md
docs/milestones/<visual-identity-milestone>.md
public-docs/concepts.md
public-docs/samples.md
public-docs/samples/<visual-identity-sample>.md
```

The visual identity should also be validated through a maintained sample app, because samples are executable documentation for this repository style.

## Design Thesis

The default identity should be:

```text
Technical calm.
```

This means:

- dense, but not cramped;
- precise, but not visually harsh;
- dark-mode first, light-mode supported;
- restrained syntax colors;
- strong hierarchy and indentation cues;
- subtle panels rather than heavy boxes;
- clear focus, selection, validation, and semantic-state visuals;
- minimal decorative branding;
- stable and boring enough for enterprise/library use;
- distinctive enough not to look like an unmodified VS Code or dashboard clone.

The editor should feel like a structured-data instrument, not like a generic code editor, form builder, or analytics dashboard.

## Non-Goals

This research does not attempt to:

- finalize exact colors;
- finalize typography;
- define CSS implementation details;
- define permanent component APIs;
- define the full plugin design system;
- create a branding package;
- introduce a heavy design framework;
- choose a frontend component library;
- prescribe a canvas/SVG/DOM rendering strategy;
- replace Layer 1, Layer 2, or Layer 3 behavioral specs.

## Visual Principles

### 1. Structure before decoration

JSON hierarchy is the primary visual object.

The design should emphasize:

- depth;
- containment;
- active path;
- fold boundaries;
- node identity;
- source/projection synchronization.

Decoration should be secondary.

### 2. State color before brand color

Color should primarily communicate:

- syntax;
- selection;
- focus;
- validation;
- schema information;
- projection state;
- destructive/safe action state.

Brand/accent color should be used sparingly.

### 3. Layer progression

The layers should become visually richer from Layer 1 to Layer 3:

```text
Layer 1: restrained, dense, technical
Layer 2: assisted, semantic, informative
Layer 3: exploratory, projected, domain-oriented
```

The layers must still feel like one product.

### 4. Token-first implementation

Visual identity should be expressed through semantic design tokens, not scattered CSS values.

Tokens should describe meaning, not implementation trivia.

Prefer:

```text
color.layer1.activePath.background
color.schema.validation.error.foreground
color.projection.table.rowSelected.background
```

Avoid:

```text
blue500
leftPanelGray
magicBorderColor
```

### 5. Preview through representative states

The visual identity must be validated through a visual identity playground that renders representative Layer 1, Layer 2, and Layer 3 states on one page.

Do not judge the theme from a single happy-path JSON snippet.

## Product Personality

The identity should communicate:

| Trait | Meaning |
|---|---|
| Precise | JSON structure, offsets, paths, and schemas are treated as exact data. |
| Calm | The UI does not shout unless there is validation or data risk. |
| Dense | Large documents require high information density. |
| Trustworthy | The tool must be suitable for technical and enterprise use. |
| Instrument-like | It should feel like an inspection and manipulation instrument. |
| Extensible | Layer 3 plugins should fit without each looking like a separate app. |

The identity should avoid:

| Avoid | Reason |
|---|---|
| Playful SaaS dashboard look | Too broad and insufficiently technical. |
| Unmodified IDE clone | Too text-editor-centric and misleading. |
| Heavy enterprise form UI | Too slow and form-centric for large JSON navigation. |
| Bright neon terminal style | Fatiguing for dense documents. |
| Overdesigned branding | Distracts from structured-data work. |

## Layer 1 Direction

### Visual Role

Layer 1 is the base inspection surface.

It should optimize for:

- huge JSON viewing;
- syntax legibility;
- structural navigation;
- fold state clarity;
- active path visibility;
- low visual noise;
- predictable scrolling and selection.

### Desired Feel

```text
precise
technical
quiet
stable
dense
fast
```

### Core Visual Elements

Layer 1 needs tokens and representative states for:

- editor canvas background;
- row background;
- row hover;
- active row;
- active path;
- selected text range;
- selected structural node;
- syntax tokens;
- indentation guides;
- fold affordances;
- folded object placeholder;
- folded array placeholder;
- search match;
- current search match;
- invalid token;
- dirty range;
- focused editor boundary;
- optional minimap/structure rail placeholder.

### Suggested Layer 1 Style

Use:

- monospace text for JSON;
- subtle indentation guides;
- low-contrast grid/row background only when helpful;
- thin focus outlines;
- one strong active-path cue;
- syntax colors that remain readable on dark and light backgrounds.

Avoid:

- heavy boxes around every node;
- colorful indentation by default;
- excessive line decorations;
- animation during navigation;
- making JSON look like a form.

### Layer 1 Representative Scenarios

The visual identity playground should show:

1. Small object with mixed primitive values.
2. Deeply nested object with active path.
3. Large array with folded child objects.
4. Folded root object.
5. Folded nested array.
6. Selected string value.
7. Selected structural node.
8. Search result and current search result.
9. Invalid token or parse error range.
10. Horizontal overflow / long string.
11. Dirty edited primitive value placeholder.
12. Empty document / no document state.

## Layer 2 Direction

### Visual Role

Layer 2 overlays schema meaning onto the Layer 1 JSON structure.

It should optimize for:

- schema-aware explanation;
- validation;
- suggestions;
- safe guided edits;
- semantic hover content;
- discovering what a property means;
- understanding required/optional state.

### Desired Feel

```text
assisted
semantic
informative
controlled
source-connected
```

### Core Visual Elements

Layer 2 needs tokens and representative states for:

- schema hint underline/marker;
- schema hover card;
- required property indicator;
- optional property indicator;
- deprecated property indicator;
- enum suggestion list;
- validation error;
- validation warning;
- validation info;
- quick action/refactoring affordance;
- schema source badge;
- schema path breadcrumb;
- unsupported schema construct state.

### Suggested Layer 2 Style

Use:

- semantic state colors for validation;
- compact hover cards;
- restrained badges;
- clear severity hierarchy;
- inline markers that do not obscure JSON;
- overlays that visually attach to JSON nodes.

Avoid:

- turning the editor into a generic form builder;
- large popovers by default;
- excessive icons;
- ambiguous colors where warning/info/error are not distinct;
- hiding source JSON behind semantic UI.

### Layer 2 Representative Scenarios

The visual identity playground should show:

1. Property with schema description hover.
2. Required property missing.
3. Invalid enum value.
4. Numeric range violation.
5. Deprecated property warning.
6. Suggested property insertion.
7. Enum/value suggestion dropdown.
8. Schema-origin badge.
9. Schema reference/loading state.
10. Unsupported schema feature state.
11. Refactor/action suggestion.
12. Validation summary panel.

## Layer 3 Direction

### Visual Role

Layer 3 presents supported JSON structures through alternate projections.

It should optimize for:

- domain-specific comprehension;
- table-like editing;
- statistics and summaries;
- projection/source synchronization;
- plugin consistency;
- optional editing through structural transactions.

### Desired Feel

```text
transformative
exploratory
domain-oriented
connected to source
consistent
```

### Core Visual Elements

Layer 3 needs tokens and representative states for:

- projection shell;
- plugin header;
- projection toolbar;
- source path breadcrumb;
- table header;
- table row hover;
- table row selected;
- table cell edited;
- unsupported projection state;
- plugin loading state;
- plugin error state;
- projection/source sync marker;
- statistics card;
- chart placeholder;
- capability badge.

### Suggested Layer 3 Style

Use:

- a consistent projection shell around plugins;
- shared token vocabulary;
- clear connection to source JSON path;
- table and card styles that remain visually subordinate to source state;
- rich views only where they add comprehension.

Avoid:

- each plugin inventing its own visual language;
- dashboard-style overdecoration;
- hiding source/projection relationship;
- allowing plugin chrome to dominate the data.

### Layer 3 Representative Scenarios

The visual identity playground should show:

1. Table projection for array-of-object JSON.
2. Selected table row synchronized with JSON path.
3. Edited table cell pending transaction.
4. Statistics card projection.
5. Unsupported data shape for selected plugin.
6. Plugin loading state.
7. Plugin error state.
8. Projection breadcrumb.
9. Projection toolbar with primary/secondary actions.
10. Read-only projection state.
11. Editable projection state.
12. Empty projection state.

## Candidate Design Directions

### Candidate A: Technical Calm

Default recommendation.

Characteristics:

- dark-mode first;
- restrained syntax colors;
- subtle panels;
- strong active path;
- compact hover cards;
- muted borders;
- semantic color reserved for state;
- professional but not bland.

Best fit for:

- default product identity;
- large JSON navigation;
- developer and enterprise users;
- long-term extensibility.

Risks:

- may feel too quiet if default contrast is too low;
- needs careful accessibility validation;
- brand identity may be subtle.

### Candidate B: Structured Instrument

More distinct and instrument-like.

Characteristics:

- stronger hierarchy rails;
- more visible depth markers;
- high-contrast focus and selected path;
- panelized Layer 2 and Layer 3 UI;
- more explicit projection/source synchronization.

Best fit for:

- complex nested documents;
- schema-heavy workflows;
- users who need constant orientation.

Risks:

- can become visually heavy;
- may reduce density;
- could look specialized before the runtime proves itself.

### Candidate C: Enterprise Neutral

Safer public component style.

Characteristics:

- light-mode parity from the start;
- neutral gray surfaces;
- conservative accent color;
- Blazor/component-library-friendly appearance;
- minimal decorative identity.

Best fit for:

- public package adoption;
- embedding in existing enterprise apps;
- consumers who want a neutral component.

Risks:

- too generic;
- weaker product identity;
- Layer 3 plugins may feel like ordinary dashboards.

## Recommended Starting Direction

Start with Candidate A: Technical Calm.

Use Candidate B selectively for orientation features such as active path, structure rail, folding boundaries, and projection/source sync.

Keep Candidate C in mind for embeddability and light theme support.

The resulting design should be:

```text
Technical Calm as default
+ Structured Instrument cues for navigation
+ Enterprise Neutral restraint for embeddability
```

## Theme Token Model

### Token Philosophy

The token model should be:

- semantic;
- explicit;
- importable/exportable;
- independent of Blazor;
- usable by the TypeScript runtime;
- simple enough to edit manually;
- stable enough for future public documentation.

Avoid early support for:

- cascading token inheritance;
- computed token expressions;
- theme packages;
- nested plugin overrides;
- automatic contrast generation;
- framework-specific tokens.

### Initial Theme Shape

```json
{
  "schemaVersion": 1,
  "name": "Technical Calm Dark",
  "mode": "dark",
  "tokens": {
    "color.canvas.background": "#0f1117",
    "color.panel.background": "#151923",
    "color.panel.border": "#252b38",
    "color.text.primary": "#e6e8ee",
    "color.text.secondary": "#b4bdcc",
    "color.text.muted": "#8892a6",

    "color.json.property": "#8fb4ff",
    "color.json.string": "#b6d987",
    "color.json.number": "#e6b450",
    "color.json.boolean": "#c792ea",
    "color.json.null": "#7f8795",
    "color.json.punctuation": "#9aa3b2",

    "color.layer1.row.hover.background": "#171d2a",
    "color.layer1.activePath.background": "#1d2a3d",
    "color.layer1.selection.background": "#26344d",
    "color.layer1.searchMatch.background": "#4d3f1f",
    "color.layer1.searchMatch.currentBackground": "#6a5424",
    "color.layer1.indentGuide": "#283041",
    "color.layer1.foldMarker.foreground": "#9aa3b2",

    "color.schema.info.foreground": "#7dcfff",
    "color.schema.info.background": "#102632",
    "color.schema.warning.foreground": "#f4bf75",
    "color.schema.warning.background": "#332713",
    "color.schema.error.foreground": "#ff6b6b",
    "color.schema.error.background": "#3a171a",
    "color.schema.success.foreground": "#9ece6a",
    "color.schema.success.background": "#1d2a18",

    "color.projection.shell.background": "#121722",
    "color.projection.header.background": "#171d2a",
    "color.projection.table.header.background": "#1a2231",
    "color.projection.table.row.hover.background": "#182131",
    "color.projection.table.row.selected.background": "#21314a",

    "color.focus.ring": "#7aa2f7",
    "color.action.primary.background": "#365f9f",
    "color.action.primary.foreground": "#ffffff",
    "color.action.danger.background": "#8f2d3a",
    "color.action.danger.foreground": "#ffffff",

    "font.ui.family": "system-ui, sans-serif",
    "font.mono.family": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    "font.size.ui": "13px",
    "font.size.editor": "13px",
    "font.lineHeight.editor": "20px",

    "space.1": "4px",
    "space.2": "8px",
    "space.3": "12px",
    "space.4": "16px",

    "radius.1": "4px",
    "radius.2": "6px",
    "radius.3": "8px",

    "border.width.default": "1px",
    "shadow.overlay": "0 12px 32px rgba(0, 0, 0, 0.35)"
  }
}
```

### Token Categories

Recommended initial categories:

| Category | Purpose |
|---|---|
| `color.canvas.*` | Root editor background. |
| `color.panel.*` | Panels, hover cards, shells. |
| `color.text.*` | General UI text. |
| `color.json.*` | JSON syntax tokens. |
| `color.layer1.*` | Layer 1 editor-specific state. |
| `color.schema.*` | Layer 2 schema/validation state. |
| `color.projection.*` | Layer 3 projection/plugin state. |
| `color.focus.*` | Focus and keyboard navigation. |
| `color.action.*` | Buttons and actions. |
| `font.*` | UI/editor typography. |
| `space.*` | Spacing scale. |
| `radius.*` | Border radius scale. |
| `border.*` | Border widths. |
| `shadow.*` | Overlay shadows. |

## Visual Identity Playground

### Purpose

Create a playground sample that allows the visual identity to be iterated without rebuilding the product.

Suggested location:

```text
samples/VisualIdentity
```

or, if the repository already has a sample-index convention:

```text
samples/VisualIdentitySample
```

### Required Capabilities

The playground should:

- render representative Layer 1, Layer 2, and Layer 3 scenarios on one page;
- load the default theme;
- import a theme JSON file or pasted JSON text;
- export the current theme JSON;
- switch between at least dark and light theme placeholders;
- edit token values in a simple token table;
- apply token changes immediately;
- show unsupported/missing token fallback behavior;
- avoid requiring network access;
- run from the fixed-port sample workspace setup.

### Non-Goals

The playground should not:

- become a permanent visual design application;
- use a heavy external design system;
- require authentication;
- depend on Figma or external assets;
- finalize the visual identity;
- implement real Layer 2 or Layer 3 behavior before those layers exist.

### Representative Page Layout

```text
Visual Identity Playground

[Theme toolbar]
  Theme selector | Import | Export | Reset | Mode

[Token editor]
  Category filter | Token name | Value | Preview swatch

[Layer 1 scenarios]
  JSON normal | deep nesting | folded nodes | selection | search | invalid token

[Layer 2 scenarios]
  hover card | validation error | validation warning | enum suggestion | refactor hint

[Layer 3 scenarios]
  table projection | stats cards | selected row sync | unsupported plugin | plugin error
```

### Validation

Initial validation can be manual and fast:

- sample builds;
- sample launches on its fixed port;
- default theme loads;
- import/export round-trips JSON;
- all representative states render;
- no network dependency exists;
- no hidden long-running visual tests are introduced.

Later validation can include screenshot regression tests, but those should be opt-in and not part of the default fast test path.

## Accessibility Considerations

The design should be accessible by default, but accessibility validation should be staged.

Initial requirements:

- visible keyboard focus;
- readable text contrast for default dark and light themes;
- error/warning/info not communicated by color alone;
- hover content also accessible through keyboard-triggerable focus state later;
- token system capable of high-contrast variants;
- no information conveyed only through low-contrast indentation guides.

Future requirements:

- formal contrast checks in public-docs or engineering validation;
- keyboard navigation spec;
- screen-reader behavior for structured JSON navigation;
- high-contrast theme;
- reduced-motion behavior.

## Typography Direction

Use two typography roles:

```text
UI font: system-ui, sans-serif
Editor font: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace
```

Do not ship custom font files initially.

Rationale:

- avoids licensing and packaging concerns;
- reduces package size;
- aligns with embeddable component expectations;
- keeps the visual identity focused on hierarchy and state rather than branding.

## Motion Direction

Motion should be minimal.

Allowed early motion:

- subtle hover/focus transitions;
- popover appearance transitions;
- fold marker rotation if cheap and non-distracting.

Avoid:

- animated scrolling as default;
- animated folding for huge structures;
- decorative loading effects;
- plugin animations that obscure source/projection sync.

For large JSON, perceived performance matters more than decorative motion.

## Density Direction

Default density should be compact.

Recommended starting values:

```text
Editor font size: 13px
Editor line height: 20px
UI font size: 13px
Panel padding: 8px or 12px
Row horizontal padding: 8px
```

Later, support density modes:

```text
compact
default
comfortable
```

Do not start with full density customization before the default identity is stable.

## Light Theme Direction

Dark theme should be designed first because JSON inspection and dense code-like surfaces often benefit from reduced luminance.

Light theme must still be supported as a first-class target.

Light theme should not be a naive inversion. It needs explicit tokens for:

- canvas background;
- row hover;
- active path;
- syntax colors;
- validation background fills;
- table projection states.

## Embedding Considerations

Because BlazorJsonVisualizer is a reusable Blazor-facing package, the visual identity must support host applications.

Rules:

- provide default styles;
- expose theme tokens;
- avoid global CSS pollution;
- scope runtime styles under a stable root class or attribute;
- allow consumers to import/export/override theme JSON;
- avoid assuming full-page ownership;
- avoid hard-coded body background or global resets.

Suggested root:

```html
<div class="bjv-root" data-bjv-theme="technical-calm-dark">
```

## Proposed Documents to Create Later

### `docs/specs/visual-identity.md`

Authoritative for:

- product visual principles;
- layer visual roles;
- semantic state usage;
- token category meaning;
- representative scenarios required for visual review.

### `docs/specs/theme-token-format.md`

Authoritative for:

- theme JSON shape;
- token name rules;
- required tokens;
- optional tokens;
- fallback behavior;
- import/export behavior;
- validation failure semantics.

### `docs/decisions/0005-token-based-visual-identity.md`

Decision:

```text
The visual identity is defined through semantic design tokens and validated through representative Layer 1, Layer 2, and Layer 3 sample scenarios.
```

### `docs/milestones/<visual-identity-milestone>.md`

Scope:

- create visual identity spec;
- create token format spec;
- create visual identity sample playground;
- implement default Technical Calm theme;
- support import/export;
- update sample index;
- update public sample documentation.

### `public-docs/samples/visual-identity.md`

Consumer-facing documentation for:

- running the visual identity sample;
- switching themes;
- importing/exporting theme JSON;
- understanding that the default theme is still iterative.

## Open Questions

1. Should the default theme be dark-only until Layer 1 stabilizes, or should light theme parity be required in the first visual identity milestone?
2. Should token editing be implemented in Blazor or in the TypeScript runtime sample shell?
3. Should theme JSON be considered a public extension contract immediately, or an internal experimental format until Layer 2?
4. Should plugins be allowed to define plugin-local tokens, or only consume shared projection tokens initially?
5. Should screenshot regression tests be introduced for the visual identity playground, or deferred until the runtime rendering stabilizes?
6. Should the visual identity sample be included in release validation or only sample validation?
7. Should host applications be able to provide theme tokens as .NET objects, JSON strings, or both?

## Recommendation

Create a dedicated milestone:

```text
Visual identity system and theme iteration playground
```

The milestone should not finalize the design.

It should create the infrastructure for design iteration:

- research draft;
- visual identity spec;
- theme token format spec;
- token-based design decision;
- default Technical Calm theme;
- visual identity playground sample;
- import/export of theme JSON;
- representative Layer 1, Layer 2, and Layer 3 scenarios;
- sample/public documentation updates.

This creates a durable design workflow and prevents visual identity from becoming scattered CSS values inside the runtime.
