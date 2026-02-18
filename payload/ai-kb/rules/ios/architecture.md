# iOS Architecture

## Pattern Selection
| Pattern | Use When |
|---------|----------|
| MVC | Simple apps, prototypes |
| MV | SwiftUI apps (Apple recommended) |
| MVVM | UIKit, complex state |
| VIPER/TCA | Enterprise, complex state |

## SwiftUI vs UIKit
- SwiftUI: new projects, rapid prototyping, cross-platform
- UIKit: legacy, complex animations, pixel-perfect control
- Hybrid: `UIHostingController` to embed SwiftUI in UIKit

## Dependency Injection
- Constructor injection (preferred) — compile-time safe
- `@Environment` for SwiftUI shared state

## Navigation
- Coordinator pattern for UIKit
- `NavigationStack` + `NavigationPath` (iOS 16+)

## Data Layer
- Repository pattern abstracts data sources
- DTOs for network/database, Entities for domain
- Never expose DTOs to presentation layer
