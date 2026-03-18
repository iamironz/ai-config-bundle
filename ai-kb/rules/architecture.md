# Clean Architecture

Quick reference for architecture. See subdocs for details.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Layers | `architecture/layers.md` | Dependencies, boundaries, DTOs |
| Modularization | `architecture/modularization.md` | Feature modules, granularity |
| Patterns | `architecture/patterns.md` | Offline-first, event-driven, CQRS |

---

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

## Model Roles

- **DTO:** External transport/storage schema (API, DB, cache)
- **Domain model:** Business invariants and behavior
- **UI model:** Rendering state and view-specific formatting
- Mapping flow: DTO → Domain → UI

## Quick Reference: DO / DON'T

### DO
- Keep domain layer free of framework dependencies
- Use interfaces for repositories
- Map DTOs once at data boundaries
- Keep DTOs out of domain and presentation layers
- Define shared values in explicit shared modules by responsibility
- Make dependencies explicit
- Keep UI layer thin (adapters only)
- Document architectural decisions (ADRs)

### DON'T
- Mix UI logic with business logic
- Put framework code in domain layer
- Expose domain models directly in APIs
- Pass DTOs through all layers
- Couple ViewModels directly to data implementations
- Create circular dependencies
- Duplicate constants across modules
- Use service-locator patterns

## Anti-Patterns

- **God Object** — class handling UI, logic, and data; violates SRP
- **Big Ball of Mud** — no clear boundaries or structure
- **DTO Pass-Through** — transport shapes leak into all layers and amplify change impact
- **Shotgun Surgery** — one change requires edits in many files
- **Tight Coupling** — changes cascade everywhere
- **Boat Anchor** — keeping unused code "just in case"
