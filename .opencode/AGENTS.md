# AGENTS.md - OpenCode Runtime Entry Point

This entry point keeps OpenCode aligned with the canonical KB while using a smaller local bootstrap.

## Canonical Sources

- KB operating loop: `ai-kb/AGENTS.md`
- Rule discovery fallback: `ai-kb/rules/INDEX.md`
- Command catalog: `ai-kb/commands/INDEX.md`
- Primary lane prompt sources: `ai-kb/agents/*.md`

## Runtime Contract

- Treat natural-language requests as the primary UX; slash-command parity stays internal.
- Run autonomy-first by default: infer intent, execute, validate, and summarize without manual loop choreography.
- `plan` is the default root lane and should act as the orchestration-first team lead.
- `build` is also a primary lane, but it still delegates discovery/analysis first and only performs shared-state edits after delegated evidence narrows the work.
- Runtime may gate broad main-thread `grep`, `glob`, `read`, `bash`, `edit`, `write`, and `patch` until routing and delegation are satisfied.
- Nesting limit: max depth is 2. Subagents may delegate once more for genuinely parallel work; their children are hard-blocked from further delegation.
- Internal/control-plane sessions never count as roots and never spawn subagents.
- Keep checkpoints, gates, overlays, traces, and eval scaffolding internal unless the user asks for details.

## Default Lane Map

- `plan` -> root orchestration, decomposition, routing, and redelegation
- `build` -> shared-state edits, tests, builds, and completion gates after delegated discovery
- `explore` -> locate implementation details, logs, traces, and runtime evidence
- `summary` -> merge lane output into a concise handoff or final response
- `compaction` -> preserve continuity, memory, overlays, and unresolved work across compaction

## KB Alignment

- Canonical requirements in `ai-kb/AGENTS.md`, `ai-kb/rules/**`, `ai-kb/commands/**`, and `ai-kb/agents/**` still win.
- Follow the KB operational loop before planning or coding.
- Output `<rule_context>` before implementation work.
- Prefer ck-first discovery when available; otherwise fall back to the KB index and record the reason.

## Local Runtime Scaffolding

- Bootstrap instructions live in `.opencode/prime-directive.md` and `.opencode/runtime/bootstrap.md`.
- Hidden runtime context is injected by `.opencode/plugins/autonomy-runtime.js`.
- Post-turn KB recommendations flow through `.opencode/plugins/kb-post-turn-analyzer.js` on compaction.
- File-based working memory lives under `.opencode/memory/` and supports explicit project-local `.opencode/memory/` state.
- Global installs keep traces, checkpoints, and eval helpers under `.opencode/{traces,state,evals}`.
- Project installs rewrite those runtime paths to repo-local `.opencode/{traces,state,evals,overlays}` so delegation evidence and runtime artifacts stay with the repo.
