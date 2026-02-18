# Android Testing

## Test Pyramid
| Level | Type | Speed | Fidelity |
|-------|------|-------|----------|
| Unit | Local JVM | Fast | Low |
| Integration | Robolectric | Medium | Medium |
| UI | Espresso/Device | Slow | High |

## Frameworks
- Unit: MockK with `coEvery`/`coVerify`
- Compose: `createComposeRule()` + `onNodeWithText().performClick()`
- Robolectric: `isIncludeAndroidResources = true`
- Espresso: Robot pattern

## Room Testing
- Use `@Transaction` for multi-operation atomicity
- Test insert-with-relations patterns

## Anti-Patterns
- Testing implementation instead of behavior
- Excessive mocking
- Flaky tests (use `IdlingResource`)
- Shared state between tests

## Instrumentation Runner Args
- Scope instrumentation with runner args (NOT `--tests`)
- Class scope: `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest,com.foo.OtherTest`
- Method scope: `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest#myTest`
- `--tests` is for JVM tasks (`:composeApp:jvmTest`, `testDebugUnitTest`)

---

## Coroutine Testing
- Services MUST accept `CoroutineScope` as constructor parameter
- Use `backgroundScope` in tests (not `TestScope` directly)
- Make logic methods `internal` for direct testing
- `runTest { }` for coroutine tests with virtual time
- **NEVER use `delay()`** — use virtual time
