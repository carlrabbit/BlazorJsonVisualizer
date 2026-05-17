# Browser Runtime Architecture

## Package split

- `runtime-core`: framework-free session/protocol logic.
- `runtime-dom`: DOM mounting and rendering shell.
- `runtime-worker`: worker entry points and later background processing.
- `runtime-blazor`: JS interop facade for Blazor.

## Rule

`runtime-core` must not import DOM, Blazor, or framework-specific modules.
