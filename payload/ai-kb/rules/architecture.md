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

- UI → ViewModels → Repositories → Domain
- No circular dependencies
- Domain layer has no framework dependencies

## Layer Responsibilities

- **Presentation (UI):** Render UI, handle user input, thin adapters to platform types
- **Domain:** Pure business logic, framework-agnostic, repository interfaces
- **Data:** Repository implementations, cache management, data source coordination

## Quick Reference: DO / DON'T

### DO
- Keep domain layer free of framework dependencies
- Use interfaces for repositories
- Map DTOs at boundaries
- Define shared values in common module
- Make dependencies explicit
- Keep UI layer thin (adapters only)
- Document architectural decisions (ADRs)

### DON'T
- Mix UI logic with business logic
- Put framework code in domain layer
- Expose domain models directly in APIs
- Create circular dependencies
- Duplicate constants across modules
- Use service-locator patterns

## Anti-Patterns

- **God Object** — class handling UI, logic, and data; violates SRP
- **Big Ball of Mud** — no clear boundaries or structure
- **Shotgun Surgery** — one change requires edits in many files
- **Tight Coupling** — changes cascade everywhere
- **Boat Anchor** — keeping unused code "just in case"
