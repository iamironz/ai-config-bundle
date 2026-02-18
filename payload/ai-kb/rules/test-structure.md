# Test Structure

## AAA Pattern (Always)
1. **Arrange** — Set up test data
2. **Act** — Execute operation
3. **Assert** — Verify outcome

## Naming
- Descriptive names explaining behavior
- File pattern: `{ClassName}Test` or `{class_name}_test`
- ✅ "should return error when input invalid"
- ❌ "test1", "testValidation"

## Naming Formats
- `MethodName_StateUnderTest_ExpectedBehavior`
- `Should_ExpectedBehavior_When_StateUnderTest`
- `Given_Preconditions_When_Action_Then_Result`

## Isolation
- Each test independent
- Fresh setup before each test (setup/beforeEach)
- Cleanup after each test (teardown/afterEach)
- No shared mutable state

## One Thing Per Test
- Single assertion focus
- If test fails, know exactly what broke
- Separate tests for each scenario

---

## NO DELAYS (Critical)
- ❌ sleep(), delays, timers
- ✅ Virtual time / test schedulers
- ✅ Async/await patterns
- ✅ Proper waiting mechanisms

If you need a delay, the architecture is wrong.

---

## Property-Based Testing
- Define properties/invariants that must hold for ALL inputs
- Automatic input generation, shrinking failing cases
- Tools: FastCheck (JS), Hypothesis (Python), jqwik (Java)
- Use for: sorting, serialization/deserialization, mathematical functions

## Mutation Testing
- Inject small code changes (mutants) to assess test quality
- Mutation score = killed mutants / total mutants
- 100% coverage ≠ tests catch bugs — mutation testing validates quality
- Tools: PIT (Java), Stryker (JS/TS), Muter (Swift)

## Contract Testing
- Verify API contracts between services without full integration
- Consumer-Driven Contracts (CDC): consumer defines expected interactions
- Tools: Pact, Spring Cloud Contract
- Essential for microservices

## Snapshot Testing
- Capture output, compare against stored reference
- When to use: UI structure, serialized data, API responses
- **When to avoid**: frequently changing data, large objects
- Review snapshot changes in PRs — don't blindly update

---

## Test Data Management
- Data isolation: each test gets fresh data
- Synthetic data generation for realistic scenarios
- Ephemeral databases via containers (Testcontainers)
- Idempotent tests: can run repeatedly without side effects

## Flaky Test Prevention
- **Hermetic tests**: self-contained, no external dependencies
- **Quarantine pattern**: isolate flaky tests until fixed
- **Retry limits**: max 2-5, then investigate root cause
- **Dynamic waits**: wait for conditions, not fixed time
- **Mock external services**: API stubs, local emulators
- **Environment consistency**: use containers

---

## Fixtures
- Extract common test data
- Reuse across tests
- Reduces duplication

## Race Condition Testing
- Test with enough concurrency (10+ operations)
- More is better for finding race conditions
- Test uniqueness constraints (1 succeeds, N-1 fail)
- Test read-modify-write (no lost updates)
- Test concurrent state access (consistent final state)

## Debugging
- Use `--info` for verbose output
- Isolate failing **JVM** test with `--tests "ClassName.methodName"` (e.g. `:composeApp:jvmTest`, `testDebugUnitTest`)
- Isolate failing **Android instrumentation** test via runner args, e.g.:
  - `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest`
  - `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest#myTest`
- Print debugging (`println`) inside failing test

---

## Mocking Rules
- Mock only external dependencies with side effects
- Don't mock value objects/DTOs — use real instances
- Don't mock the class under test
- Prefer fakes over mocks when possible
- Avoid over-mocking (tests become brittle)
- Focus on outcomes, not implementation details

---

## CI/CD Testing Strategies
- **Shift-left**: test earlier in development lifecycle
- **Parallelization**: run independent tests concurrently
- **Selective execution**: run only tests affected by changes
- **Quality gates**: block deployments below thresholds

## Coverage Metrics
- Line coverage ≠ behavior coverage
- **Mutation score** more reliable than coverage %
- Risk-based thresholds: critical code (95%+), utilities (70%)
- Track trends over time, not just absolute numbers

---

## Anti-Patterns
- ❌ Using delays to "wait for things to settle"
- ❌ Testing with only 2 concurrent operations
- ❌ Hardcoding scopes in services
- ❌ Testing timing instead of logic
- ❌ Testing implementation instead of behavior
- ❌ Excessive mocking
