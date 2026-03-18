# Error Handling

Quick reference for error handling. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| HTTP Status | `error-handling/http.md` | Status codes, response format, RFC 9457 |
| Resilience | `error-handling/resilience.md` | Retry, circuit breaker, degradation |
| UI | `error-handling/ui.md` | Error boundaries, user messages |

---

## Core Rule

Always structured error responses. Never raw 500s.

## Error Categories

- **Auth** — 401 Unauthorized, 403 Forbidden
- **Validation** — 400 Invalid input
- **Resource** — 404 Not found, 409 Conflict
- **Server** — 500 Internal error

## Security

- Log full exception server-side
- Generic message to client
- Never leak stack traces
- Never expose internal details

## Result/Either Pattern

- Use for expected, recoverable errors
- Reserve exceptions for truly exceptional cases
- Explicit error handling (compiler enforced)
- `Left` = failure, `Right` = success

## Message Design

- Specific, actionable, human-readable
- Include: what, why, how to fix
- Never blame user ("invalid" → "expected format: X")
