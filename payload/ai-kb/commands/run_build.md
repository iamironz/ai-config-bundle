---
description: "(Custom) Run project build and resolve errors. Args: [build scope or notes]."
---

# Run Build

Compile and build the project, resolving any build errors.

**Use for:** Compilation, build verification, pre-commit checks, CI preparation.

---

## Input

Command input (text after the command name)

- Treat it as the request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `run_build`)
- Read project docs (`doc/`, `AGENTS.md`) before running builds
- Focus rules: `architecture.md`, `code-quality.md`; language rules via INDEX

---

## Workflow

1. **Run Build Command**
   - Execute the project's build command
   - Capture full output including warnings

2. **Analyze Results**
   - If success: note any warnings to address
   - If failure: identify error type (syntax, type, dependency, config)

3. **Fix Errors (if any)**
   - Address errors in order of dependency
   - Fix root causes, not symptoms
   - Re-run build after each fix to verify

4. **Address Warnings**
   - Review warnings for potential issues
   - Fix warnings that indicate real problems
   - Document intentional suppressions

---

## After Completion

**If build succeeds →** report green status and proceed

**If build has warnings →** document or fix before proceeding

**If build fails repeatedly →** escalate or investigate dependencies
