# JavaScript & TypeScript Fundamentals

## Naming and Structure

- Use PascalCase for classes/types, camelCase for variables/functions
- Name modules by capability, not technical artifact (`auth`, `payments`, `telemetry`)
- Keep files cohesive; split when multiple unrelated concerns appear
- Keep public API names stable and explicit

## Modules

- Prefer ESM (`import`/`export`) for modern codebases
- Avoid mixing default and named exports arbitrarily in the same package
- Keep import paths stable; avoid deep relative traversals when aliases exist
- Avoid side-effect imports except for explicit bootstrap entrypoints

## Immutability

- Prefer `const` over `let`; avoid `var`
- Use immutable update patterns for shared state
- Avoid mutating function inputs unless the API contract explicitly allows it
- Clone or freeze config objects that cross trust boundaries

## Error Fundamentals

- Throw `Error` subclasses with clear operation context
- Preserve causal chains (`cause`) when rethrowing
- Reject with `Error`, not raw strings or mixed shapes
- Handle known failure modes explicitly at boundaries

## Boundary Validation

- Parse and validate API, storage, and environment input at entrypoints
- Convert unknown data into typed domain models early
- Keep validation rules close to boundary adapters
