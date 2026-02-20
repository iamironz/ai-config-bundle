# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to SemVer.

## [Unreleased]

### Added

- **ck MCP integration**: Register `ck` (BeaconBay/ck) as an MCP server for semantic KB search in both Cursor and OpenCode configurations.
- **KB retrieval rule** (`ai-kb/rules/kb-retrieval.md`): ck-first discovery strategy with search type guidance, recommended thresholds, concrete examples, and tool reference table.
- **`.ckignore` and `.gitignore`** in `ai-kb/`: Exclude ck index cache, installer backups, and macOS artifacts from indexing and version control.
- **ck section in README**: Documents installation, MCP wiring, index freshness, and optional pre-indexing.
- **Troubleshooting entry** for ck MCP server not working.
- **Go KB domain** (`ai-kb/rules/golang.md` + `ai-kb/rules/golang/*.md`): Added structured Go platform guidance and wired discovery in `ai-kb/rules/INDEX.md`.
- **JavaScript/TypeScript KB domain** (`ai-kb/rules/javascript-typescript.md` + `ai-kb/rules/javascript-typescript/*.md`): Added structured JS/TS platform guidance and wired discovery in `ai-kb/rules/INDEX.md`.
- **Installer uninstall mode**: Added `--uninstall` to `install_bundle.py`/`install.sh` for rollback cleanup (restore latest backups first, then remove managed files).
- **Installer force cleanup mode**: Added `--uninstall-all` (requires `--uninstall`) to remove full managed roots for complete cleanup.

### Changed

- **KB docs updated for ck-first retrieval**: `AGENTS.md`, `rules/INDEX.md`, `commands/INDEX.md`, `.cursor/rules/ai-kb.mdc`, `.opencode/AGENTS.md` now reference ck search as the primary discovery mechanism with INDEX fallback.
- **`review.md` template**: Replaced generic `turbo build/test/check` commands with Android-specific `./gradlew build/test/lint`.
- **`thoughts-locator.md`**: Fixed typos (researching, equivalent, implementation) and corrected example path.
- **KB analyzer hooks** (`.py` and `.js`): Fixed path resolution for `~/ai-kb/` prefixed paths using `HOME_KB_PREFIX` constant.
- **No-pause execution wording**: Updated KB guidance to continue immediately after `<rule_context>` and avoid waiting for optional feedback (`ai-kb/AGENTS.md`, `ai-kb/commands/create_plan.md`, `ai-kb/commands/execute_plan.md`, `ai-kb/commands/INDEX.md`).
- **Installer docs/tests**: Added uninstall usage and smoke coverage in `README.md`, `docs/support/troubleshooting.md`, and `scripts/run-tests.sh`.
- **Installer config policy**: Stopped installing bundle-defined tool permission settings for Cursor/OpenCode (`.cursor/cli-config.json` removed; OpenCode `permission` block no longer propagated).

### Removed

- Legacy ck MCP command upgrade logic from `install_bundle.py` (81 lines).

## [0.1.0] - 2026-02-17

### Added

- Initial public release of the AI Config Transfer Bundle installer and payload.
