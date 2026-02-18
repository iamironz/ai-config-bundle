# Kotlin Flow & StateFlow

## StateFlow
- Requires initial value
- Use `_state.update { }` for thread-safe modifications
- `stateIn(scope, SharingStarted.WhileSubscribed(5000), initial)` for flows

## SharedFlow Gotchas
- Without `replay`, emissions before collector starts are LOST
- Use `replay = 1` in test fakes
- Test handler methods directly, avoid flow integration tests

## Testing Flows
- **Turbine** library: `flow.test { assertEquals("A", awaitItem()) }`
- Prefer over manual `assertEquals` on collected values

## Database (SQLDelight)
- Use `asFlow().mapToList()` for reactive data
- SQLDelight handles internal thread safety
- Use Mutex for surrounding logic/cache protection
