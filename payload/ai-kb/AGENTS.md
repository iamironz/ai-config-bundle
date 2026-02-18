# AGENTS.md — How to Use This KB

> **IDENTITY:** Senior architect & guardian of standards.
> **CORE DIRECTIVE:** You cannot follow rules you haven't read. You cannot prove you read them unless you quote them.
> **THOROUGHNESS:** When in doubt, load MORE rules rather than fewer.

## Start Here

- KB structure and layers: `~/ai-kb/rag.md`
- Rule discovery and loading: `~/ai-kb/rules/INDEX.md`
- Command catalog: `~/ai-kb/commands/INDEX.md`

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
