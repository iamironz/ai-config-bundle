# Command Orchestration Guidelines

## Purpose

- Single source of truth for command-level offloading and skill activation.
- Keep the main thread small and context-efficient.
- Push heavy work to background subagents by default.

## Main Thread Contract

- Main thread is orchestration-only.
- Main thread may parse intent, dispatch tasks, merge outputs, and report.
- Main thread must not perform deep analysis, long research loops, or implementation work when those can be delegated.
- Prefer background subagents for all heavy work.

## Standard Offloading Loop

1. Load the command skill bundle listed below.
2. Decompose work into independent lanes.
3. Dispatch independent lanes in parallel background subagents.
4. Merge results in main thread and redelegate unresolved lanes.
5. Before completion claims, run verification-before-completion checks.

## Skill Bundles by Command

| Command | Skill bundle (ordered) | Typical offload lanes |
|--------|-------------------------|-----------------------|
| `commit` | `requesting-code-review` -> `verification-before-completion` | diff review, commit grouping proposals |
| `create_plan` | `brainstorming` -> `writing-plans` -> `dispatching-parallel-agents` | requirements extraction, option research, risk scan |
| `fix_issue` | `systematic-debugging` -> `test-driven-development` -> `dispatching-parallel-agents` -> `verification-before-completion` | repro analysis, log triage, root-cause probes |
| `implement_feature` | `brainstorming` -> `writing-plans` -> `subagent-driven-development` -> `test-driven-development` -> `verification-before-completion` | codebase mapping, implementation slices, review passes |
| `execute_plan` | `executing-plans` -> `subagent-driven-development` -> `dispatching-parallel-agents` -> `verification-before-completion` | per-step execution, spec review, code quality review |
| `implement_tests` | `test-driven-development` -> `dispatching-parallel-agents` -> `verification-before-completion` | test target discovery, fixture reuse scan, failing-test lanes |
| `research` | `dispatching-parallel-agents` -> `brainstorming` | sub-question search lanes, source synthesis |
| `run_build` | `systematic-debugging` -> `dispatching-parallel-agents` -> `verification-before-completion` | error bucket triage, fix candidates |
| `run_tests` | `systematic-debugging` -> `dispatching-parallel-agents` -> `verification-before-completion` | failing test clusters, root-cause lanes |
| `update_docs` | `dispatching-parallel-agents` -> `verification-before-completion` | changed-surface scan, affected-doc scan |
| `update_rule` | `writing-skills` -> `verification-before-completion` | rule audit, structure validation |
| `suggest_kb_updates` | `dispatching-parallel-agents` -> `verification-before-completion` | history window summary, target mapping, dedupe scan |
| `validate_domain` | `requesting-code-review` -> `dispatching-parallel-agents` -> `verification-before-completion` | spec mapping lanes by bounded context |
| `review_code` | `requesting-code-review` -> `dispatching-parallel-agents` -> `verification-before-completion` | architecture, quality, security lanes |
| `validate_runtime` | `systematic-debugging` -> `requesting-code-review` -> `dispatching-parallel-agents` -> `verification-before-completion` | logs, state, timeline lanes |

## Parallelization Rules

- Parallelize whenever lanes are independent and do not share mutable state.
- Keep write-conflicting lanes sequential.
- Keep git state transitions sequential.
- Delegate first, integrate second.
