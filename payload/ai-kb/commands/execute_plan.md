---
description: "(Custom) Execute an existing plan without editing it. Args: [plan reference + notes]."
---

# Execute Plan

Execute a previously written plan exactly as specified.

**Use for:** Applying an existing plan without modifying it. Use the plan from the conversation history above the command.

---

## Input

Command input (text after the command name)

- Provide any constraints; if a plan exists in history above the command, use it.
- If no plan exists in history above the command, request missing context (question tool if available) and continue with explicit assumptions when feasible.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required).
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `execute_plan`).
- Read the plan in history above the command in full before acting.
- Do NOT edit the plan unless explicitly asked.
- If the plan includes research tasks, load and follow `~/ai-kb/rules/mcp-research.md` for tool selection and summarize findings before implementation.
- Load `testing/execution.md` for mandatory test runs when code changes are involved.

---

## Workflow

1. **Load Plan**
   - Read the plan end-to-end.
   - Summarize intended steps and proceed in the same response; ask clarifications only for blocking ambiguities.
   - If the plan lacks TDD-first steps for code changes, proceed with TDD-first implementation and note the mismatch (do NOT edit the plan).

2. **Research Tasks (if any)**
   - Identify explicit research items in the plan.
   - Load and follow `~/ai-kb/rules/mcp-research.md` for tool selection.
   - Iterate until results converge or note what is missing.
   - Summarize findings with source URLs before implementing.

3. **Respect Existing Todos**
   - If todos already exist, do NOT recreate them.
   - Mark existing todos as `in_progress` when starting.

4. **Execute Step-by-Step**
   - Execute plan steps in order.
   - Keep changes minimal and aligned to the plan scope.

5. **Validate**
   - Run the specific tests/build steps listed in the plan.
   - Follow `testing/execution.md` for mandatory test runs when code changes occur.
   - Report results and any blockers.

---

## After Completion

**If plan needs changes ->** document the proposed change and proceed only if explicitly requested.

**If unexpected scope found ->** stay within plan scope and log the extra items for follow-up.
