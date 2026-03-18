# Go Patterns

## Functional Options

- Use functional options to keep constructors stable as config grows
- Keep defaults explicit and documented
- Validate incompatible option combinations early

## Package and Project Layout

- Keep package boundaries clear and dependency direction simple
- Use `internal/` for non-public implementation details
- Keep `cmd/` focused on composition and wiring
- Avoid over-abstracting small projects into excessive directories

## Middleware and Decorators

- Compose middleware as `func(http.Handler) http.Handler`
- Keep middleware single-purpose (auth, logging, tracing)
- Preserve request context and cancellation semantics

## Repository Pattern

- Use repositories when they hide persistence complexity, not by default
- Keep domain interfaces minimal and use-case oriented
- Do not leak storage details into domain APIs
