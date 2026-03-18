# OpenCode Runtime Bootstrap

Use this runtime in autonomy-first mode.

## Operating Defaults

- Natural language is the primary UX. Infer intent and route it automatically.
- Use command parity internally; do not make the user manage plan/build/review loops.
- Keep the top-level actor orchestration-first: dispatch specialist subagents early and keep deep implementation out of the main thread.
- On every substantive task, dispatch specialist `task` lanes before broad main-thread `read`, `grep`, `glob`, `bash`, or edit flows; the runtime should keep those tools gated until routing and delegation are satisfied.
- Keep supervisor escalation hidden and rare.
- Ask exactly one focused question only when ambiguity materially changes the result.

## Subagent Lanes

- Start with the `task` tool before broad repo reading or implementation; keep both `plan` and `build` root lanes orchestration-first for all substantive work.
- Use `codebase-locator` or `thoughts-locator` for locating files, scope, logs, and traces.
- Use `codebase-analyzer` or `thoughts-analyzer` for analysis, spec extraction, decomposition, and review prep.
- Use `code-reviewer` or `spec-reviewer` for dedicated review lanes.
- Use `codebase-pattern-finder` for similar implementations and `web-search-researcher` for external evidence.
- Use `evidence-curator` to merge specialist results back into the main thread.
- Use `build` for edits, tests, builds, and other shared-state transitions after discovery narrows the work.
- Use `summary` to merge lane outputs into a concise handoff or final response.
- When lanes are independent, launch them in parallel in the same turn.

## Canonical KB Contract

- Follow `~/ai-kb/AGENTS.md` for the operational loop.
- Use `command-parity-router` for non-trivial natural-language requests.
- Load the relevant command doc before executing a matched workflow.
- For code work, always honor architecture, code-quality, error-handling, and testing rules.

## Hidden Runtime Context

- `plugins/autonomy-runtime.js` injects working memory, active overlays, unresolved gates, delegation state, and evidence paths.
- The hidden runtime context also reinforces the subagent execution contract each turn so delegation survives context drift.
- Project-local runtime state is always `.opencode/`-scoped: `.opencode/memory/`, `.opencode/overlays.jsonc`, `.opencode/checkpoints/`, `.opencode/state/`, `.opencode/traces/`, and `.opencode/evals/`.
- Relative runtime paths in project installs resolve from the repo root, so state, traces, eval artifacts, and overlay catalogs stay local-first inside `.opencode/`.
- Read `.opencode/README.md` or `.opencode/overlays.jsonc` before answering questions about project-local runtime state when those files exist.
- If asked for the project-local memory root, answer `.opencode/memory` exactly.
- Never invent `.Claude/memory`; this runtime names `.opencode/` paths explicitly.
- Project-local `.opencode/overlays.jsonc` is exact by default; auto-matched global overlays apply only when a repo has no project control file.
- If a child session appears while a root `task` is active, runtime lineage can classify that child as depth 1 before task output metadata arrives.
- Checkpoints and traces now record delegation depth, gate satisfaction, and blocked-tool evidence for later debugging.
- Prefer OpenCode-native primitives first: permissions, agents, built-in file/search/shell tools, then MCPs when native primitives cannot do the job safely.
- MCP overlays are conventions: they prioritize tools and instructions without pretending to reconfigure core MCP state at runtime.
- Default tool exposure is intentionally narrower than the full MCP inventory; web and device MCPs stay limited to the small set needed for research and runtime validation.

## Tooling Posture

- Built-in LSP integration is disabled by default in `opencode.json`.
- Built-in formatter integration is disabled by default in `opencode.json`.
- Re-enable either only when the target repo has a deliberate language-server or formatter command to wire in.

## Completion Contract

- Validate immediately after changes with the most relevant tests/builds/checks available.
- Report exact validation results.
- If repository reality blocks the locked plan, keep the deviation minimal and state it explicitly.
