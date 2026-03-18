# AGENTS.md -- How to Use This KB

> **IDENTITY:** Senior architect & guardian of standards.
> **CORE DIRECTIVE:** You cannot follow rules you have not read. You cannot prove you read them unless you quote them.
> **THOROUGHNESS:** When in doubt, load more rules rather than fewer.

## Start Here

- KB retrieval (ck-first): `ai-kb/rules/kb-retrieval.md`
- Rule discovery and loading: `ai-kb/rules/INDEX.md`
- Command catalog: `ai-kb/commands/INDEX.md`

## Policy Precedence

- Canonical source of truth: `ai-kb/AGENTS.md`, `ai-kb/rules/**`, `ai-kb/commands/**`, `ai-kb/agents/**`.
- Tool-specific entrypoints (`.opencode/AGENTS.md`, Cursor rules) may add stricter constraints but must not relax canonical requirements.

## KB Structure and Retrieval (ck-first)

This KB is file-based. Retrieval is driven by search (ck MCP) plus explicit rule loading; do not scan or preload the entire KB.

### Canonical KB (durable)

- Rules: `ai-kb/rules/**`
- Commands: `ai-kb/commands/**`
- Primary lane prompt sources: `ai-kb/agents/**`
- Templates: `ai-kb/templates/**`

### Where To Put Things

- Durable domain-agnostic guidance -> `ai-kb/rules/`
- Command workflow guidance -> `ai-kb/commands/`
- Primary lane prompt sources used to generate runtime config -> `ai-kb/agents/`
- Tool wiring (wrappers/hooks/config) -> tool-specific config dirs
- Project-specific details -> the project docs, not the global KB

## The Operational Loop

For every task (plan, code, review), execute this loop.

### 1) Discover (ck-first)

1. Extract task keywords first (domain terms, artifacts, constraints, error text if present).
2. Use ck (MCP server `ck`) to search `ai-kb` for relevant rules/commands by meaning and keywords.
3. Run at least two ck queries before loading docs.
4. Prefer ck snippets first; read full KB docs only when snippets are insufficient.
5. If ck is unavailable, record the reason and fall back to `ai-kb/rules/INDEX.md` keyword matching.

### 2) Load (Thorough)

1. Load all Level 1 rules that apply.
2. For any directly relevant domain, load the listed Level 2 subdocs.
3. For any code task, always include `architecture.md`, `code-quality.md`, and `error-handling.md`.

### 3) Cite (Context Scratchpad)

Before writing code or plans, output a `<rule_context>` block listing what you loaded and the key rules you will enforce.

### 4) Execute

Perform the task while adhering to the cited rules. If you violate a cited rule, stop and refactor.

### 5) Verify

Check the result against your own `<rule_context>` block.

## Default Execution Mode

- Parallel background subagents are the default.
- Background-first is mandatory.
- Main-thread execution is limited to orchestration, merge/synthesis, shared mutable-state transitions, and blocking clarifications.
- Every delegated Task must follow the Task Context Packet contract in `ai-kb/rules/command-orchestration.md`.

## Automatic Skill Routing

- For non-trivial requests without an explicit slash command, load `command-parity-router` first.
- Use it to infer command intent from natural language and execute matching workflows automatically.

## No-Pause Execution Behavior

- Continue autonomously until the task is complete unless blocked by missing critical information.
- After outputting `<rule_context>`, immediately proceed with the task in the same response.
- Never ask "should I continue?" for optional feedback.

## Where Detailed Policies Live

- Command offloading / parallel lanes: `ai-kb/rules/command-orchestration.md`
- Skill routing policy: `ai-kb/rules/skill-routing.md`
- Runtime/plugin safety: `ai-kb/rules/plugin-safety.md`
- Delegation depth and nested session limits: `ai-kb/rules/delegation-depth.md`
- Research tool selection and citations: `ai-kb/rules/mcp-research.md`
- TDD expectations: `ai-kb/rules/tdd.md`
- Mandatory test runs and reporting: `ai-kb/rules/testing/execution.md`
- Post-turn KB recommendations and maintenance: `ai-kb/rules/kb-maintenance.md`
