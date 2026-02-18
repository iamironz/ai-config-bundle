---
description: "(Custom) Implement new features or enhancements. Args: [feature request]."
---

# Implement Feature

Implement a new feature or enhancement following architecture principles and global KB rules.

**Use for:** New features, enhancements, new screens, new API endpoints, new components.

---

## Input

Command input (text after the command name)

- Treat it as the request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `implement_feature`)
- Read project docs (`doc/`, `AGENTS.md`) before changes
- If research is needed, load and follow `~/ai-kb/rules/mcp-research.md` for tool selection
- Focus rules: `architecture.md`, `code-quality.md`, `error-handling.md`, `security.md`, `testing/execution.md`, INDEX rules

---

## Workflow

1. **Understand Requirements**
   - Parse the feature request
   - Identify affected layers (UI, domain, data, network)
   - Identify required components/APIs and integration points
   - List components to create or modify

2. **Design Before Code**
   - Define interfaces/protocols first
   - Search the repo for existing implementations/wrappers/utilities in the target layer(s)
   - Check existing dependencies before adding new ones; prefer reuse over duplication
   - Plan data flow between layers
   - Enumerate real-world corner cases
   - Identify edge cases and error scenarios
   - If you create a plan document, append an "Original Prompt" section at the bottom with the exact prompt

3. **Write Failing Tests (TDD-first)**
   - Write tests for the enumerated corner cases
   - Confirm tests fail before any production code changes
   - If not feasible, document the exception and proceed

4. **Implement Layer by Layer**
   - Start from the innermost layer (domain/models)
   - Move outward (use cases → repositories → UI)
   - Follow single responsibility principle

5. **Handle Errors Properly**
   - Use Result types or sealed classes for error states
   - Never swallow exceptions silently
   - Log errors with context

6. **Verify Tests**
   - Follow `testing/execution.md` for mandatory test runs and reporting
   - Add any missing edge-case coverage

---

## After Completion

**If new public API →** verify documentation exists

**If UI changes →** verify accessibility considerations

**If data changes →** verify migration path for existing data

**If security-related →** verify against `~/ai-kb/rules/security.md` checklist
