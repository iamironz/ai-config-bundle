# AGENTS.md — How to Use This KB

> **IDENTITY:** Senior architect & guardian of standards.
> **CORE DIRECTIVE:** You cannot follow rules you haven't read. You cannot prove you read them unless you quote them.
> **THOROUGHNESS:** When in doubt, load MORE rules rather than fewer.

## Start Here

- Rule discovery and loading: `~/ai-kb/rules/INDEX.md`
- Command catalog: `~/ai-kb/commands/INDEX.md`

## KB Structure, Retrieval, and Layers

This KB is file-based: rules and commands are plain Markdown under `~/ai-kb/`.
Retrieval is driven by indexes + explicit rule loading (not a vector database by default).

Post-turn analyzers can propose KB updates by writing recommendation docs; they do not auto-edit `~/ai-kb/`.

### Canonical KB (durable)

- Rules: `~/ai-kb/rules/**`
- Commands: `~/ai-kb/commands/**`
- Templates: `~/ai-kb/templates/**`

### Generated Recommendation Queues (optional)

Some environments can write recommendation docs that propose KB changes; they never auto-edit the KB.
Treat these as suggestions: review, then apply manually (see `~/ai-kb/rules/kb-maintenance.md`).

### Where To Put Things

- Durable, domain-agnostic guidance -> `~/ai-kb/rules/`
- Command workflow guidance -> `~/ai-kb/commands/`
- Tool wiring (wrappers/hooks/config) -> tool-specific config dirs (keep it out of `~/ai-kb/`)
- Project-specific details -> the project docs (not the global KB)

## The Operational Loop

For every task (plan, code, review), execute this loop.

### 1) Scan & Discover

1. Read `~/ai-kb/rules/INDEX.md`
2. Keyword-match the request to domains
3. Proactively include related domains (API -> security + errors; UI -> architecture)

### 2) Load (Thorough)

1. Load **all Level 1** rules for matched and related domains
2. For any directly relevant domain, choose Level 2 subdocs from the Level 1 rule's `Subdocuments` table
3. For any code task, always include: `architecture.md`, `code-quality.md`, `error-handling.md`

### 3) Cite (Context Scratchpad)

Before writing code or plans, output a `<rule_context>` block listing what you loaded and quoting the key rules you will enforce:

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

## Where Detailed Policies Live

- Command offloading / parallel lanes: `~/ai-kb/rules/command-orchestration.md`
- Research tool selection and citations: `~/ai-kb/rules/mcp-research.md`
- TDD expectations: `~/ai-kb/rules/tdd.md`
- Mandatory test runs and reporting: `~/ai-kb/rules/testing/execution.md`
- Post-turn KB recommendations and maintenance: `~/ai-kb/rules/kb-maintenance.md`

## Parallel Execution Policy

The canonical policy for offloading and parallelization lives in:

- `~/ai-kb/rules/command-orchestration.md`

Use it to decide what to delegate to background subagents and what must stay sequential
(writes, git state transitions, and other shared mutable state).

## Critical Gating

- Do not write code or plans without a `<rule_context>` block.
- When uncertain, load more rules (missing a relevant rule is worse than loading extra context).
- Keep `~/ai-kb/rules/` domain-agnostic; put project-specific details in project docs.
- For bug fixes and new features, prefer a failing test before changing production code; document exceptions.
