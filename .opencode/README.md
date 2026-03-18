# Project-local OpenCode State

This folder is optional and should live inside a real project repository.

## Files and directories

- `memory/current.md` - active task state
- `memory/decisions.md` - stable constraints and decisions
- `memory/handoff.md` - next-session handoff
- `overlays.jsonc` - exact project-specific overlay choices for this repo
- `checkpoints/latest.json` - latest gate and delegation checkpoint snapshot
- `state/` - per-session runtime state records
- `traces/` - local task and tool trace output
- `evals/` - local runtime validation artifacts when used

Relative runtime paths resolve from the repo root, so project installs keep state, traces, evals, and overlays local to `.opencode/`.
Keep the contents short and durable.
