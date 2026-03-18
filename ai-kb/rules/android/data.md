# Android Data Layer

## Dependency Injection (Koin)

### Module Organization
- Use `includes()` for module dependencies (Koin 4.2+)
- One module per Gradle module
- Structure: network → data → domain → feature

### DSL Reference
| Function | Scope | Use For |
|----------|-------|---------|
| `single` | Singleton | App-wide instances |
| `factory` | New each time | Stateless helpers |
| `viewModelOf` | ViewModel | ViewModels |
| `scoped` | Custom scope | Activity/Fragment scoped |

### Injection
- Activity/Fragment: `by viewModel()` (lazy)
- Compose: `koinViewModel()`

### Rules
- **Constructor injection** over `KoinComponent` + `by inject()`
- Autowire DSL: `singleOf(::Class)` over `single { Class(get()) }`
- Verify modules in tests: `appModule.verify()`

### Anti-Patterns
- Service locator pattern (`KoinComponent` + `get<T>()`)
- Manual `get()` calls inside classes

---

## WorkManager
- Use for deferrable, guaranteed background work
- `CoroutineWorker` for suspend functions
- Set constraints: `setRequiresCharging()`, `setRequiredNetworkType()`
- Chain work with `then()`, use unique work for singletons

## DataStore
- Replaces SharedPreferences (async-safe, coroutine-based)
- `Preferences DataStore` for key-value, `Proto DataStore` for typed
- Never use `runBlocking` to read — use `Flow`
- Migrate from SharedPreferences via `SharedPreferencesMigration`
