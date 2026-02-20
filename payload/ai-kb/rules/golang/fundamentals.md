# Go Fundamentals

## Naming Conventions

- Packages: lowercase, short, usually one word (`auth`, `cache`, `http`)
- Exported symbols: PascalCase (`UserService`, `ParseConfig`)
- Unexported symbols: camelCase (`userCache`, `parseInput`)
- Interfaces: `-er` suffix when behavior-focused (`Reader`, `Writer`)
- Acronyms: keep a consistent style (`HTTPClient`, `userID`, `parseJSON`)

## Error Handling

- Check errors immediately after the call site
- Wrap with context using `%w` when returning upward
- Use `errors.Is` for sentinel checks, `errors.As` for typed errors
- Handle once: log or return, do not duplicate both at many layers
- Keep panic inside package boundaries; recover at public edges if needed

## Context

- First parameter for request-scoped work: `func X(ctx context.Context, ...)`
- Always `defer cancel()` for `WithCancel` and `WithTimeout`
- Never store context in structs; pass it explicitly
- Keep `WithValue` usage minimal and request-scoped
- Check `ctx.Done()` in loops and long-running operations

## Interfaces

- Accept interfaces, return structs
- Keep interfaces small and focused (1-3 methods)
- Define interfaces where they are consumed, not where implemented
- Avoid broad "god interfaces" that hide real dependencies

## Pointers

- Use pointers for mutation and large structs where copies are expensive
- Prefer value receivers when mutation is not required
- Use pointer fields to represent optional values when needed

## Defer

- Use `defer` for cleanup: close, unlock, cancel
- Remember deferred calls run in LIFO order
- Prefer explicit cleanup blocks when deferred side effects are non-obvious
