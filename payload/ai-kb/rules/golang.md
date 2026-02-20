# Go Best Practices

Quick reference for Go development. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Fundamentals | `golang/fundamentals.md` | Naming, errors, context, interfaces |
| Concurrency | `golang/concurrency.md` | Goroutines, channels, synchronization |
| Generics | `golang/generics.md` | Type parameters, constraints, when to use |
| Performance | `golang/performance.md` | Memory, profiling, HTTP production patterns |
| Testing | `golang/testing.md` | Table-driven tests, fuzzing, mocking |
| Patterns | `golang/patterns.md` | Functional options, middleware, project layout |

---

## Quick Reference: Common Mistakes

1. **Errors**: Ignoring `ok` from map/type assertion/channel operations
2. **Context**: Storing context in structs instead of passing as a parameter
3. **HTTP**: Using `http.DefaultClient` with no timeout
4. **Goroutines**: Starting goroutines without cancellation or termination path
5. **Interfaces**: Defining large interfaces that are hard to mock
6. **Init**: Putting non-trivial logic in `init()` functions
7. **Returns**: Using naked returns in non-trivial functions
8. **Globals**: Package globals that reduce testability

## Modern stdlib preferences

- Prefer `slices.Sort` and `slices.Contains` over manual loops where appropriate
- Prefer `maps.Keys` and `maps.Values` for map projections
- Use `min`, `max`, and `clear` built-ins where they improve clarity
- Prefer `math/rand/v2` in new code when ecosystem constraints allow
