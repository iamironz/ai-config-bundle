# Operational Context Index

**Shared KB:** Canonical rules for OpenCode, Cursor, and Windsurf.

## Quick Keyword Matching

**Scan user request for these keywords to identify which rules to load:**

| Keywords | Load Rules |
|----------|------------|
| `compose`, `viewmodel`, `activity`, `fragment`, `hilt`, `dagger`, `room`, `datastore` | Android |
| `swift`, `swiftui`, `uikit`, `combine`, `async/await`, `actor`, `xcode`, `objc` | iOS |
| `coroutine`, `flow`, `suspend`, `channel`, `dispatcher`, `kmp`, `multiplatform` | Kotlin |
| `layer`, `domain`, `repository`, `usecase`, `dto`, `mapper`, `module`, `dependency` | Architecture |
| `refactor`, `cleanup`, `metrics`, `complexity`, `directory`, `file size` | Code Quality |
| `auth`, `token`, `secret`, `api key`, `validation`, `sanitize`, `injection` | Security |
| `thread`, `mutex`, `lock`, `atomic`, `race`, `concurrent`, `parallel` | Concurrency |
| `test`, `mock`, `stub`, `fixture`, `assertion`, `coverage`, `tdd` | Testing |
| `error`, `exception`, `http status`, `retry`, `fallback`, `circuit breaker` | Errors |

---

## Domain Clusters

| Domain | Level 1 | Level 2 (Load if relevant) |
|--------|---------|---------------------------|
| **Android** | `android.md` | `android/compose.md`, `android/coroutines.md`, `android/data.md`, `android/lifecycle.md`, `android/navigation.md` |
| **iOS** | `ios.md` | `ios/architecture.md`, `ios/swift-concurrency.md`, `ios/swiftui.md`, `ios/testing.md` |
| **Kotlin** | `kotlin.md` | `kotlin/coroutines.md`, `kotlin/flow.md`, `kotlin/modern.md` |
| **Architecture** | `architecture.md` | `architecture/layers.md`, `architecture/modularization.md`, `architecture/patterns.md` |
| **Code Quality** | `code-quality.md` | `code-quality/refactoring.md` (Directory Rules), `code-quality/metrics.md` |
| **Security** | `security.md` | `security/api.md`, `security/mobile.md` |
| **Concurrency** | `thread-safety.md` | `thread-safety/patterns.md`, `thread-safety/bugs.md` |
| **Testing** | `tdd.md` | `test-structure.md`, `testing/execution.md` |
| **Errors** | `error-handling.md` | `error-handling/http.md`, `error-handling/resilience.md` |

---

## Loading Protocol

1. **Match keywords** from user request to table above
2. **Load ALL Level 1 files** for matched domains AND related domains
3. **Load ALL Level 2 files** for domains directly relevant to the task
4. **Always load:** `architecture.md`, `code-quality.md`, `error-handling.md` for any code task
5. **Proactively expand:** If task mentions "API", also load security, error-handling. If "UI", also load architecture.

## Cross-Cutting Rules

- `mcp-research.md` — MCP tool selection and research flow.
- `command-orchestration.md` — command-level offloading model and skill bundles.
- `kb-maintenance.md` — process post-turn KB recommendations and keep index/commands aligned.

> **THOROUGHNESS OVER EFFICIENCY:** When uncertain whether a domain applies, LOAD IT. The cost of missing a relevant rule far exceeds the cost of reading extra context. Better to cite 10 rules than miss 1 critical one.
>
> **NO PAUSE RULE:** After emitting `<rule_context>`, continue with the task in the same response. Never stop and wait for “continue” unless explicitly blocked by missing information.

---

## KB Self‑Repair Protocol

- If an initial implementation is wrong or causes regressions, you MUST add a corrective clause to the appropriate knowledge doc.
- Scope it correctly:
  - Domain‑agnostic (architecture, errors, testing, security, quality) → update `~/ai-kb/rules/` (Level 1/2).
  - Platform/domain rules (Android/iOS/Kotlin) → update the matching domain rule file in `~/ai-kb/rules/<domain>/`.
  - Project‑specific domain → update the project’s docs (`doc/`, `AGENTS.md`, specs). Do NOT add project details to global rules.
- The corrective clause must describe the correct approach and follow the existing style/section.
- If a rule is outdated or incorrect, update or remove it immediately as part of the fix.
