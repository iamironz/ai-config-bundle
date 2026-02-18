# Defense in Depth

Validate at every layer. Never trust, always verify.

## Validation Layers
1. **Client UI** — UX validation, immediate feedback
2. **Serialization** — Type safety, format validation
3. **Routes** — Authorization, ownership
4. **Business** — Domain rules, constraints
5. **Storage** — Integrity checks, constraints

## Benefits
- Multiple safety nets
- Clear responsibility per layer
- Fail fast at appropriate level
- Security hardening

## Philosophy
- Don't rely on single validation point
- Each layer assumes input is untrusted
- Redundant checks are intentional

---

## Sanitization vs Validation

### Validation
- Checks if data meets criteria
- Rejects invalid input
- Example: "Is this a valid email format?"

### Sanitization
- Cleans/neutralizes harmful content
- Transforms input to be safe
- Example: Remove HTML tags, escape special characters

### Rule
- **Always validate first, then sanitize**
- Never rely on sanitization alone
- Sanitization is defense-in-depth, not primary defense

---

## Allowlist vs Denylist

### Allowlist (Whitelist)
- Define exactly what IS authorized
- Everything else rejected
- **Preferred approach**

### Denylist (Blacklist)
- Block known bad patterns
- Easily bypassed, always incomplete
- Use only as supplementary layer

---

## Type-Safe Validation Libraries

| Language | Libraries |
|----------|-----------|
| TypeScript/JS | **Zod**, Joi, Yup, Ajv (JSON Schema) |
| Python | **Pydantic**, marshmallow, Cerberus |
| Java/Kotlin | Bean Validation (JSR 380), Hibernate Validator |
| Go | go-playground/validator |
| Swift | Custom protocols |

---

## Schema Validation
- JSON Schema for API contracts
- Shareable across services/languages
- Schema versioning for evolution
- Auto-generate docs and clients

## Cross-Field Validation
- Relationships: `start_date < end_date`
- Conditional: field B required if field A has value
- Mutual exclusivity: only one of several fields present

## Business Rule Validation
- **Specification Pattern**: Encapsulate rules as composable objects
- Domain validators in domain layer
- Aggregate all errors vs fail on first (context-dependent)

---

## Validation Error Messages

### Guidelines
- User-friendly, no technical jargon
- No system detail leakage
- Structured format: field path, error code, message
- Internationalization (i18n) ready

---

## File Upload Validation
- **MIME type + magic bytes** — don't trust Content-Type alone
- Size limits to prevent DoS
- Path traversal prevention — sanitize filenames, reject `..`
- Extension allowlisting — only permit specific types

## Output Encoding
- Context-aware: HTML, URL, JavaScript, SQL
- Encoding must match output context
- Complements input validation — prevents execution of bad data

## Parameterized Queries
- Separation of code and data
- User input never becomes query structure
- Use ORM with parameterization by default
- **Never concatenate** user input into queries

---

## Trust Boundaries
- Never trust user input
- Never trust HTTP headers (spoofable)
- Never trust client-side validation
- Validate across service boundaries

## Assertions vs Exceptions
- **Assertions**: invariants, unreachable code, programmer errors
- **Exceptions**: user input, external data, recoverable errors
- Never use assertions for input validation (can be disabled)

## Validation Order
1. Length limits
2. Allowed characters
3. Format/pattern
4. Semantic/business rules

## Centralized Validation
- Single source of truth for rules
- Shared validation module/library
- Same schema on frontend and backend
