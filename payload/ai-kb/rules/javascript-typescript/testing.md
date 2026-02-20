# JavaScript & TypeScript Testing

## Test Pyramid

- Unit tests for pure logic and local invariants
- Integration tests for module and adapter contracts
- E2E tests for critical user and business flows
- Keep most tests in the fast deterministic unit layer

## Deterministic Tests

- Control time with fake timers when logic depends on scheduling
- Isolate external IO with test doubles or local fixtures
- Keep test data explicit and scenario-oriented
- Avoid hidden cross-test state and order dependence

## Async Testing

- Await all async work under test
- Assert rejection paths explicitly for failure scenarios
- Prefer behavior assertions over internal implementation assertions
- Avoid arbitrary sleep-based synchronization

## Contract and Snapshot Usage

- Use contract tests for API boundaries where producer/consumer evolve independently
- Keep snapshots small and intentional
- Review snapshot diffs; do not auto-accept broad snapshot churn

## Mocking Rules

- Mock side-effecting boundaries, not domain logic itself
- Prefer fakes where they improve clarity and maintainability
- Keep mock behavior minimal and scenario-specific
- Avoid brittle tests that assert incidental call ordering
