# JavaScript & TypeScript Runtime

## Runtime Boundaries

- Separate Node, browser, and edge concerns explicitly
- Avoid runtime-specific APIs in shared modules without guards
- Keep polyfills and shims localized to bootstrap layers
- Define capability checks close to runtime entrypoints

## Module and Package Hygiene

- Keep one module system strategy per package when possible
- Avoid mixing package managers in one repository
- Keep a single lockfile source of truth
- Pin critical tooling versions for reproducible environments

## Configuration and Environment

- Validate environment variables at startup
- Fail fast on missing required config
- Centralize config parsing and typed access
- Never spread raw `process.env` access across business logic

## Dependency Safety

- Minimize dependencies in core/shared modules
- Prefer maintained packages with clear release and security posture
- Regularly update and verify transitive dependency risk
- Remove unused dependencies to reduce attack surface and bundle weight

## Logging and Diagnostics

- Use structured logs with stable correlation identifiers
- Keep logs runtime-appropriate (server vs browser)
- Never log credentials, secrets, or sensitive personal data
