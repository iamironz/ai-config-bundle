# Thread Safety Patterns

## Concurrent Collections

### Patterns
- **Lock striping**: Partition locks by hash to reduce contention
- **ConcurrentSkipListMap**: O(log n) sorted concurrent access
- **Ring buffers**: Fixed-size, lock-free producer-consumer
- **Immutable snapshots**: Point-in-time views while writes continue

---

## Backpressure Handling

### Strategies
- Bounded buffers/queues prevent unbounded memory growth
- Rate limiting: drop, buffer, slow producer, or signal upstream
- Reactive streams: request-based flow control (`request(n)`)
- Timeout and circuit breaker for cascading failure prevention

---

## Structured Concurrency

### Principles
- Tasks form tree hierarchy — parent waits for children
- Cancellation propagates down the tree
- Errors propagate up to parent

### Platform-Specific
- **Java 21**: `StructuredTaskScope` with `ShutdownOnFailure`/`ShutdownOnSuccess`
- **Kotlin**: `coroutineScope` (propagates errors), `supervisorScope` (isolates)
- **Swift**: Task groups with automatic child management

### Virtual Threads (Java 21+)
- Avoid `synchronized` blocks — causes pinning
- Use `ReentrantLock` instead
- Blocking I/O yields automatically
