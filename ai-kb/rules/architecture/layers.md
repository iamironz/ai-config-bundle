# Architecture Layers

## Dependency Direction
- Presentation → ViewModel/Presenter → UseCase/Interactor → Domain contracts
- Data implementations depend on and implement domain contracts
- Composition root wires domain contracts to data implementations
- UI may depend on domain interfaces in adapter-heavy modules, never on data implementations
- No circular dependencies
- Domain layer has no framework dependencies

## Layer Responsibilities
- **Presentation (UI):** Render UI, handle user input, thin adapters to platform types
- **Application (Use Cases/Interactors):** Orchestrate domain operations and policies
- **Domain:** Pure business logic, framework-agnostic, repository interfaces
- **Data:** Repository implementations, cache management, data source coordination

## Layer Boundaries
- Repository interfaces live in domain/application contracts (testability)
- DTOs mapped at data boundaries (API/storage)
- DTOs never cross into domain/presentation directly
- Domain models not exposed directly in APIs
- UI models mapped near presentation boundaries

---

## DTO Boundaries
- **Never expose domain models directly via API**
- DTO = transport/storage schema
- Domain model = business invariants
- UI model = rendering state
- Map DTO → Domain in data layer, Domain → UI in presentation
- Keep API field churn localized to mapper and boundary models

## Why DTOs?
- Security — don't expose internal fields
- Flexibility — API evolves independently
- Boundary stability — transport changes do not cascade into all layers

## DTO Rules
- One DTO per use case, not per entity
- Keep DTOs immutable (readonly properties)
- No business logic in DTOs
- Domain models never contain `fromDto()` — use separate mappers
- Validate DTOs before mapping to domain
- Do not pass DTOs beyond the data boundary
- Keep transport field names out of domain terminology

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
