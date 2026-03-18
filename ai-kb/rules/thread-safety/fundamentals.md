# Thread Safety Fundamentals

## Synchronization Required
- Read-modify-write operations
- Shared mutable collections
- State updates from multiple sources

## NOT Required
- Immutable data (thread-safe by default)
- Local variables (not shared)
- Single-threaded access (no contention)

## Strategy Priority
1. Don't share state (thread confinement)
2. Make shared data immutable
3. Use thread-safe data types
4. Synchronize access (last resort)

## Best Practices
- Minimal lock scope
- Validation before acquiring locks
- Release locks as soon as possible
- Document thread-safety guarantees explicitly

## Don't Hold Locks During
- Network calls
- Sleep/delays
- Complex calculations
