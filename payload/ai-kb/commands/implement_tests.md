---
description: "(Custom) Create tests using TDD and global rules. Args: [test request]."
---

# Implement Tests

Write tests for existing or new functionality following TDD principles and global KB rules.

**Use for:** Unit tests, integration tests, UI tests, test coverage improvements.

---

## Input

$ARGUMENTS

- This is the command-specific request; do not ignore it.
- Use it to drive keyword matching for `~/ai-kb/rules/INDEX.md` and rule loading.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Follow parallel execution policy in AGENTS.md (offload heavy work, keep main thread light)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `implement_tests`)
- Read project docs (`doc/`, `AGENTS.md`) before changes
- Focus rules: `tdd.md`, `test-structure.md`, `testing/execution.md`, `code-quality.md`; platform testing rules via INDEX
- Follow `testing/execution.md` for UI instrumentation/E2E requirements (Android: `androidTest`, `:androidApp:connectedAndroidTest`)

---

## Workflow

1. **Analyze Test Target**
   - Identify the component/function to test
   - List its public API and dependencies
   - Search the repo for existing test helpers/fixtures/builders and reuse them
   - Enumerate real-world corner cases first and prioritize their tests
   - Identify edge cases and error conditions
   - If you create a plan document, append an "Original Prompt" section at the bottom with the exact prompt

2. **Set Up Test Structure**
   - Follow naming convention: `[ClassName]Test` or `[function]_test`
   - Reuse existing test patterns/base classes; avoid copy-paste duplication
   - Group tests by behavior, not by method
   - Use descriptive test names: `should_[expected]_when_[condition]`

3. **Write Tests (AAA Pattern)**
   - **Arrange:** Set up test data and mocks
   - **Act:** Execute the code under test
   - **Assert:** Verify expected outcomes

4. **Cover Edge Cases**
   - Empty/null inputs
   - Boundary conditions
   - Error states and exceptions
   - Concurrent access (if applicable)

5. **Verify Test Quality**
   - Tests should fail for the right reason
   - Tests should be independent
   - Tests should be fast and deterministic

---

## After Completion

**Run tests immediately after creation →**
- Follow `testing/execution.md` for scope selection and reporting
- If Android UI tests are involved, run `:androidApp:connectedAndroidTest` (use runner args below)

**If new test utilities created →** document in test README

**If mocks added →** verify they match real implementation contracts

**If UI instrumentation tests changed (Android) →** launch emulator/device and run the target class(es) via `:androidApp:connectedAndroidTest`.
  - Scope instrumentation tests via runner args (NOT `--tests`):
    - `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest,com.foo.OtherTest`
    - (method) `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest#myTest`
  - `--tests` is for JVM tasks (e.g. `:composeApp:jvmTest`, `testDebugUnitTest`), not `connectedAndroidTest`.

**If flaky tests found →** fix root cause, don't just retry
