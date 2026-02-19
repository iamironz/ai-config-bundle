# Operational Context Index

**Shared KB:** Canonical rules for tools that load `~/ai-kb/`.

## KB Retrieval (ck-first)

Preferred workflow:

1. Use ck (MCP server `ck`) to search across `~/ai-kb` for the most relevant rules/commands (high threshold; run multiple searches before lowering threshold).
2. Follow only the small set of top matches (high relevance) and cite them in `<rule_context>`.
3. Use this index as a fallback if ck is unavailable.

## Fallback Keyword Matching (when ck is unavailable)

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

| Domain | Level 1 | Level 2 discovery |
|--------|---------|------------------|
| **Android** | `android.md` | See `android.md` -> `Subdocuments` table |
| **iOS** | `ios.md` | See `ios.md` -> `Subdocuments` table |
| **Kotlin** | `kotlin.md` | See `kotlin.md` -> `Subdocuments` table |
| **Architecture** | `architecture.md` | See `architecture.md` -> `Subdocuments` table |
| **Code Quality** | `code-quality.md` | See `code-quality.md` -> `Subdocuments` table |
| **Security** | `security.md` | See `security.md` -> `Subdocuments` table |
| **Concurrency** | `thread-safety.md` | See `thread-safety.md` -> `Subdocuments` table |
| **Testing** | `tdd.md` | See `tdd.md` -> `Subdocuments` table |
| **Errors** | `error-handling.md` | See `error-handling.md` -> `Subdocuments` table |

---

## Loading Protocol

1. Use ck search (preferred) to identify relevant rules/commands for the request.
2. If ck is unavailable, **match keywords** from user request to table above.
3. **Load ALL Level 1 files** for matched domains AND related domains.
4. For each directly relevant domain, load the Level 2 subdocs listed in the Level 1 rule's `Subdocuments` table.
5. **Always load:** `architecture.md`, `code-quality.md`, `error-handling.md` for any code task.
6. **Proactively expand:** If task mentions "API", also load security, error-handling. If "UI", also load architecture.

## Cross-Cutting Rules

- `kb-retrieval.md` — ck-first KB discovery and indexing expectations.
- `mcp-research.md` — MCP tool selection and research flow.
- `command-orchestration.md` — command-level offloading model and skill bundles.
- `kb-maintenance.md` — process post-turn KB recommendations and keep index/commands aligned.
- `defense-in-depth.md` — validation layers, allowlist-first thinking, trust boundaries.
- `fail-fast.md` — guard clauses, validation ordering, error aggregation strategies.
- `logging.md` — structured log format and anti-patterns (no secrets/PII).

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
