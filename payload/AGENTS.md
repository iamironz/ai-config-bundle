# AGENTS.md — Local Environment Overview

This file explains where the bundle installs KB content and how Cursor/OpenCode are wired.
Behavior and workflow rules live in the canonical KB under `ai-kb/`.

## Entry Points

- How to use the KB (operational loop + citing): `~/ai-kb/AGENTS.md`
- KB retrieval and doc layers: `~/ai-kb/rag.md`
- Rule discovery and loading: `~/ai-kb/rules/INDEX.md`
- Command catalog: `~/ai-kb/commands/INDEX.md`

## Canonical KB Layout

- KB root:
  - Home install: `~/ai-kb/`
  - Project install: `ai-kb/` (repo-relative)
- Rules: `ai-kb/rules/`
- Commands: `ai-kb/commands/`
- Templates: `ai-kb/templates/`

## Tool Wiring

### Cursor

- Always-apply entrypoint:
  - Home: `~/.cursor/rules/ai-kb.mdc`
  - Project: `.cursor/rules/ai-kb.mdc`
- Slash command wrappers:
  - Home: `~/.cursor/commands/*`
  - Project: `.cursor/commands/*`
- Optional post-turn analyzer hook:
  - Hook: `kb-post-turn-analyzer.py` (under `.cursor/hooks/`)
  - Registration: `.cursor/hooks.json` via `preCompact`

### OpenCode

- Config:
  - Home: `~/.config/opencode/opencode.json`
  - Project: `opencode.json`
- Entry doc:
  - Home: `~/.config/opencode/AGENTS.md`
  - Project: `.opencode/AGENTS.md`
- Command wrappers:
  - Home: `~/.config/opencode/command/*`
  - Project: `.opencode/command/*` and `.opencode/commands/*`
- Optional post-turn analyzer plugin:
  - Home: `~/.config/opencode/plugins/kb-post-turn-analyzer.js`
  - Project: `.opencode/plugins/kb-post-turn-analyzer.js`

## KB Enrichment (Recommendations -> Maintenance)

Recommendations are written into the active workspace (not into `~/ai-kb/`):

- Cursor queue: `.cursor/kb-recommendations/*.md`
- OpenCode queue: `.opencode/kb-recommendations/*.md`

Apply validated updates to the canonical KB and keep indexes consistent:

- `ai-kb/rules/kb-maintenance.md`
