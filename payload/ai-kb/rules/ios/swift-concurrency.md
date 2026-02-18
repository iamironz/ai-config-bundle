# Swift 6 Concurrency

## Data-Race Safety
- Swift 6 enforces strict concurrency checking by default
- Migration: `SWIFT_STRICT_CONCURRENCY` = minimal → targeted → complete
- Enable upcoming features incrementally before Swift 6 mode

## Sendable Protocol
- Types crossing actor/task boundaries must be `Sendable`
- `@unchecked Sendable` for manual thread-safety (use sparingly)
- `@preconcurrency import` for legacy modules
- Compiler checks: minimal/targeted/complete strictness levels

## Actor Reentrancy
- State can change across `await` points within an actor
- Never assume state unchanged after `await`
- Use local copies of state before async operations

## @MainActor Patterns
- Class-level: entire type runs on main thread
- Method-level: only annotated methods
- ViewModels and UI code should be `@MainActor`
- Avoid blocking main thread in `@MainActor` code

## Task Management
- `Task { }` for unstructured async work
- `async let` for parallel execution
- `TaskGroup` for dynamic parallelism
- Check `Task.isCancelled`, call `Task.checkCancellation()` in loops

## Synchronization (Swift 6.2+)
- `Mutex` for low-level locking
- `Atomic` types for lock-free primitives
- Prefer actors for most shared state
