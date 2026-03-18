# Thread Safety

Quick reference for thread safety. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Fundamentals | `thread-safety/fundamentals.md` | When sync needed, strategy priority |
| Lock-Free | `thread-safety/lock-free.md` | Memory ordering, ABA problem, progress |
| Patterns | `thread-safety/patterns.md` | Collections, backpressure, structured concurrency |
| Bugs | `thread-safety/bugs.md` | Common bugs, deadlock prevention, testing |

---

## Quick Reference: When Sync Required

**Required:**
- Read-modify-write operations
- Shared mutable collections
- State updates from multiple sources

**NOT Required:**
- Immutable data (thread-safe by default)
- Local variables (not shared)
- Single-threaded access (no contention)

## Strategy Priority

1. Don't share state (thread confinement)
2. Make shared data immutable
3. Use thread-safe data types
4. Synchronize access (last resort)

## Actor vs Shared State

| Aspect | Actor | Shared State |
|--------|-------|--------------|
| Safety | No races by design | Needs synchronization |
| Best for | Distributed, messaging | CPU-intensive, low-latency |
