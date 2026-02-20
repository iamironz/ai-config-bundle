# AI Config Bundle

This repository ships an installable payload ([`payload/`](payload/)) plus an installer
([`install_bundle.py`](install_bundle.py)) and wrapper script ([`install.sh`](install.sh)).
It can install:

- A shared knowledge base (KB) under `ai-kb/` (rules, commands, templates)
- Cursor integration (`.cursor/` rules/commands/hooks)
- OpenCode integration (`.opencode/` commands/agents/plugins + optional `opencode.json` merge)

Useful entrypoints in this repo:

- KB operational loop: [`payload/ai-kb/AGENTS.md`](payload/ai-kb/AGENTS.md)
- Rules index: [`payload/ai-kb/rules/INDEX.md`](payload/ai-kb/rules/INDEX.md)
- Commands index: [`payload/ai-kb/commands/INDEX.md`](payload/ai-kb/commands/INDEX.md)
- Cursor entrypoint: [`payload/.cursor/rules/ai-kb.mdc`](payload/.cursor/rules/ai-kb.mdc)
- OpenCode entrypoint: [`payload/.config/opencode/AGENTS.md`](payload/.config/opencode/AGENTS.md)
- Troubleshooting: [`docs/support/troubleshooting.md`](docs/support/troubleshooting.md)

## KB domain coverage

Platform/language domains in the shared KB include:

- Android
- iOS
- Kotlin
- Go
- JavaScript/TypeScript

Cross-cutting domains include architecture, code quality, security, concurrency, testing, and error handling.

The installer supports two modes:

- **Project mode (recommended):** install into a single repo (`ai-kb/`, `.cursor/`, `.opencode/`)
- **Global mode (legacy):** install under a target home directory (`~/ai-kb/`, `~/.cursor/`, `~/.config/opencode/`)

## Requirements

- Required: `python3`, `node`, `git`
- Optional: `bun`, `uv`
- Optional (recommended): `ck` (BeaconBay/ck) for semantic KB search via MCP

If tools are missing, the installer prints a warning. With `--install-deps` it will attempt to
install them via `brew` (macOS) or `apt-get` (Linux). For `ck`, it will try `cargo install ck-search`
when `cargo` is available.

## Optional: ck semantic KB search (MCP)

This bundle can register the `ck` MCP server to index `ai-kb/` only and use semantic/hybrid
search for KB retrieval (instead of manually scanning the KB).

- Install `ck` (recommended): `cargo install ck-search`
- Cursor: installs/merges `.cursor/mcp.json` with an MCP server named `ck`
- OpenCode: installs/merges `opencode.json` with an MCP server named `ck`
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

## Flags

All flags are implemented by [`install_bundle.py`](install_bundle.py) and are forwarded by
[`install.sh`](install.sh).

| Flag | Mode | Meaning |
|------|------|---------|
| `--project-dir <path>` | project | Install repo-local `ai-kb/`, `.cursor/`, `.opencode/` into this directory |
| `--project-full` | project | Enable `--include-machine-config` and disable `--preserve-existing` for one-click setup |
| `--include-machine-config` | project | Also install `opencode.json`, `.opencode/dcp.jsonc`, `.cursor/cli.json` |
| `--target-home <path>` | global | Install under this home directory (default: current `$HOME`) |
| `--preserve-existing` | both | Do not overwrite conflicting destination files |
| `--install-deps` | both | Try to install missing tools using brew/apt-get |
| `--dry-run` | both | Print planned actions without writing files |

## What gets installed

### Project mode

- KB: `ai-kb/` (entrypoints: `ai-kb/AGENTS.md`, `ai-kb/rules/INDEX.md`, `ai-kb/commands/INDEX.md`)
- Cursor: `.cursor/commands/`, `.cursor/rules/` (entrypoint: `.cursor/rules/ai-kb.mdc`), `.cursor/hooks/`, `.cursor/hooks.json`, `.cursor/mcp.json`
- OpenCode:
  - `.opencode/AGENTS.md`
  - `.opencode/commands/`
  - `.opencode/agents/`
  - `.opencode/plugins/`

OpenCode supports singular directory names for backwards compatibility, but the installer avoids
creating both. If singular directories already exist, it migrates their contents into the
canonical plural directories to prevent duplicate loading.

If `--include-machine-config` (or `--project-full`):

- `opencode.json` (created or merged with minimal `instructions` entrypoints; avoids preloading `ai-kb/rules/**/*.md`)
- `.opencode/dcp.jsonc`
- `.cursor/cli.json` (project-safe subset of the global Cursor CLI config; permissions only)

Project installs do not create or modify repo-root `AGENTS.md`.

### Global mode

- KB: `<target-home>/ai-kb/` (usually `~/ai-kb/`)
- Cursor: `<target-home>/.cursor/**` (usually `~/.cursor/**`)
- OpenCode: `<target-home>/.config/opencode/**` (usually `~/.config/opencode/**`)

## Overwrites and backups

- On conflicts, the installer writes `<file>.bak.<stamp>` before overwriting.
- It is idempotent: if the rendered destination bytes already match, it does not rewrite or create backups.
- With `--preserve-existing`, conflicting files are skipped and reported.
- `--project-full` disables `--preserve-existing` for one-click setup.

## Path rewriting (project mode)

When installing into a repo, the installer rewrites home-style paths inside text files to keep
docs/wrappers actionable:

- `~/ai-kb` -> `ai-kb`
- `~/.cursor` -> `.cursor`
- `~/.config/opencode` -> `.opencode`

## KB enrichment analyzers (optional)

These hooks/plugins generate recommendation docs; they never auto-edit the KB.

- Cursor hook: `.cursor/hooks/kb-post-turn-analyzer.py` (via `.cursor/hooks.json` `preCompact`)
- OpenCode plugin: `.opencode/plugins/kb-post-turn-analyzer.js` (via `experimental.session.compacting`)

Recommendation queues:

- Project: `.cursor/kb-recommendations/*.md`, `.opencode/kb-recommendations/*.md`
- Global fallback (when repo-local dirs are absent): `~/.cursor/kb-recommendations/*.md`, `~/.config/opencode/kb-recommendations/*.md`

### Analyzer environment variables

- `AI_KB_CURSOR_MODEL`: optional Cursor model id for analysis (example: `gpt-5.2`, `sonnet-4`)
- `AI_KB_ANALYZER_MODEL`: legacy alias for `AI_KB_CURSOR_MODEL` when value does not contain `/`
- `AI_KB_ANALYZER_INTERNAL`: reserved sentinel used internally to prevent hook recursion
- `AI_KB_MAX_HISTORY_CHARS`: max transcript chars analyzed (default `120000`)
- `AI_KB_MIN_HISTORY_CHARS`: minimum history size before analysis (default `800`)
- `AI_KB_ANALYZER_TIMEOUT_SEC`: Cursor analyzer timeout in seconds (default `45`)
- `AI_KB_RECOMMENDATION_SCAN_LIMIT`: max recent recommendation docs scanned for dedupe (default `300`)

## Troubleshooting

See [`docs/support/troubleshooting.md`](docs/support/troubleshooting.md).

## Development

Run the repo checks and smoke tests:

```bash
./scripts/run-tests.sh
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution workflow and expectations.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Security

See [`.github/SECURITY.md`](.github/SECURITY.md).

## License

MIT. See [`LICENSE`](LICENSE).

## Changelog

See [`CHANGELOG.md`](CHANGELOG.md).
