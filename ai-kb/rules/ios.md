# iOS Best Practices

Quick reference for iOS development. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Swift | `ios/swift.md` | Naming, optionals, value types, ARC |
| Concurrency | `ios/swift-concurrency.md` | Swift 6, Sendable, actors, tasks |
| SwiftUI | `ios/swiftui.md` | @Observable, navigation, state |
| Objective-C | `ios/objc.md` | Properties, nullability, blocks |
| Architecture | `ios/architecture.md` | Patterns, DI, navigation |
| Xcode | `ios/xcode.md` | Build settings, signing, deps |
| Testing | `ios/testing.md` | Swift Testing, XCTest, UI |

---

## Quick Reference: Anti-Patterns

### Swift
- Force unwrapping (`!`)
- Massive View Controllers
- Singleton overuse
- Retain cycles (missing `[weak self]`)
- `default` in enum switches (misses new cases)

### SwiftUI
- Overusing `@State` for complex state
- Not using `@Observable` (iOS 17+)
- Hardcoded navigation paths

### Concurrency
- Assuming state unchanged after `await` (actor reentrancy)
- Missing `Sendable` conformance
- Not checking `Task.isCancelled`
