# AGENTS.md — OpenCode Entry Point

This file exists to keep OpenCode pointing at the canonical KB under `~/ai-kb/` and to enforce
a RAG-first workflow.

## Canonical KB Entry Points

- How to use the KB (operational loop + ck retrieval): `~/ai-kb/AGENTS.md`
- Rule discovery and loading: `~/ai-kb/rules/INDEX.md`
- Command catalog: `~/ai-kb/commands/INDEX.md`

## RAG-First Requirements (Mandatory)

- Before starting any task: read the three entry points above.
- Follow the operational loop in `~/ai-kb/AGENTS.md` (load the relevant Level 1/2 rule docs before acting).
- Output a `<rule_context>` block quoting the rules you will follow, then proceed.
- Prefer ck search (MCP server `ck`) for rule discovery; avoid scanning the full KB manually.

## OpenCode Integration (Wiring)

- Commands under `~/.config/opencode/commands/` are wrappers that delegate to `~/ai-kb/commands/*`.
- Agents under `~/.config/opencode/agents/` must follow the same KB loop (each agent prompt reinforces this).
- Optional post-turn analyzer plugin: `~/.config/opencode/plugins/kb-post-turn-analyzer.js`
- KB recommendation queue: `~/.config/opencode/kb-recommendations/*.md` (review then apply)

## Avoid Rule Preloading

Do not preload every rule via `ai-kb/rules/**/*.md` in `opencode.json`.
Discover rules via ck search first; use `~/ai-kb/rules/INDEX.md` only as a fallback.
