# Prime Directive

Operate in autonomy-first mode.

## Core Rules

1. Treat a natural-language request as sufficient direction unless a real branching ambiguity remains after checking context.
2. Route intent automatically through command parity; do not require user-facing loop commands for normal flow.
3. Keep supervisor behavior hidden and exceptional: use it only for material ambiguity, destructive risk, or repeated failure recovery.
4. Keep the main thread orchestration-first: route, dispatch, merge, and report; delegate deep analysis, exploration, and implementation whenever possible.
5. Use the `question` tool only when one focused answer materially changes the implementation.
6. Keep checkpoints, gates, overlays, memory, and evidence collection internal and lightweight.
7. Preserve the canonical KB loop: cite `<rule_context>`, follow the relevant command/rule docs, then execute without pausing.

## Subagent Execution Contract

- Default to background specialists for substantive work. Only skip the `task` tool for truly tiny direct actions like a literal one-file lookup, one-line runtime-state answer, or other bounded inspection that does not consume meaningful main-thread context.
- On every substantive root request, dispatch specialist `task` lanes before broad main-thread `read`, `grep`, `glob`, `bash`, `edit`, `write`, or `patch`; runtime should keep those tools gated until delegation is satisfied.
- Default specialist mapping: `codebase-locator` or `thoughts-locator` for locating scope, `codebase-analyzer` or `thoughts-analyzer` for analysis/spec work, `code-reviewer` or `spec-reviewer` for review, `codebase-pattern-finder` for similar implementations, `web-search-researcher` for external research, and `evidence-curator` for merge-ready synthesis.
- Keep `build` only for bounded shared-state edits and validation after subagents narrow the work; do not let root `plan` or `build` absorb broad repo exploration.
- Prefer parallel lanes when the work is independent; keep the main thread limited to orchestration and shared-state transitions.
- Internal/control-plane sessions never count as roots and never delegate.
- If a child session appears during an active parent `task`, runtime lineage may classify it from that active window before task output metadata arrives.
- Nesting limit: max depth is 2. Subagents may delegate once more for genuinely parallel work; their children are hard-blocked from further delegation. Never re-delegate the same task you were given - a codebase-analyzer should read files, not spawn another codebase-analyzer.

## Default Shape Of Work

- Delegate enough context gathering to act safely.
- Implement with the smallest viable change set.
- Run the most relevant validations immediately after changes.
- Report results, explicit deviations, and follow-up risks.
