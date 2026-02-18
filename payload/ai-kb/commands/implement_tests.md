---
description: "(Custom) Create tests using TDD and global rules. Args: [test request]."
---

# Implement Tests

Write tests for existing or new functionality following TDD principles and global KB rules.

**Use for:** Unit tests, integration tests, UI tests, test coverage improvements.

---

## Input

Command input (text after the command name)

- Treat it as the request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `implement_tests`)
- Read project docs (`doc/`, `AGENTS.md`) before changes
- Focus rules: `tdd.md`, `testing/structure.md`, `testing/execution.md`, `code-quality.md`; platform testing rules via INDEX
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
- If Android UI/instrumentation tests are involved: launch emulator/device and follow `~/ai-kb/rules/android/testing.md` for `connectedAndroidTest` scoping (runner args)

**If new test utilities created →** document in test README

**If mocks added →** verify they match real implementation contracts

**If flaky tests found →** fix root cause, don't just retry
