---
description: "(Custom) Validate code against domain specs and business rules. Args: [scope]."
---

# Validate Domain

Validate code against project-specific domain specifications and business rules.

**Use for:** Domain logic review, business rule verification, specification compliance.

---

## Input

Command input (text after the command name)

- Treat it as the command-specific request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `validate_domain`)
- Read project domain docs (`doc/`, specs) before review
- Focus rules: `architecture.md`, `defense-in-depth.md`, `error-handling.md`

---

## Workflow

1. **Load Domain Documentation**
   - Read project's domain specifications
   - Identify relevant business rules
   - List constraints and invariants

2. **Map Code to Domain**
   - Identify domain entities in code
   - Trace business rule implementations
   - Find constraint enforcement points

3. **Validate Alignment**
   - Does code match domain language?
   - Are all business rules implemented?
   - Are constraints enforced at correct boundaries?
   - Are edge cases handled per specification?

4. **Check Domain Isolation**
   - Domain layer free of infrastructure concerns?
   - Business logic not leaked to UI/data layers?
   - Domain entities are pure (no framework dependencies)?

5. **Report Findings**
   - List misalignments with specification references
   - Identify missing business rules
   - Suggest corrections

---

## After Completion

**If domain violations found →** fix to match specification

**If specification unclear →** use the `question` tool per `~/ai-kb/AGENTS.md`

**If specification wrong →** propose specification update
