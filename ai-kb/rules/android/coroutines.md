# Android Coroutines

## Structured Concurrency Pitfalls
- **Never use `GlobalScope`** — use `viewModelScope`/`lifecycleScope`
- **Inject dispatchers** — don't hardcode `Dispatchers.IO` (testability)
- **Don't use `async` with immediate `.await()`** — just call suspend directly
- **Never pass `Job()` to `withContext`** — breaks structured concurrency
- Use `SupervisorJob()` when creating custom `CoroutineScope`
- Call `ensureActive()` in loops to respect cancellation

## Dispatcher Rules
- `Main.immediate` over `Main` to avoid unnecessary redispatching
- `IO.limitedParallelism(n)` to control thread pool size
- Never swallow `CancellationException`

---

## Flow & StateFlow

### StateFlow
- Requires initial value
- Use `_state.update { }` for thread-safe modifications
- `stateIn(scope, SharingStarted.WhileSubscribed(5000), initial)` for flows

### SharedFlow Gotchas
- Without `replay`, emissions before collector starts are LOST
- Use `replay = 1` in test fakes
- Test handler methods directly, avoid flow integration tests

### Testing Flows
- **Turbine** library: `flow.test { assertEquals("A", awaitItem()) }`
- Prefer over manual `assertEquals` on collected values
