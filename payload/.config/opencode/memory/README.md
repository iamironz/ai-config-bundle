# Working Memory

Keep memory file-based and small.

## Global memory

- `memory/global/current.md` - active personal/runtime notes that are worth carrying between sessions.
- `memory/global/preferences.md` - durable preferences that help shape defaults.

## Project-local memory

When a real project wants persistent local context, copy the template in `memory/templates/project/.opencode/` into that repository.

Suggested files and directories:

- `.opencode/memory/current.md` - active task state
- `.opencode/memory/decisions.md` - durable decisions and constraints
- `.opencode/memory/handoff.md` - next-session handoff
- `.opencode/overlays.jsonc` - exact overlay enablement or suppression for that repo
- `.opencode/checkpoints/latest.json` - latest gate and delegation checkpoint snapshot
- `.opencode/state/` - per-session runtime state records
- `.opencode/traces/` - local task and tool traces
- `.opencode/evals/` - local runtime validation artifacts when used
- `.opencode/overlays/` - project-local overlay catalog copied by project installs

The runtime plugin loads project-local memory first when present, then falls back to the small global files.
Project installs resolve relative runtime paths against the repo root, so `.opencode/state`, `.opencode/traces`, `.opencode/evals`, and `.opencode/overlays` stay local to that repository.
It names `.opencode/` paths explicitly and does not use `.Claude/memory`.

For multi-project adoption, use `bun run bootstrap:project -- --repo /path/to/repo` from `~/.config/opencode/` to scaffold the standard `.opencode/` layout.
