# Error Resilience Patterns

## Retry Strategies

### Exponential Backoff
- Wait time increases: 1s → 2s → 4s → 8s
- Add **jitter** (randomness) to prevent thundering herd
- Cap maximum delay to prevent indefinite waits
- Honor `Retry-After` header for 429/503

### Retry Rules
- **Retriable**: 5xx, 429, 408, 503
- **Never retry**: 4xx client errors (except 429)
- Maximum retry limit: 3-5 attempts
- Token bucket throttling for local rate control

---

## Circuit Breaker Pattern

### States
- **Closed**: Normal operation, requests pass through
- **Open**: Failing fast, no requests sent
- **Half-Open**: Testing recovery with limited requests

### Configuration
- Failure threshold before opening
- Reset timeout before half-open
- Success threshold to close again

### Best Practices
- Combine with retry — retry handles transient, circuit prevents overwhelming
- Implement manual override for admin control
- Log state transitions for observability

---

## Graceful Degradation

### Fallback Strategies
- **Caching**: Serve cached data when API fails
- **Default values**: Return sensible defaults
- **Alternative APIs**: Fallback to secondary data source
- **Feature flagging**: Disable failing features
- **Partial responses**: Return what succeeded

### Dead Letter Queue
- Hold messages that fail after max retries
- Prevents cascade failures
- Allows later reprocessing or manual intervention
