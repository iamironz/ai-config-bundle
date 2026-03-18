# Logging

## Format
`[COMPONENT][OPERATION][OUTCOME] key=value ...`

## Outcomes
- `OK` — Success
- `FAIL` — Business/validation error
- `UNAUTHORIZED` — Missing/invalid auth
- `ERROR` — Server error

## Examples
- `[AUTH][SIGNUP][OK] userId=123 email=user@example.com`
- `[AUTH][SIGNUP][FAIL] email=user@example.com reason=missing_fields`
- `[API][REQUEST][ERROR] userId=123 error=io_exception`

## Best Practices
- Include context (userId, resource IDs)
- Include reason for failures
- Use structured key=value pairs
- Log security events (auth failures)

## DON'T Log
- Passwords or tokens
- Full stack traces to client
- Sensitive personal data
- API keys or secrets
- Request/response bodies with PII
- URLs with tokens/magic links

## Log Levels
| Level | When |
|-------|------|
| DEBUG | Diagnostic info (dev only) |
| INFO | Business events, milestones |
| WARN | Potential issues, recoverable |
| ERROR | Failures, app continues |
| FATAL | Critical, app terminating |

## Correlation IDs
- Generate UUID at request entry
- Propagate via `X-Correlation-ID` header
- Include in every log entry
- Return in error responses

## What to Log
- Request: method, path, status, duration
- Auth: user ID (not email), auth type
- Errors: code, message, correlation ID
- Business: state changes, outcomes
