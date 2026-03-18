# AI Config Bundle

This repository ships an installable payload (`payload/`) plus an installer
(`install_bundle.py`) and wrapper script (`install.sh`).

It can install:

- a shared knowledge base (KB) under `ai-kb/` (rules, commands, templates, primary lane docs)
- Cursor integration (`.cursor/` rules/commands/hooks)
- OpenCode integration (`.opencode/` runtime files plus optional `opencode.json` merge)

Useful entrypoints in this repo:

- KB operational loop: `ai-kb/AGENTS.md`
- Rules index: `ai-kb/rules/INDEX.md`
- Commands index: `ai-kb/commands/INDEX.md`
- OpenCode runtime entrypoint: `payload/.config/opencode/AGENTS.md`
- OpenCode runtime overview: `payload/.config/opencode/README.md`
- Troubleshooting: `docs/support/troubleshooting.md`

## Current OpenCode model

The bundle now installs an autonomy-first OpenCode runtime with these defaults:

- `plan` is the default primary lane and acts as the team lead for substantive work.
- `build` is also a primary lane, but it still stays orchestration-first and only performs shared-state edits after delegated discovery narrows the work.
- Primary lane prompts are sourced from `ai-kb/agents/*.md` and synced into installed `opencode.json` files during install/reinstall.
- Installed configs use compact all-tools posture: `tools: {"*": true}`.
- Installed configs grant unrestricted external directory access: `permission.external_directory: "allow"`.
- Installed configs grant runtime-critical permissions like `task`, `skill`, `question`, `bash`, `edit`, and `webfetch` as `allow`.
- Global installs mirror KB content into both `~/ai-kb/` and `~/.config/opencode/ai-kb/`.
- Project installs rewrite OpenCode runtime paths to repo-local `.opencode/...` locations and keep a repo-local `ai-kb/` copy.
- Reinstalls migrate older `general` or `orchestrator` agent configs to `plan`.

## KB domain coverage

Platform/language domains in the shared KB include:

- Android
- iOS
- Kotlin
- Go
- JavaScript/TypeScript

Cross-cutting domains include architecture, code quality, security, concurrency, testing, and error handling.

The installer supports two modes:

- **Project mode (recommended):** install into a single repo (`ai-kb/`, `.cursor/`, `.opencode/`, optional `opencode.json` merge)
- **Global mode:** install under a target home directory (`~/ai-kb/`, `~/.cursor/`, `~/.config/opencode/`)

## Requirements

- Required: `python3`, `node`, `git`
- Optional: `bun`, `uv`
- Optional (recommended): `ck` (BeaconBay/ck) for semantic KB search via MCP

If tools are missing, the installer prints a warning. With `--install-deps` it will attempt to
install them via `brew` (macOS) or `apt-get` (Linux). For `ck`, it will try `cargo install ck-search`
when `cargo` is available.

## Optional: ck semantic KB search (MCP)

This bundle can register the `ck` MCP server to index `ai-kb/` only and use semantic/hybrid
search for KB retrieval instead of manually scanning the KB.

- Install `ck` (recommended): `cargo install ck-search`
- Cursor: installs/merges `.cursor/mcp.json` with an MCP server named `ck`
- OpenCode: installs/merges `opencode.json` with an MCP server named `ck`
- The portable `ck` launcher searches, in order: repo-local `ai-kb/`, mirrored `~/.config/opencode/ai-kb/`, then `~/ai-kb/`
- Index freshness: semantic/hybrid searches update delta automatically when KB files change (no file watcher needed)
- Optional pre-index: `cd ai-kb && ck --index .` (creates `ai-kb/.ck/`, ignored by `ai-kb/.gitignore`)
- The payload includes `ai-kb/.ckignore` and `ai-kb/.gitignore` to avoid indexing bundle backups and committing ck cache

## Install (project mode)

Dry-run preview:

```bash
./install.sh --project-dir /path/to/repo --dry-run
```

Install:

```bash
./install.sh --project-dir /path/to/repo
```

One-click (includes machine-specific config; disables `--preserve-existing`):

```bash
./install.sh --project-dir /path/to/repo --project-full
```

## Install (global mode)

Dry-run preview:

```bash
./install.sh --dry-run
./install.sh --target-home /home/newuser --dry-run
```

Install:

```bash
./install.sh
./install.sh --target-home /home/newuser
```

## What gets installed

### Project mode

- KB: `ai-kb/` (entrypoints: `ai-kb/AGENTS.md`, `ai-kb/rules/INDEX.md`, `ai-kb/commands/INDEX.md`, `ai-kb/agents/*.md`)
- Cursor: `.cursor/commands/`, `.cursor/rules/`, `.cursor/hooks/`, `.cursor/hooks.json`, `.cursor/mcp.json`
- OpenCode:
  - `.opencode/AGENTS.md`
  - `.opencode/commands/`
  - `.opencode/agents/`
  - `.opencode/plugins/`
  - `.opencode/runtime/`
  - `.opencode/overlays/`
  - `.opencode/scripts/`
  - `.opencode/memory/`
- If `--include-machine-config` (or `--project-full`):
  - `opencode.json` (created or merged)
  - `.opencode/dcp.jsonc`

### Global mode

- KB: `<target-home>/ai-kb/` and mirrored `<target-home>/.config/opencode/ai-kb/`
- Cursor: `<target-home>/.cursor/**`
- OpenCode: `<target-home>/.config/opencode/**`

## Overwrites and backups

- On conflicts, the installer writes `<file>.bak.<stamp>` before overwriting.
- It is idempotent: if the rendered destination bytes already match, it does not rewrite or create backups.
- `--uninstall` restores the latest matching backup for managed files, then removes remaining managed files.
- `--uninstall-all` targets whole managed roots and can remove user-added files under those roots.
- With `--preserve-existing`, conflicting files are skipped and reported.
- `--project-full` disables `--preserve-existing` for one-click setup.

## Path rewriting (project mode)

When installing into a repo, the installer rewrites home-style paths inside text files to keep
installed docs and wrappers actionable:

- `~/ai-kb` -> `ai-kb`
- `~/.cursor` -> `.cursor`
- `~/.config/opencode` -> `.opencode`
- `~/.config/opencode/ai-kb` -> `ai-kb`

## KB enrichment analyzers (optional)

These hooks/plugins generate recommendation docs; they never auto-edit the KB.

- Cursor hook: `.cursor/hooks/kb-post-turn-analyzer.py` (via `.cursor/hooks.json` `preCompact`)
- OpenCode plugin: `.opencode/plugins/kb-post-turn-analyzer.js` (via `experimental.session.compacting`)

Recommendation queues:

- Project: `.cursor/kb-recommendations/*.md`, `.opencode/kb-recommendations/*.md`
- Global fallback (when repo-local dirs are absent): `~/.cursor/kb-recommendations/*.md`, `~/.config/opencode/kb-recommendations/*.md`

## Troubleshooting

See `docs/support/troubleshooting.md`.

## Development

Run the repo checks and smoke tests:

```bash
./scripts/run-tests.sh
```

See `CONTRIBUTING.md` for contribution workflow and expectations.

## License

MIT. See `LICENSE`.

## Changelog

See `CHANGELOG.md`.
