# Modularization

## Feature Module Strategy
- Organize by business feature: `:feature:auth`, `:feature:checkout`
- Each module owns presentation, domain, and data layers
- API/Implementation split: separate public interfaces from implementations

## Module Granularity
- Too fine-grained = overhead burden
- Too coarse-grained = monolith problems
- Balance: one module per distinct feature or capability

## Rules
- Assign dedicated owner per module (accountability)
- Use `internal`/`private` aggressively — minimal public API
- One module per Gradle/SPM module

---

## Shared Module Responsibilities

| Module type | Keep here | Keep out |
|-------------|-----------|----------|
| UI kit (`:uikit`-style) | Reusable UI components, theme primitives, visual tokens | Feature orchestration, business decisions |
| UI core (`:uicore`-style) | Base UI abstractions, screen scaffolding, navigation helpers | Transport models, backend mapping |
| Core infra (`:core`-style) | Cross-feature services (analytics, auth/session, routing, platform adapters) | Feature-specific state machines |
| Shared models (`:shared:models`-style) | Reused DTOs, shared domain value objects, boundary mappers | UI-specific formatting and widgets |
| Resources (`:resources`) | Strings, drawables, static assets | Business logic and mapping logic |

## Placement Rules

- Promote code to shared modules only when reused by multiple features and stable
- Keep feature-specific constants, DTOs, and logic inside feature modules until reuse is proven
- Avoid circular dependencies between shared modules
- Shared modules should expose small, explicit APIs; internals stay hidden
