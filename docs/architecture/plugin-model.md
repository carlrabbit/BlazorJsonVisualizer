# Plugin Model Architecture

Layer 3 plugins are projections over the structural document and schema overlay. They must communicate through stable projection and transaction APIs.

## Plugin classes

Initial plugin classes:

- decorations
- editors
- projections
- actions
- data providers

Milestone 006 implements only one projection plugin: table projection for array-of-object structures.

## Blazor plugin note

Future milestones may allow Blazor-authored plugins. Milestone 006 does not require this. The first plugin may be implemented entirely in TypeScript to validate the projection model.
