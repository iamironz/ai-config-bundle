# OpenCode Runtime

This directory holds a compact, autonomy-first OpenCode runtime.

## Current runtime model

- `plan` is the default primary lane and acts as the orchestration-first root lane.
- `build` is also a primary lane, but it still delegates discovery and analysis before doing shared-state edits.
- Primary lane prompts are sourced from `ai-kb/agents/*.md` and synchronized into installed `opencode.json` files during install/reinstall.
- Installed configs use compact all-tools posture: `tools: {"*": true}`.
- Installed configs set `permission.external_directory` to `"allow"` and keep runtime-critical permissions on.
- Global installs mirror KB content into both `~/ai-kb/` and `~/.config/opencode/ai-kb/`.
- Project installs rewrite OpenCode runtime paths to repo-local `.opencode/...` and rewrite KB references back to local `ai-kb/`.
- Reinstalls migrate older `general` and `orchestrator` configs to `plan`.
- `plugins/kb-post-turn-analyzer.js` currently runs on compaction, not on every idle turn.

## Key paths

- Bootstrap: `runtime/bootstrap.md`
- Runtime manifest: `runtime/autonomy-runtime.jsonc`
- Hidden runtime plugin: `plugins/autonomy-runtime.js`
- Global mirrored KB: `~/.config/opencode/ai-kb/`
- Global memory: `memory/global/`
- Project template: `memory/templates/project/.opencode/`
- Overlay catalog: `overlays/` globally, `.opencode/overlays/` in project installs
- Trace output: `~/.config/opencode/traces/` globally, `.opencode/traces/` in project installs
- Session and checkpoint state: `~/.config/opencode/state/` and `~/.config/opencode/checkpoints/` globally, `.opencode/state/` and `.opencode/checkpoints/` in project installs

## Validation

- Project install: `node .opencode/scripts/validate-runtime-config.mjs`
- Global install: `node ~/.config/opencode/scripts/validate-runtime-config.mjs`
- Project install report: `node .opencode/scripts/eval-report.mjs`
- Global install report: `node ~/.config/opencode/scripts/eval-report.mjs`

## Tooling posture

- Native primitives come first, but installs now leave tool exposure wide open with `tools: {"*": true}`.
- Built-in `lsp` is disabled by default until a repo-specific server is configured.
- Built-in `formatter` is disabled by default until a repo-specific formatter command is configured.
