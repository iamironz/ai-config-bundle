# Fail Fast

Detect and report errors immediately.

## Patterns
- Early returns — validate first, process after
- Assertions for preconditions
- Clear error messages

## Benefits
- Faster debugging
- Prevent cascading failures
- Explicit error handling
- Better UX

## Validation Order
1. Auth/authorization
2. Input validation
3. Business rules
4. Processing

## Early Return Style
Validate → return error if invalid → proceed only if valid

## Assertions
- Argument validation — fail if caller passes bad input
- State validation — fail if internal state is wrong

## Guard Clauses
- BAD: nested conditionals hide core logic
- GOOD: guard returns keep logic at top level (null/invalid → return, inactive → return, then proceed)

---

## Error Aggregation

### Strategies
- **Fail on first**: Stop at first error (default for critical paths)
- **Collect all**: Gather all errors before returning (better UX for forms)

### Implementation
- Return list of validation errors
- Include field path, error code, message per error
- Let caller decide to fail fast or collect

---

## Async Validation

### Patterns
- External dependency checks (username availability, email verification)
- Rate limit async validation endpoints
- Graceful degradation if external service fails

### Rules
- Don't block sync validation on async checks
- Return "pending" state for async validations
- Handle timeout scenarios

---

## Type Coercion Policies

### Strict Mode
- Reject mismatched types
- String "123" fails number validation

### Coercing Mode
- Attempt conversion
- String "123" becomes number 123

### Rule
- Document and enforce consistently across application
- Prefer strict mode for APIs

---

## Fail-Fast vs Resilient
| Scenario | Strategy |
|----------|----------|
| Invalid input | Fail fast |
| Missing config at startup | Fail fast |
| Data integrity risk | Fail fast |
| External dependency down | Resilient (retry) |
| Non-critical feature | Resilient (degrade) |

## Anti-Patterns
- Returning defaults on error (masks bugs)
- Catch-all exception handlers (swallows errors)
- Lazy config validation (fails randomly later)
- Ignoring validation errors to "be nice"
