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
