---
description: "(Custom) Diagnose and fix bugs or unexpected behavior. Args: [issue description]."
---

# Fix Issue

Diagnose and fix bugs, errors, or unexpected behavior following global KB rules.

**Use for:** Bug fixes, error resolution, behavior corrections, crash fixes.

---

## Input

$ARGUMENTS

- This is the command-specific request; do not ignore it.
- Use it to drive keyword matching for `~/ai-kb/rules/INDEX.md` and rule loading.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Follow parallel execution policy in AGENTS.md (offload heavy work, keep main thread light)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `fix_issue`)
- Read project docs (`doc/`, `AGENTS.md`) before changes
- Focus rules: `error-handling.md`, `architecture.md`, `code-quality.md`, `thread-safety.md`, `testing/execution.md`

---

## Workflow

1. **Reproduce the Issue**
   - Understand the exact steps to reproduce
   - Document expected vs actual behavior
   - Identify the scope (always, sometimes, specific conditions)
   - If you create a plan document, append an "Original Prompt" section at the bottom with the exact prompt

2. **Locate Root Cause**
   - Read error messages and stack traces carefully
   - Trace data flow from input to failure point
   - Check recent changes in affected area
   - Use debugger or logging to narrow down
   - Enumerate real-world corner cases

3. **Write Failing Regression Tests (TDD-first)**
   - Write tests for the enumerated corner cases
   - Confirm tests fail before any production code changes
   - If not feasible, document the exception and proceed

4. **Fix at the Right Level**
   - Fix the root cause, not symptoms
   - If a fix fails, roll back and deepen the analysis before retrying
   - Don't break existing functionality
   - Consider all call sites
   - Prefer extending existing abstractions over introducing parallel logic

5. **Verify Fix**
   - Reproduce original issue → confirm fixed
   - Follow `testing/execution.md` for mandatory test runs and reporting
   - Check edge cases identified in step 2

---

## After Completion

**If fix touches shared code →** verify all callers still work

**If fix involves concurrency →** verify with stress testing

**If UI instrumentation tests changed (Android) →** launch emulator/device and run the target class(es) via `:androidApp:connectedAndroidTest`.
  - Scope instrumentation tests via runner args (NOT `--tests`):
    - `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest,com.foo.OtherTest`
    - (method) `./gradlew :androidApp:connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.foo.MyTest#myTest`
  - `--tests` is for JVM tasks (e.g. `:composeApp:jvmTest`, `testDebugUnitTest`), not `connectedAndroidTest`.

**If security-related →** verify against `~/ai-kb/rules/security.md` checklist

**If user-facing →** verify UX is correct
