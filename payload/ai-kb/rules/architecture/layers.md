# Architecture Layers

## Dependency Direction
- UI → ViewModels → Repositories → Domain
- No circular dependencies
- Domain layer has no framework dependencies

## Layer Responsibilities
- **Presentation (UI):** Render UI, handle user input, thin adapters to platform types
- **Domain:** Pure business logic, framework-agnostic, repository interfaces
- **Data:** Repository implementations, cache management, data source coordination

## Layer Boundaries
- Interfaces for repositories (testability)
- DTOs mapped at boundaries (API/storage)
- Domain models not exposed directly in APIs

---

## DTO Boundaries
- **Never expose domain models directly via API**
- Domain model (internal) contains all fields
- DTO (external) contains only safe fields
- Mapper function `toDto()` at boundary
- DTOs in shared module for client/server reuse

## Why DTOs?
- Security — don't expose internal fields
- Flexibility — API evolves independently
- Validation — different rules internal vs external

## DTO Rules
- One DTO per use case, not per entity
- Keep DTOs immutable (readonly properties)
- No business logic in DTOs
- Domain models never contain `fromDto()` — use separate mappers
- Validate DTOs before mapping to domain

---

## Separation of Concerns
- UI logic separate from business logic
- Framework code not in domain layer
- Single responsibility per class/file

## Single Responsibility
- One class/function, one purpose
- Focused validators (one validation concern)
- Specialized repositories (one data type)
- Pure mappers (one transformation)

## Explicit Over Implicit
- Explicit DI (no service-locator in UI)
- Explicit error handling (no silent failures)
- Clear function signatures (self-documenting)
- No hidden side effects
- Dependencies visible in signatures
