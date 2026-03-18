# Command Orchestration Guidelines

## Purpose

- Single source of truth for command-level offloading and skill activation.
- Keep the main thread small and context-efficient.
- Push heavy work to background subagents by default.
- Preserve main-thread context by forcing deep work into background lanes first.

## Main Thread Contract

- Main thread is orchestration-only (hard requirement).
- Main thread may parse intent, dispatch tasks, merge outputs, and report.
- Main thread must not perform deep analysis, long research loops, implementation work, or broad file exploration for substantive tasks; delegate those by default and keep root work to orchestration, merge, and tightly bounded shared-state transitions.
- **Default execution mode is parallel background subagents.** Unless the user explicitly requests sequential/main-thread execution, delegate implementation, analysis, and research to background subagents first. The user should never need to type "use background/parallel subagents" - this is the assumed default.
- Background-first is mandatory: if work can be delegated, it must be delegated.
- Allowed main-thread exceptions are limited to shared mutable-state transitions (conflict-prone writes, git state transitions), final synthesis/reporting, and blocking clarifications.
- Continue autonomously with next steps after subagent completion. Do not pause to ask "should I continue?" - proceed until the task is done or a blocking ambiguity is hit.

## Runtime Delegation Exceptions

- Runtime-enforced safety limits override the generic background-first default when the two conflict, but they should still keep root `plan` and `build` lanes as delegation-first as possible.
- Internal/control-plane sessions must work directly and must never spawn subagents.
- If session depth is at the runtime limit, keep work direct in the current lane and do not delegate again.
- On substantive root requests, runtime should require specialist `task` lanes before broad main-thread search or mutation tools and keep those tools gated or rewritten until delegation is satisfied.
- If lineage is unknown, use runtime classification first: infer child depth from active task context or task metadata when available; otherwise treat user-facing sessions as new roots and internal/control sessions as direct-only.
- See `delegation-depth.md` for depth ceilings and `plugin-safety.md` for internal-session and cascade-prevention rules.

## Procedural Command Docs (Primary)

Each command doc (`ai-kb/commands/*.md`) contains a `## Procedure (follow step by step - do NOT skip)` section with numbered steps annotated `[MAIN THREAD]`, `[TASK TOOL]`, or `[TASK TOOL - PARALLEL]`.

- Steps marked `[TASK TOOL]` MUST use the Task tool. No exceptions.
- Steps marked `[TASK TOOL - PARALLEL]` MUST launch ALL listed Tasks in a SINGLE message.
- Steps marked `[MAIN THREAD]` stay on main thread.
- The Procedure section is the primary execution contract. Follow it literally.

## Task Context Packet (Mandatory)

- Every Task dispatch MUST include a context packet with: objective + explicit done criteria (DoD), scope boundaries + assumptions, relevant artifacts (paths/logs/errors/diffs/prior findings), constraints/rules, and expected output format.
- Keep packet content concise but sufficient for independent execution; do not rely on implied context from prior turns.
- For `[TASK TOOL - PARALLEL]` steps, include shared context in EACH Task packet plus a lane-specific objective and lane-specific DoD.
- Fail-safe: do not dispatch under-specified tasks. If required context is missing, summarize the missing context on the main thread first, then dispatch.

## Standard Offloading Loop (Fallback)

If a command doc lacks a `## Procedure` section, fall back to this generic loop:

1. For non-trivial requests without an explicit slash command, load `command-parity-router` skill first.
2. Load the command skill bundle listed below.
3. Decompose work into independent lanes.
4. Dispatch independent lanes in parallel background subagents.
5. Merge results in main thread and redelegate unresolved lanes.
6. Before completion claims, run verification-before-completion checks.

## Skill Bundles by Command

Bundle names below are conceptual workflow phases. If a same-named skill is unavailable, execute the phase behavior directly and continue.

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

## Enforcement Rules

- For substantive tasks, dispatch background subagents before doing substantive analysis, implementation, or broad repo reading.
- At the root, launch specialist `task` lanes before broad main-thread search, mutation, or implementation loops on substantive work, and redelegate again instead of reopening those loops in the root lane.
- If substantive work starts in main thread by mistake, stop and redelegate immediately.
- Keep the main-thread payload minimal: orchestration, synchronization, and final response only.
- When an exception requires main-thread execution, state the exception reason explicitly in one line.
- Never dispatch under-specified tasks; summarize missing context on main thread and complete the Task Context Packet before dispatch.
- If runtime context or plugin state says `task` is disallowed, continue directly in the current lane and note the exception briefly.
- If background subagents or skill loading are unavailable, proceed in main thread with minimal scope and record the exception in `<rule_context>`.

## Skill Routing Contract

- Automatic command-intent routing is mandatory for non-trivial natural-language requests.
- Use `command-parity-router` skill to map user intent to one or more command workflows.
- Do not require users to type slash commands when intent is inferable from context.
- Compose multiple workflows in one run when the request spans plan + implementation + verification.
- If the skill is unavailable, apply this routing contract directly in main thread and continue.
