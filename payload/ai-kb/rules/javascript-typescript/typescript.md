# TypeScript

## Compiler Baseline

- Enable `strict` and keep it enabled
- Prefer `noUncheckedIndexedAccess` for safer collection access
- Prefer `exactOptionalPropertyTypes` for precise optional semantics
- Keep `noImplicitOverride` and `noFallthroughCasesInSwitch` enabled
- Treat `skipLibCheck` as a temporary compatibility escape hatch only

## Type Safety Rules

- Prefer `unknown` over `any` at external boundaries
- Narrow unknown values using guards before use
- Use discriminated unions for multi-state domain models
- Enforce exhaustive `switch` handling for tagged unions

## Generics

- Use generics when behavior is identical across types
- Keep type parameter counts minimal and meaningful
- Prefer explicit constraints over unconstrained generic widening
- Avoid conditional type complexity when a simpler API shape exists

## API Type Design

- Model input and output separately when invariants differ
- Prefer readonly types for public data contracts
- Avoid leaking persistence/transport shapes into domain types
- Keep framework-specific types out of core domain modules

## Escape Hatches

- Avoid `as` casts unless invariants are proven nearby
- Isolate unavoidable casts behind small helper functions
- Document why an unsafe cast is valid when no safer option exists
