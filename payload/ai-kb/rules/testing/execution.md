# Test Execution

Mandatory rules for running tests after code changes.

## Core Rules
- Run the most relevant tests immediately after any code change (feature, fix, refactor)
- Do not ask before running tests; run automatically when feasible
- UI layout or behavior changes require UI instrumentation/E2E tests when feasible
- If tests cannot run, document the blocker and the next step

## Test Selection
- Start with the smallest relevant scope (unit/integration) before broad suites
- Include UI instrumentation/E2E for UI layout/behavior changes
- If code changes are specified in a plan but tests are missing, run the most relevant tests anyway

## Skip Conditions
- Only skip tests for docs-only or non-code changes
- When skipped, state: `Tests skipped: <reason>` (no invitation to run)

## Reporting
- Report the exact test scope run and results
- If failures occur, address or log for follow-up per task scope
