---
description: "(Custom) Review code against architecture and quality principles. Args: [scope]."
---

# Review Code

Review code against architecture principles, coding standards, and global KB rules.

**Use for:** Code review, architecture validation, pre-merge checks, quality gates.

---

## Input

Command input (text after the command name)

- Treat it as the request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required).
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `review_code`).
- Read project docs (`doc/`, `AGENTS.md`) before review.
- Focus rules: `architecture.md`, `code-quality.md`, `error-handling.md`, `security.md`, `logging.md` (plus platform rules via INDEX).

---

## Workflow

1. **Identify Scope**
   - List files/components to review.
   - Identify which principles apply.
   - Identify the relevant layers/components/APIs.
   - Load relevant KB rules.

2. **Check Architecture**
   - Layer boundaries respected?
   - Dependencies flow inward?
   - No circular dependencies?
   - Single responsibility followed?

3. **Check Code Quality**
   - File size within limits (ideal 200-400, hard max 500)?
   - Function size within limits (ideal 20-50, hard max 80)?
   - Naming is clear and consistent?
   - No magic numbers/strings?

4. **Check Reuse & Duplication**
   - Search the repo for existing implementations/wrappers/utilities solving the same problem.
   - Identify duplicated logic (copy/paste, parallel abstractions, repeated mapping/validation).
   - Prefer reusing/extending existing code over introducing new primitives.
   - Avoid adding new dependencies when existing ones already cover the need.
   - Ensure shared utilities live in the correct layer/module.

5. **Check Error Handling**
   - All errors handled explicitly?
   - No swallowed exceptions?
   - Errors logged with context?
   - User-facing errors are friendly?

6. **Check Security**
   - No hardcoded secrets?
   - Input validated?
   - Output sanitized?
   - Authentication/authorization correct?

7. **Check Thread Safety**
   - Shared state protected?
   - No race conditions?
   - Proper synchronization?

8. **Report Findings**
   - List violations with file:line references.
   - Categorize by severity (critical/major/minor).
   - Tie each violation to a quoted rule from `<rule_context>` when possible (include rule file reference).
   - Include Reuse & Duplication findings (duplicates found, preferred reuse targets, suggested consolidation steps).
   - Suggest fixes for each issue (prefer minimal, safe refactors).

---

## After Completion

**If critical issues found ->** fix before proceeding.

**If architecture violations ->** discuss with the team.

**If style issues only ->** fix or document exceptions.
