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
