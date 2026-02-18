# Android Lifecycle

## Activity & Fragment Lifecycle

### State Management
- `onSaveInstanceState()` — small UI state (primitives, Parcelables)
- `ViewModel` — larger data, survives config changes
- `SavedStateHandle` — survives process death
- Views with `android:id` auto-save/restore state

### Fragment Rules
- **ALWAYS use `viewLifecycleOwner`** when observing (not `this`)
- Clear view references in `onDestroyView()`
- Check `savedInstanceState != null` before restoring
- Use `findFragmentByTag()` before adding to avoid duplicates

### Common Mistakes
- FragmentTransactions after `onSaveInstanceState()` → IllegalStateException
- Heavy operations in `onCreate`/`onDestroy` (use `onStart`/`onStop`)
- Storing Activity/Context in static fields → memory leak

---

## ViewModel & StateFlow

### Rules
- Expose `StateFlow` (immutable), keep `MutableStateFlow` private
- Use `_state.update { }` for thread-safe modifications
- Use `stateIn(scope, SharingStarted.WhileSubscribed(5000), initial)` for flows

### Collecting StateFlow
- **Views**: `repeatOnLifecycle(Lifecycle.State.STARTED)` + `collect`
- **Compose**: `collectAsStateWithLifecycle()`

### StateFlow vs LiveData
| Feature | StateFlow | LiveData |
|---------|-----------|----------|
| Initial value | Required | Optional |
| Lifecycle awareness | Manual | Automatic |
| Domain layer | Recommended | Not recommended |
