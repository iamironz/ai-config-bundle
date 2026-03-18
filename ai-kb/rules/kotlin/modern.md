# Kotlin 2.0+ Features

## K2 Compiler Improvements
- Smart casts through `catch`/`finally` blocks
- Smart casts in inline functions with implicit `callsInPlace`
- Smart casts for properties with function types

## Context Parameters (Kotlin 2.2, Beta)
- Replaces context receivers: `context(foo: Foo)` instead of `context(Foo)`
- Require explicit parameter names
- Use holder pattern for classes needing context

## Value Classes
- `@JvmInline value class UserId(val v: String)` — true type safety, zero allocation
- **NOT `typealias`** — typealias provides NO type safety
- Limitations: no `init` with side effects, boxing with generics/nullable

## Sealed Classes & Interfaces
- Use for error types: `sealed class NetworkError`
- Use for API responses: `sealed class ApiResponse<T>`
- Exhaustive `when` — compiler catches missing cases
- **No `else` branch** — forces handling all cases
- Prefer sealed interfaces over sealed classes when no shared state

## Other Features
- Guard conditions in `when`: `is String if x.isNotEmpty() -> ...` (stable 2.2)
- `@Deprecated(level = HIDDEN)` to resolve conflicting overloads

## Serialization
- `kotlinx.serialization` for JSON
- 100% typed models — no raw JSON strings
- `@Serializable` data classes

## Data Classes
- Use for DTOs, domain models, state
- Implement `equals`, `hashCode`, `copy` automatically
- Destructuring: `val (a, b) = pair`
