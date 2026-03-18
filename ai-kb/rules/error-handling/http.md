# HTTP Error Handling

## HTTP Status Mapping
| Error | Status | When |
|-------|--------|------|
| Bad Request | 400 | Malformed syntax, fallback |
| Unauthorized | 401 | Missing/invalid auth |
| Forbidden | 403 | Valid auth, no permission |
| Not Found | 404 | Resource never existed |
| Conflict | 409 | State conflict, duplicate |
| Unprocessable | 422 | Validation errors |
| Too Many | 429 | Rate limiting |
| Internal | 500 | Server error (last resort) |
| Unavailable | 503 | Temporary outage |

## Response Format
- `code` — Error code (e.g., `INVALID_INPUT`)
- `message` — Human-readable
- `details` — Optional field-level errors

## RFC 9457 Problem Details
- `type` — URI identifying error type
- `title` — Short human-readable summary
- `status` — HTTP status code
- `detail` — Specific occurrence explanation
- `instance` — URI for this occurrence

## Idempotency for Retries
- Retries may cause duplicate side effects
- Use idempotency keys/tokens in requests
- Safe: GET is naturally idempotent
- Unsafe: POST/PUT need explicit design
- Database: unique constraints, conditional updates
