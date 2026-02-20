---
description: "(Custom) Create a plan with options and research. Args: [plan request]."
---

# Create Plan

Create a plan in the conversation history and proceed autonomously. Do not create plan files unless explicitly requested.

**Use for:** Planning new features, refactors, or multi-step changes.

---

## Input

Command input (text after the command name)

- Provide the planning request and scope.
- If the request is ambiguous, ask one blocking clarification (question tool if available).
- If clarification is unavailable or non-blocking, proceed with reasonable assumptions and list them up front.

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
   - Ask only essential clarifications (question tool if available); avoid blocking on optional feedback
   - Proceed to a first-draft plan in the same response with explicit assumptions

2. **Gather Research (if needed)**
   - Load and follow `~/ai-kb/rules/mcp-research.md` for tool selection
   - Iterate until results converge or note gaps
   - Summarize findings briefly, cite source URLs

3. **Write the Plan**
   - High-level architecture and component interactions only
   - No code blocks in planning docs
   - Include TDD-first steps (edge cases → tests → implementation)
   - Include phases with status markers (🔄/🚧/✅)
   - Add dependencies and integration points

4. **Refine (if feedback arrives)**
   - Incorporate user feedback as a revision pass without restarting unless scope changes materially

5. **Finalize**
   - Append **"## Original Prompt"** at the bottom with the exact prompt used

---

## After Completion

**If requirements change →** restart from step 1

**If plan scope grows →** note the expansion and proceed within the original scope unless explicitly asked to expand
