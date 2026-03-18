# Jetpack Compose

## State Management
- `remember(key) { }` — cache expensive calculations
- `mutableStateOf()` — observable state
- **ALWAYS wrap `derivedStateOf` in `remember`**
- Use `kotlinx.collections.immutable` (`ImmutableList`) for stable collections

## Stability & Recomposition
- Mark classes `@Stable` or `@Immutable` for smart recomposition skipping
- Enable **Strong Skipping Mode** (Compose 1.5.4+) for automatic stability inference
- Check stability with Compose Compiler Metrics (`-P plugin:androidx.compose.compiler.plugins.kotlin:metricsDestination=...`)
- Unstable classes cause excessive recomposition — fix or annotate

## derivedStateOf
Use when derived state changes less frequently than source (e.g., `listState.firstVisibleItemIndex > threshold`)

## Recomposition Optimization
- Provide stable `key` in `LazyColumn`/`LazyRow` items
- Defer state reads: pass `() -> State` instead of `State` value (lambda modifiers)
- Use `Modifier.offset { }` over `Modifier.offset()` to skip composition during animations

## Side Effects
| Effect | Use For |
|--------|---------|
| `LaunchedEffect` | Coroutines tied to composition |
| `DisposableEffect` | Cleanup when leaving composition |
| `SideEffect` | Non-suspend effects after recomposition |
| `rememberUpdatedState` | Capture latest value in long-running lambdas |

## Gestures & Scroll
- To block parent `LazyColumn` scrolling while interacting with a child, disable the parent's scroll
  (`userScrollEnabled = false`) via shared state (e.g., a CompositionLocal set on pointer down).
- Do not rely on a child `nestedScroll` connection alone unless the child is actually scrollable.
- If a child must fully own the drag gesture, consume pointer changes in `PointerEventPass.Initial`
  and release the scroll lock on pointer up/cancel.

## Anti-Patterns
- Backwards writes (modifying state during composition) → infinite loop
- Not using `remember` for expensive objects
- Large composables without extraction
- `CompositionLocal` overuse — prefer state hoisting or DI
