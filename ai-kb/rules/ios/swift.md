# Swift Fundamentals

## Naming
- **Types** → `UpperCamelCase`: `UserViewModel`, `NetworkService`
- **Everything else** → `lowerCamelCase`: `userName`, `fetchData()`
- **Protocols** → nouns for "what it is", `-able/-ible` for capabilities
- **Booleans** → read as assertions: `isEmpty`, `hasChildren`
- Omit `self.` except when required

## Optionals
- **Never force unwrap (`!`)** — use `guard let` or `if let`
- `guard let` for early exits, `if let` when else branch has work
- `??` for defaults, `?.` for safe chaining
- Avoid `try!` except for impossible failures

## Value vs Reference Types
- **Default to structs** — value types, thread-safe
- **Use classes when**: identity (`===`), inheritance, ObjC interop
- Prefer `let` over `var`

## Error Handling
- `throws` for recoverable errors
- **Typed throws (Swift 6)**: `throws(MyError)` for specific error types
- Custom error enums conforming to `Error`
- `Result<Success, Failure>` for async completion handlers
- Never ignore errors — log at minimum

## Memory (ARC)
- `weak` for delegates, closures capturing `self`
- `unowned` only when referenced object guaranteed to outlive
- Capture lists: `{ [weak self] in ... }`

---

## Swift Modern Features

### Macros
- `@Observable` replaces `ObservableObject`/`@Published`
- `@Model` for SwiftData entities
- Custom macros: `@freestanding`, `@attached`
- Understand macro expansion for debugging

### Non-Copyable Types (`~Copyable`)
- Express unique ownership (file handles, unique resources)
- Zero-copy semantics for performance-critical code
- Used in Atomics library

### Other Swift 6 Features
- Pack iteration for value parameter packs
- Guard conditions in `when`: `case .value(let x) where x > 0`
- `InlineArray` and `Span` for fixed-size, heap-free arrays (Swift 6.2)

## Kotlin/Swift Interop
- Kotlin/Native ↔ Swift interop reference: https://github.com/kotlin-hands-on/kotlin-swift-interopedia
- Kotlin/Native Objective-C interop docs: https://kotlinlang.org/docs/native-objc-interop.html
- Kotlin/Native Apple framework docs: https://kotlinlang.org/docs/apple-framework.html
