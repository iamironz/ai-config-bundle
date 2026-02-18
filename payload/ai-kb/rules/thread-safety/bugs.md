# Thread Safety Bugs & Prevention

## Deadlock Prevention
Break any of the 4 conditions:
- **Circular wait** — enforce lock ordering
- **Hold-and-wait** — acquire all locks atomically
- **No preemption** — release if new request fails
- **Mutual exclusion** — use lock-free structures

## Race Condition Prevention
- Make read-modify-write atomic
- Use atomic operations for counters/flags
- Identify TOCTOU (time-of-check vs time-of-use) gaps
- Database constraints catch races at source
- Design idempotent operations

---

## Common Bugs

### Categories
- **Atomicity violation**: Multi-step operation should be atomic but isn't
- **Order violation**: Assumes A happens before B without enforcing
- **Livelock**: Threads retry indefinitely without progress
- **Starvation**: Low-priority threads never acquire resources
- **False sharing**: Unrelated data on same cache line causes contention
- **Priority inversion**: High-priority blocked by low-priority holding lock
- **Publication safety**: Object visible before fully constructed

---

## Testing Concurrent Code

### Techniques
- **Method-pair coverage**: Test all method pairs that can run concurrently
- **Deterministic scheduling**: MultithreadedTC, tempus-fugit
- **Thread sanitizers**: TSan, ASAN for race detection
- **Stress testing**: High thread counts + repetition
- **Linearizability checking**: Verify matches some valid sequential order

### Test Isolation
- Non-thread-safe fixtures (e.g., shared `Random`) cause flaky tests
- Each test needs isolated state
