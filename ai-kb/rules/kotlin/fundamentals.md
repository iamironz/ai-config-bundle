# Kotlin Fundamentals

## Naming Conventions
- **Classes** → PascalCase: `ActivityRepository`, `UserViewModel`
- **Functions** → camelCase: `saveActivity()`, `getUserById()`
- **Properties** → camelCase: `userId`, `isAuthenticated`
- **Constants** → SCREAMING_SNAKE_CASE: `MAX_RETRY_ATTEMPTS`
- **Private backing** → Underscore prefix: `_state` with public `state`
- **Companion object** → Always last in class body

## Immutability
- `val` over `var`
- `data class` with val properties
- `.copy()` for modifications
- Immutable collections by default
- `StateFlow` for UI state

## Null Safety
- Non-null by default
- `?:` (Elvis) for defaults
- `?.` for safe navigation
- `?.let { }` for safe operations
- Early return: `val x = y ?: return`
- **NEVER use `!!`** — use `checkNotNull()` or `requireNotNull()` with message

## Assertions
- `require(condition) { "message" }` — validate arguments (IllegalArgumentException)
- `check(condition) { "message" }` — validate state (IllegalStateException)
- `requireNotNull(value) { "message" }` — null check with message

## Collections
- `listOf()`, `mapOf()`, `setOf()` — immutable
- `mutableListOf()` only when needed
- `.toList()` for defensive copies
- Use `kotlinx.collections.immutable` for Compose stability
