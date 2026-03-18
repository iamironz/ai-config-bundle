---
name: command-parity-router
description: Auto-route natural-language requests to existing ai-kb command workflows with full command parity and multi-workflow composition. Use by default when user does not explicitly call a slash command.
---

# Command Parity Router

Use this skill to remove the need for explicit slash commands. Infer intent from user text, map to command workflows, and compose multiple workflows in one run.

## Mandatory Activation

- For non-trivial requests without an explicit slash command, activate this skill first.
- Do not ask the user to restate the request as a command when intent is inferable.
- Keep execution background-first to preserve main-thread context.

## Full Parity Map (Intent -> Command Workflow)

| Intent pattern | Use command workflow |
|---|---|
| options, compare approaches, "plan first", architecture plan | `~/ai-kb/commands/create_plan.md` |
| brainstorm, ideate, alternatives, tradeoffs, "diverge then converge" | `~/ai-kb/commands/create_plan.md` + `~/ai-kb/rules/diverge-converge.md` |
| execute plan, continue plan, apply existing plan | `~/ai-kb/commands/execute_plan.md` |
| add feature, new capability, enhancement | `~/ai-kb/commands/implement_feature.md` |
| bug, regression, broken behavior, debug, "fix" | `~/ai-kb/commands/fix_issue.md` |
| add missing tests, improve coverage, edge-case tests | `~/ai-kb/commands/implement_tests.md` |
| run tests, verify tests, failing tests | `~/ai-kb/commands/run_tests.md` |
| run build, compile, build failure | `~/ai-kb/commands/run_build.md` |
| deep scan, audit, review quality, duplication | `~/ai-kb/commands/review_code.md` |
| validate against spec/domain requirements | `~/ai-kb/commands/validate_domain.md` |
| inspect runtime behavior, logs, state timeline | `~/ai-kb/commands/validate_runtime.md` |
| uncertain API/error, gather external evidence | `~/ai-kb/commands/research.md` |
| update docs, sync docs with implementation | `~/ai-kb/commands/update_docs.md` |
| update KB/rules/standards | `~/ai-kb/commands/update_rule.md` |
| propose durable KB improvements | `~/ai-kb/commands/suggest_kb_updates.md` |
| create local commit | `~/ai-kb/commands/commit.md` |

## Multi-Workflow Composition (Single Request)

When multiple intents are present, compose workflows in this order:

1. Clarify DoD and constraints (if missing)
2. Research/validation lanes (`research`, `validate_runtime`, `validate_domain`)
3. Planning lane (`create_plan` or `execute_plan`)
4. Implementation lane (`implement_feature` or `fix_issue`)
5. Verification lane (`implement_tests`, `run_tests`, `run_build`, `review_code`)
6. Documentation/KB lane (`update_docs`, `update_rule`, `suggest_kb_updates`)
7. Commit lane (`commit`) only when explicitly requested

Load and apply all matched workflows without requiring separate user messages.

## Execution Contract

- Follow `~/ai-kb/AGENTS.md` operational loop and output `<rule_context>`.
- Enforce background-first parallel subagents for implementation, analysis, and research.
- Keep main thread orchestration-only unless shared mutable state requires sequential execution.
- Translate KB procedure markers literally: `[TASK TOOL]` means call the `task` tool with a focused specialist agent, and `[TASK TOOL - PARALLEL]` means call the `task` tool for all independent lanes in the same turn before main-thread deep work.
- Default specialist map: `codebase-locator` or `thoughts-locator` for locating scope, `codebase-analyzer` or `thoughts-analyzer` for analysis/spec, `code-implementer` for bounded implementation/fixes/refactors/test-writing, `code-reviewer` or `spec-reviewer` for review, `codebase-pattern-finder` for similar implementations, `web-search-researcher` for external evidence, and `evidence-curator` for synthesis.
- On every substantive root request, dispatch specialist `task` lanes before any broad main-thread file-reading, exploration, or implementation work.
- Use `build` only for bounded shared-state transitions after delegated evidence narrows the work; dispatch `code-implementer` for actual coding whenever possible, and keep both `plan` and `build` root lanes out of broad repo reading, exploration, and open-ended implementation.
- Ask DoD questions only when missing criteria materially changes the result; otherwise proceed with explicit assumptions.
- Keep router/workflow bookkeeping internal. Do not narrate lines like `Router: ...`, `Workflow match: ...`, `Active rules: ...`, or KB-status boilerplate to the user unless they explicitly ask for that detail.
- Apply testing priorities from `~/ai-kb/rules/testing/execution.md` (Android instrumented UI tests before jvmTests when relevant).
- For exploratory requests, run divergence then convergence per `~/ai-kb/rules/diverge-converge.md` (default 3-5 branches; skip divergence for deterministic tasks).

## Ambiguity Handling

- If two workflows are equally plausible and choice materially changes output, ask one focused blocking question.
- Otherwise proceed with explicit assumptions and state them briefly.
