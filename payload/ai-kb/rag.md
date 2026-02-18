# KB Retrieval (RAG) and Layers

This doc explains how the bundle knowledge base (KB) is organized, how guidance is retrieved,
and where durable learnings should land.

## What This KB Is (and is not)

- This KB is file-based: rules and commands are plain Markdown under `ai-kb/`.
- Retrieval is driven by indexes + explicit rule loading (not a vector database by default).
- Post-turn analyzers can propose KB updates by writing recommendation docs; they do not
  auto-edit `ai-kb/`.

## Entry Points

- `ai-kb/AGENTS.md` - operational loop + citation protocol
- `ai-kb/rules/INDEX.md` - keyword matching and rule loading protocol
- `ai-kb/commands/INDEX.md` - command catalog and shared conventions

## Doc Layers (stable -> volatile)

1. **Canonical KB content**
   - `ai-kb/rules/**` - durable rules (Level 1 + Level 2)
   - `ai-kb/commands/**` - command playbooks
   - `ai-kb/templates/**` - templates used by commands

2. **Tool integration wrappers**
   - Cursor:
     - Home: `~/.cursor/rules/ai-kb.mdc`, `~/.cursor/commands/*`, `~/.cursor/hooks/*`
     - Project: `.cursor/rules/ai-kb.mdc`, `.cursor/commands/*`, `.cursor/hooks/*`
   - OpenCode:
     - Home: `~/.config/opencode/AGENTS.md`, `~/.config/opencode/command/*`, `~/.config/opencode/agent/*`, `~/.config/opencode/plugins/*`
     - Project: `.opencode/AGENTS.md`, `.opencode/command(s)/*`, `.opencode/agent(s)/*`, `.opencode/plugin(s)/*`
     - Note: project installs may include both singular and plural directories for compatibility (`command` + `commands`, etc.)

3. **Generated recommendation queues (review then apply)**
   - Cursor: `.cursor/kb-recommendations/*.md`
   - OpenCode: `.opencode/kb-recommendations/*.md`

## Retrieval Flow (high level)

1. Read `ai-kb/rules/INDEX.md` and match keywords to domains.
2. Load Level 1 rules for all relevant domains.
3. From each Level 1 rule, pick Level 2 subdocs via its `Subdocuments` table.
4. Cite loaded rules in `<rule_context>` and execute.
5. If a durable learning emerges, write a recommendation doc and then apply it via
   `ai-kb/rules/kb-maintenance.md`.

## Where To Put Things

- Durable, domain-agnostic guidance -> `ai-kb/rules/`
- Command workflow guidance -> `ai-kb/commands/`
- Tool-specific wiring (Cursor/OpenCode hooks/config) -> the tool wrapper directories
- Project-specific details -> the project docs (not the global KB)

## Install Path Notes

- Home installs typically use `~/ai-kb`.
- Cursor home assets live under `~/.cursor/**`; project installs use `.cursor/**`.
- OpenCode home assets live under `~/.config/opencode/**`; project installs use `.opencode/**`.
- Project installs use repo-relative KB paths (`ai-kb/`).
