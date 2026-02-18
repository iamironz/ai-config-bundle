# Kotlin Testing

## Basics
- Backtick test names: `` `should do X when Y` ``
- `@BeforeTest` / `@AfterTest` for setup/cleanup
- `runTest { }` for coroutine tests with virtual time
- **NEVER use `delay()`** — use virtual time

## Concurrency Testing
- Services MUST accept `CoroutineScope` as constructor parameter
- Use `backgroundScope` in tests (not `TestScope` directly)
- Make logic methods `internal` for direct testing

## Flow Testing
- **Turbine** library: `flow.test { assertEquals("A", awaitItem()) }`
- Prefer over manual `assertEquals` on collected values
- Use `replay = 1` in SharedFlow test fakes
