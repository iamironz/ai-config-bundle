# Kotlin Best Practices

Quick reference for Kotlin development. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Fundamentals | `kotlin/fundamentals.md` | Naming, null safety, immutability, collections |
| Kotlin 2.0+ | `kotlin/modern.md` | K2 compiler, context parameters, value classes |
| Coroutines | `kotlin/coroutines.md` | Dispatchers, structured concurrency, pitfalls |
| Flow | `kotlin/flow.md` | StateFlow, SharedFlow, testing with Turbine |
| KMP | `kotlin/kmp.md` | expect/actual, source sets, iOS interop |
| Testing | `kotlin/testing.md` | runTest, virtual time, concurrency testing |

---

## Quick Reference: Anti-Patterns

1. **Null safety**: Using `!!` instead of `checkNotNull()`/`requireNotNull()`
2. **Coroutines**: `GlobalScope`, hardcoded dispatchers, `async { }.await()` immediately
3. **Flow**: SharedFlow without `replay` (emissions lost)
4. **Testing**: Using `delay()` instead of virtual time
5. **Singletons**: Ambient `object` repositories (untestable)
6. **Late init**: `lateinit` when nullable or lazy would work

## Scope Functions Quick Reference

| Function | Context | Returns | Use For |
|----------|---------|---------|---------|
| `let` | `it` | lambda result | null checks, transforms |
| `apply` | `this` | context object | object configuration |
| `also` | `it` | context object | side effects |
| `run` | `this` | lambda result | transforms with `this` |
| `with` | `this` | lambda result | multiple ops on object |
