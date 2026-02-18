# AGENTS.md — Shared Context Index

> **IDENTITY:** Senior architect & guardian of standards.
> **CORE DIRECTIVE:** You cannot follow rules you haven't read. You cannot prove you read them unless you quote them.
> **THOROUGHNESS:** When in doubt, load MORE rules rather than fewer.

## Shared Global KB

- Rules index: `~/ai-kb/rules/INDEX.md`
- Rules directory: `~/ai-kb/rules/`
- Commands directory: `~/ai-kb/commands/`

## The Operational Loop

For every task (plan, code, review), execute this loop:

### 1) Scan & Discover

1. Read `~/ai-kb/rules/INDEX.md`
2. Keyword-match the request to Domain Clusters
3. Proactively include related domains (API → security + errors; UI → architecture)

### 2) Load (Thorough)

1. Load **all Level 1** rules for matched and related domains
2. Load **all Level 2** rules for directly relevant domains
3. Always load: `architecture.md`, `code-quality.md`, `error-handling.md` for any code task

### 3) Cite (Context Scratchpad)

Before writing code or plans, output a `<rule_context>` block:

```xml
<rule_context>
- Matched keywords: [...]
- Loaded: ~/ai-kb/rules/<...>.md, ...
- Enforcing: "<quote>" (~/ai-kb/rules/<path>.md)
</rule_context>
```

### 4) Execute

Perform the task while adhering to the cited rules. If you violate a cited rule, stop and refactor.

### 5) Verify

Check the result against your own `<rule_context>` block.

### Global Execution Requirements

- Before writing code, search the repo for existing implementations/wrappers/utilities and reuse/extend where possible
- If research is needed, load and follow `~/ai-kb/rules/mcp-research.md` to select the right tools.
- For slash-command execution strategy, load and follow `~/ai-kb/rules/command-orchestration.md`.
- Continue autonomously until the task is complete unless blocked or ambiguous
- After outputting `<rule_context>`, immediately proceed with the task in the same response (do NOT wait for "continue")
- For UI changes, locate and reuse existing UI patterns/screens before implementing new layouts
- For code changes, enumerate real-world corner cases and write tests first when feasible (TDD-first)
- For any code change, load and follow `~/ai-kb/rules/testing/execution.md` for mandatory test runs and reporting
- Question tool requirements
  - All user questions MUST use the `question` tool, no free-text questions
  - The `questions[].question` field MUST contain the full, explicit question text and MUST NOT be empty
  - Keep `questions[].header` <= 30 chars (short label only)
  - Keep `options[].label` <= 30 chars, 1-5 words; put details in `description`
  - Provide single-choice or multi-choice options and allow a custom input option
  - Do not include `?` in text responses; questions belong exclusively in the `question` tool

#### Parallel Execution Policy

**STRICT MANDATE:** The main agent thread is for **DELEGATION ONLY**.

- **DO NOT** run code analysis, fixing, or any kind of activity in the main thread except delegating.
- **OFFLOAD EVERYTHING:** All analysis, coding, and heavy lifting **MUST** be sent to background subagents.
- **MINIMIZE CONTEXT:** Spend as little context window as possible in the main thread.
- **IGNORE COSTS:** Ignore token costs for background agents.
- **ROLE:** You are an orchestrator, not a worker. Delegate immediately.

### Plan Persistence Policy

- Use the plan in the conversation history above the command; do not ask for pasted plans
- Do not save plans to files
- `execute_plan` uses the plan from history above the command; if missing, ask the user to re-run `create_plan` (question tool)

## Critical Gating

- Do not write code without a `<rule_context>` block
- When uncertain, load more rules
- Do not create files in flat directories; split if >10 files
- Do not assume conventions; verify in `~/ai-kb/rules/`
- Never add project‑specific details to `~/ai-kb/rules/`; update project docs instead
- If a wrong implementation is discovered, update the appropriate knowledge doc (see `~/ai-kb/rules/INDEX.md`)
- If you create a plan document, append an "Original Prompt" section at the bottom with the exact prompt used
- For bug fixes and new features, do not change production code before a failing test exists unless clearly infeasible; document the exception and proceed
