# AGENTS.md — Local Environment Overview

This file documents the OpenCode and Cursor CLI setup, shared KB locations, and the RAG execution flow used across tools.

## Shared KB (Canonical)

- Global KB index: `~/ai-kb/AGENTS.md`
- Rules index: `~/ai-kb/rules/INDEX.md`
- Rules directory: `~/ai-kb/rules/`
- Commands directory: `~/ai-kb/commands/`

## RAG Index

- **Operational loop:** `~/ai-kb/AGENTS.md`
- **Rule selection:** `~/ai-kb/rules/INDEX.md`
- **TDD:** `~/ai-kb/rules/tdd.md`
- **Test execution:** `~/ai-kb/rules/testing/execution.md`
- **Research:** `~/ai-kb/rules/mcp-research.md` (optional guidance)
- **Plan commands:** `~/ai-kb/commands/create_plan.md`, `~/ai-kb/commands/execute_plan.md`

## Tool Setup

### OpenCode
- Project config: `<project>/opencode.json` (generated/merged by this installer)
- Optional global config: `~/.config/opencode/opencode.json` (home install)
- Rules are loaded directly from the canonical KB: `ai-kb/rules/**` (project) or `~/ai-kb/rules/**` (home)
- Model selection is configured per-developer; this bundle avoids pinning provider/model IDs

### Cursor CLI
- Config: `~/.cursor/cli-config.json`
- Always-apply rules: `~/.cursor/rules/ai-kb.mdc`

## Command Index (Shared)

- `create_plan` — gather options and write plan to conversation history
- `execute_plan` — execute plan from conversation history
- `implement_feature` — implement new features with TDD-first
- `fix_issue` — diagnose and fix bugs with TDD-first
- `implement_tests` — write tests and run them immediately
- `run_tests` — run tests with platform-specific guidance
- `run_build` — run build with platform-specific guidance
- `commit` — commit changes with structured approval
- `update_rule` — update shared KB rules
- `update_docs` — update documentation
- `suggest_kb_updates` — propose KB updates from durable learnings
- `review_code` — review code against architecture and quality rules
- `validate_domain` — validate domain correctness
- `validate_runtime` — validate runtime behavior

## Mandatory RAG Behaviors

- Always output `<rule_context>` before planning or coding
- Always load `architecture.md`, `code-quality.md`, `error-handling.md` for code tasks
- All user questions MUST use the `question` tool
- The `questions[].question` field MUST contain the full, explicit question text and MUST NOT be empty
- Keep `questions[].header` <= 30 chars (short label only)
- Keep `options[].label` <= 30 chars, 1-5 words; put details in `description`
- Every question must provide single-choice or multi-choice options and allow a custom input option
- Do not include the question mark character in text responses; questions belong exclusively in the question tool

## Plan Handling

- Plans live in the conversation history above the command
- Do not save plans to files
- If plan context is missing, rerun `create_plan`

## Testing Execution

- Follow `~/ai-kb/rules/testing/execution.md`
- Run the most relevant tests immediately after code changes
- UI layout or behavior changes require instrumentation/E2E tests when feasible

## MCP Research

- Prefer official library/framework documentation for APIs and signatures.
- When errors persist or behavior is unclear, use available research tools to search and fetch sources; cite URLs.
- Never include secrets or sensitive proprietary details in external queries; redact before searching.

## Session Wrap-Up (Safe Defaults)

The defaults in this bundle are conservative: avoid irreversible actions unless the user explicitly asks.

1. **Summarize** what changed and why.
2. **Verify** locally:
   - run the most relevant tests/builds when feasible
   - report what you ran and the result
3. **Inspect repo state** before proposing any mutation:
   - show a short `git status` + `git diff --stat` summary
4. **Commits are opt-in**:
   - do not create commits unless the user explicitly requests it
   - if requested, follow the `commit` command guidance and ask for approval before running write commands
5. **Remote actions are opt-in**:
   - do not run commands that change a remote (push, force-push, remote branch deletion)
   - if requested, provide a dry-run preview of the exact commands and wait for explicit confirmation
