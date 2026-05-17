# Blazor Integration Architecture

BlazorJsonVisualizer exposes a Blazor component that mounts the TypeScript runtime into a DOM element.

Blazor responsibilities:

- provide component parameters
- provide initial document data
- receive runtime callbacks
- dispose runtime sessions

Blazor non-responsibilities:

- no direct ownership of structural index
- no direct DOM rendering of JSON internals
- no browser runtime state machine
