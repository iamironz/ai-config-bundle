# Security Best Practices

Quick reference for security. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| API | `security/api.md` | Rate limiting, API keys, GraphQL, mTLS |
| Mobile | `security/mobile.md` | SSL pinning, binary protection, secure storage |
| Supply Chain | `security/supply-chain.md` | SBOM, dependency scanning, build integrity |

---

## Authentication
- JWT with separate access/refresh tokens
- Short TTL for access tokens (15 min)
- Refresh token rotation on use
- Clock skew tolerance

## Passwords
- BCrypt hashing with salt
- Never store plaintext passwords
- Never log passwords

## Authorization
- Resource ownership validation on all endpoints
- Check ownership on reads AND writes
- Early return on auth failure
- Log authorization failures

---

## Data Privacy & Encryption

### Encryption at Rest
- AES-256 for stored data
- Field-level encryption for specific PII
- Key management via HSM or cloud KMS

### PII Handling
- Data minimization — collect only necessary data
- Retention policies — delete when no longer needed
- GDPR: pseudonymization, right to erasure, data portability

---

## Zero Trust Principles

- **Never trust, always verify** — authenticate every request
- **Least privilege per request** — minimal permissions at endpoint level
- **Micro-segmentation** — isolate workloads, don't trust internal network
- **Continuous verification** — re-validate sessions, short-lived tokens
- **Deny by default** — block unless explicitly allowed

---

## Input Handling
- Sanitize user-provided paths
- Remove path separators (.., /, \)
- Validate sanitized paths not empty

## Error Handling
- Log full exception server-side
- Generic error message to client
- Never include stack traces in responses
- Use structured error codes

## Secrets Management
- Never in source code or git
- Use dedicated vault (HashiCorp, AWS Secrets Manager)
- Rotate regularly, automate where possible
- Short-lived credentials when feasible
- Separate secrets per environment

---

## Security Headers

### Required
- `Content-Security-Policy` — strict CSP with nonces, avoid `'unsafe-inline'`
- `Strict-Transport-Security` — enforce HTTPS
- `X-Content-Type-Options: nosniff` — prevent MIME sniffing
- `X-Frame-Options: DENY` — prevent clickjacking
- `Referrer-Policy: strict-origin-when-cross-origin`

### Cross-Origin
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- `Cross-Origin-Resource-Policy: same-site`

### Deprecated (Remove)
- `X-XSS-Protection` — can introduce vulnerabilities
- `Public-Key-Pins` — deprecated, too risky
- `Expect-CT` — Certificate Transparency now automatic

---

## Principles
1. Defense in Depth — Multiple validation layers
2. Least Privilege — Users only access their own data
3. Fail Secure — Authorization failures deny access
4. No Secrets in Logs — Never log passwords or tokens

## OWASP Top Mitigations
- **Injection** — parameterized queries, never concatenate
- **Broken Auth** — MFA, strong passwords, secure sessions
- **XSS** — context-aware output encoding
- **SSRF** — validate/allowlist URLs, deny by default
