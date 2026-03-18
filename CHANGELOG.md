# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to SemVer.

## [Unreleased]

### Added

- `ai-kb/agents/*.md` and `payload/ai-kb/agents/*.md` as the source of truth for OpenCode primary lane prompts (`plan`, `build`, `explore`, `summary`, `compaction`, `title`).
- Provider-agnostic research tool guidance in `ai-kb/rules/mcp-research.md` and `ai-kb/commands/research.md`, including examples for Kagi, Perplexity, `open-websearch`, DuckDuckGo, and browser-driven Google-style search.
- Mirrored global AI-KB install under `~/.config/opencode/ai-kb/` so OpenCode can resolve KB files without depending on `~/ai-kb` alone.

### Changed

- OpenCode primary lane model now uses `plan` as the default root lane and `build` as the shared-state primary lane.
- Reinstalls migrate older `general` and `orchestrator` configs to `plan` and remove stale agent blocks.
- OpenCode configs now use compact all-tools posture: `tools: {"*": true}`.
- OpenCode configs now grant unrestricted external directory access: `permission.external_directory: "allow"`.
- Runtime-critical OpenCode permissions are now propagated and normalized on reinstall instead of being left to legacy config drift.
- Project installs rewrite OpenCode KB references back to repo-local `ai-kb/`, while global installs mirror KB content into both `~/ai-kb/` and `~/.config/opencode/ai-kb/`.
- OpenCode runtime context was quieted so user-visible boilerplate about routing, KB discovery, and delegation state does not repeat before each task.
- OpenCode KB analyzer documentation now reflects the current compaction-triggered behavior instead of idle-turn behavior.

## [0.1.0] - 2026-02-17

### Added

- Initial public release of the AI Config Transfer Bundle installer and payload.
