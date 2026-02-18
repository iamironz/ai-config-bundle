---
description: "(Custom) Run tests, analyze failures, and fix issues. Args: [test scope or notes]."
---

# Run Tests

Execute tests and analyze results, fixing any failures.

**Use for:** Running test suites, verifying changes, CI validation, coverage checks.

---

## Input

$ARGUMENTS

- This is the command-specific request; do not ignore it.
- Use it to drive keyword matching for `~/ai-kb/rules/INDEX.md` and rule loading.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Follow parallel execution policy in AGENTS.md (offload heavy work, keep main thread light)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `run_tests`)
- Read project docs (`doc/`, `AGENTS.md`) before changes
- Focus rules: `tdd.md`, `test-structure.md`, `testing/execution.md`, `code-quality.md`; platform testing rules via INDEX
- Follow `testing/execution.md` for UI instrumentation/E2E selection and scoping
  - Use runner args to scope (NOT `--tests`): `-Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest`

---

## Workflow

1. **Run Test Suite**
   - Execute appropriate test command
   - Capture full output including stack traces

2. **Analyze Results**
   - Count passed/failed/skipped
   - Identify patterns in failures
   - Check for flaky tests (intermittent failures)

3. **Fix Failures**
   - Prioritize: compilation errors → assertion failures → timeouts
   - For each failure:
     - Understand what the test expects
     - Determine if test or code is wrong
     - Fix the appropriate side

4. **Re-run Until Green**
   - Run failing tests individually first
   - Then run full suite to check for interactions
   - Confirm all tests pass consistently

---

## After Completion

**If all tests pass →** report green status and proceed

**If flaky tests found →** document and fix root cause

**If tests skipped →** document reason or re-enable
