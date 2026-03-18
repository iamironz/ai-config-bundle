# TDD Cycle

Quick reference for test-driven development. See subdocs for test structure and execution.

## Subdocuments

| Topic | File | Key Content |
|-------|------|-------------|
| Test Structure | `testing/structure.md` | AAA pattern, naming, isolation, flaky prevention |
| Test Execution | `testing/execution.md` | Mandatory test runs + reporting expectations |

## The Cycle

**RED:** Write failing test first
- Test describes desired behavior
- Test MUST fail initially

**GREEN:** Make test pass
- Write minimal implementation
- Don't optimize yet

**REFACTOR:** Improve quality
- Clean up code
- Apply patterns
- Tests prove safety

## When Required
- Bug fixes
- New features
- Refactoring
- Theory validation

**Rule:** For bug fixes and new features, write failing tests BEFORE changing production code. If not feasible, document why and proceed with best effort.

## When NOT Required
- Documentation
- Throwaway code, spikes, POCs
- Simple CRUD operations
- Unclear/evolving requirements (spike first)

## Edge Case First
- List real-world corner cases and domain constraints before writing tests
- Write tests for those edge cases FIRST, then implement
- If edge cases are unclear, ask questions or run a short research spike

## TDD Fit by Code Type
| Code | Fit | Notes |
|------|-----|-------|
| Domain logic | Excellent | Ideal candidate |
| Calculations | Excellent | Test edge cases |
| Layer boundaries | Good | Defines interfaces |
| External integrations | Limited | Use test doubles |
| GUI/UI behavior | Good | Prefer instrumentation tests for UI changes |

**Execution rules:** See `testing/execution.md` for mandatory test runs and UI instrumentation requirements.

## Workflow
1. RED: Write tests for real-world edge cases → Run → FAILS
2. GREEN: Minimal implementation → Run → PASSES
3. REFACTOR: Clean up + expand coverage → All pass

## Checklist
- Enumerate real-world corner cases first
- Write failing test FIRST
- Verify fails for right reason
- Minimal code to pass
- Verify passes
- Refactor if needed
- Commit test + fix together

**Rule:** No failing test first = not TDD.

---

Advanced testing techniques live in `testing/structure.md` (property-based, mutation, contract, snapshot).

## Anti-Patterns
- **The Liar** — passes without meaningful assertions
- **The Giant** — multiple behaviors in one test
- **The Mockery** — so many mocks nothing real is tested
- **Evergreen** — tests that can never fail
- **Skipping Refactor** — passing but messy code
- **Testing the Mock** — verifying mock behavior, not real code
- **Ice Cream Cone** — more E2E than unit tests (invert the pyramid)
