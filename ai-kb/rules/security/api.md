# API Security

## Rate Limiting
- Algorithms: Token Bucket, Leaky Bucket, Sliding Window
- Apply per-IP, per-user, and per-endpoint limits
- Return `429 Too Many Requests` with `Retry-After` header

## API Keys
- Never hardcode — use environment or vault
- Rotate regularly, implement key scoping
- Use short-lived tokens when possible

## Common Vulnerabilities
- **BOLA** (#1 OWASP API) — validate user permissions per resource, not just auth
- **Broken Auth** — MFA, strong passwords, secure sessions
- **Excessive Data Exposure** — return only necessary fields

## GraphQL Security
- Depth limiting, amount limiting
- Query complexity analysis to prevent DoS

## mTLS
- Use mutual TLS for service-to-service in zero-trust environments
