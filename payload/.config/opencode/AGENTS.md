# AGENTS.md — OpenCode Entry Point

This file exists to keep OpenCode pointing at the canonical KB under `~/ai-kb/`.
Behavior and workflow rules live in the canonical KB; this doc stays intentionally thin.

## Canonical KB Entry Points

Start with `~/ai-kb/rag.md` and follow its `Entry Points` section.

Minimum entry docs:

- `~/ai-kb/AGENTS.md`
- `~/ai-kb/rules/INDEX.md`
- `~/ai-kb/commands/INDEX.md`

## How OpenCode Uses The KB

- Commands under `command/` are wrappers that delegate to `~/ai-kb/commands/*`.
- Rules live under `~/ai-kb/rules/**` and are loaded via `~/ai-kb/rules/INDEX.md`.
- Post-turn KB recommendations (if enabled) are written into the active workspace:
  - `.opencode/kb-recommendations/*.md`

## Install Path Notes

- Home installs use `~/.config/opencode/**` for OpenCode assets.
- Project installs use `.opencode/**` (repo-relative) for OpenCode assets.
