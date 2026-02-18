# Kotlin Coroutines

## Basics
- `suspend` functions for async
- `Flow` for streams
- `StateFlow` for state (single writer, multiple readers)
- `withContext(Dispatchers.IO)` for IO operations
- `Mutex` + `withLock { }` for synchronization
- `CompletableDeferred` for single-shot async results

## Dispatcher Rules
- **Inject via constructor** (testability)
- `IO` — blocking I/O (network, disk)
- `Default` — CPU-intensive work
- `Main` — UI updates only (brief)
- `Main.immediate` — avoids redispatching if already on Main
- `IO.limitedParallelism(n)` — control thread pool size
- **Never hardcode** `Dispatchers.X`

## Structured Concurrency
- Always use lifecycle-aware scope
- **Never use `GlobalScope`**
- `supervisorScope` when child failure shouldn't cancel siblings
- **Never swallow `CancellationException`**
- Use `SupervisorJob()` when creating custom `CoroutineScope`

## Pitfalls to Avoid
- `async { }.await()` immediately — just call suspend directly
- `withContext(Job())` — breaks structured concurrency
- `runBlocking` in production — keep only in `main()` or tests
- Not checking `ensureActive()` in loops

## Thread Safety
- `Mutex` for coroutine synchronization
- `withLock { }` for atomic operations
- `StateFlow.value = ` for atomic state updates

## Single-Flight Pattern
- Use `Mutex` + `CompletableDeferred` for concurrent requests sharing one execution
- Generation guards prevent stale overwrites
