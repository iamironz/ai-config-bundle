# Go Performance

## Memory and Allocation

- Pre-allocate slices and maps when expected size is known
- Prefer `strings.Builder` for repeated string concatenation
- Use `map[K]struct{}` for set semantics when values are irrelevant
- Reuse short-lived objects carefully with `sync.Pool` when profiling justifies it

## Profiling First

- Optimize based on CPU and heap profiles, not assumptions
- Measure allocation count and hot paths before changing APIs
- Re-run benchmarks after each meaningful optimization

## HTTP Production Defaults

- Do not use `http.DefaultClient` in production paths
- Set request timeout explicitly
- Configure transport pooling (`MaxIdleConns`, `IdleConnTimeout`)
- Configure server timeouts (`ReadTimeout`, `WriteTimeout`, `IdleTimeout`)

## Logging

- Prefer structured logging
- Include operation context and stable identifiers
- Never log secrets, tokens, or sensitive payloads
