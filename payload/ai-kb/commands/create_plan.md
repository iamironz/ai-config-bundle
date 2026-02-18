---
description: "(Custom) Create a plan with options and research. Args: [plan request]."
---

# Create Plan

Create a plan only after presenting options and gathering feedback. Write the plan into the conversation history. Do not output implementation files, but you MUST update relevant task tracking or context files to persist the plan and decisions.

**Use for:** Planning new features, refactors, or multi-step changes.

---

## Input

Command input (text after the command name)

- Provide the planning request and scope.
- If the request is ambiguous, use the `question` tool to clarify per `~/ai-kb/AGENTS.md`
- If still ambiguous after responses, proceed with reasonable assumptions and list them up front

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `create_plan`)
- Read project docs (`doc/`, `AGENTS.md`) before planning
- If research is needed, load and follow `~/ai-kb/rules/mcp-research.md` for tool selection

---

## Workflow

1. **Present Options First**
   - Provide ≥2 options with pros/cons
   - Ask 3–4 targeted questions using the `question` tool per `~/ai-kb/AGENTS.md`
   - Do NOT write the plan until feedback is received

2. **Gather Research (if needed)**
   - Load and follow `~/ai-kb/rules/mcp-research.md` for tool selection
   - Iterate until results converge or note gaps
   - Summarize findings briefly, cite source URLs

3. **Write the Plan (after feedback)**
   - High-level architecture and component interactions only
   - No code blocks in planning docs
   - Include TDD-first steps (edge cases → tests → implementation)
   - Include phases with status markers (🔄/🚧/✅)
   - Add dependencies and integration points

4. **Finalize**
   - Append **"## Original Prompt"** at the bottom with the exact prompt used

---

## After Completion

**If requirements change →** restart from step 1

**If plan scope grows →** note the expansion and proceed within the original scope unless explicitly asked to expand
