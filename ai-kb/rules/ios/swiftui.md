# SwiftUI

## @Observable (iOS 17+)
- Replaces `ObservableObject` + `@Published`
- Simpler syntax, better performance
- Automatic dependency tracking per property
- Use `@Bindable` for two-way bindings

## Navigation
- `NavigationStack` + `NavigationPath` for type-safe navigation
- `navigationDestination(for:)` for programmatic navigation
- Deep linking via `NavigationPath` serialization

## State Management
- `@State` for view-local state
- `@Binding` for child view mutations
- `@Environment` for dependency injection
- `@Observable` models for shared state

## SwiftData Integration
- `@Model` for persistent entities
- `@Query` for reactive fetches
- `ModelContainer` configuration
- CloudKit sync limitations (no public database)

## MV Pattern (Apple Recommended)
- Views bind directly to Models (no ViewModels)
- Simpler than MVVM for SwiftUI
- Models are `@Observable`
