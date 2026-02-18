# AI Config Bundle

This bundle contains:

- AI knowledge base (`~/ai-kb`)
- OpenCode rules, agents, and commands
- Cursor rules, hooks, and custom slash commands
- Installer that can install either:
  - **Globally** (home directory mode, legacy behavior), or
  - **Per project** (project-local mode for `.cursor`, `.opencode`, and local `ai-kb`)

## Install On Target Machine

1. Unzip the archive
2. Run:

```bash
./install.sh
```

## Global Mode (legacy / default)

This keeps the previous behavior and installs under a target home path.

```bash
./install.sh --target-home /home/newuser
./install.sh --install-deps
./install.sh --dry-run
```

## Project Mode (new)

Install into a specific project directory. This sets up:

- `ai-kb/`
- `.cursor/` rules/commands/hooks assets
- `.opencode/` rules/commands/agents assets
- Post-turn KB recommendation hooks:
  - Cursor: `.cursor/hooks/kb-post-turn-analyzer.py` via `preCompact`
  - OpenCode: `.opencode/plugins/kb-post-turn-analyzer.js` via `experimental.session.compacting`
  - Both analyze the compaction window since the previous compaction; for first compaction they analyze from conversation start
  - Before creating a new recommendation, both scan existing `kb-recommendations/*.md` and related `ai-kb/*` targets to skip already-covered guidance
  - Both use model-based structured output over dialog history (not keyword heuristics)
- `opencode.json` instructions merge/create
- AGENTS compatibility (`AGENTS.md` merge + `AGENTS.ai-transfer.md` bridge when needed)

```bash
./install.sh --project-dir /path/to/project
./install.sh --project-dir /path/to/project --project-full
./install.sh --dry-run
```

### Project Mode Flags

- `--project-dir <path>`: install project-local assets into that repository
- `--project-full`: one-click project setup (full machine config in project; no extra flags required)
- `--include-machine-config`: install full machine-specific config files
  (`opencode.json`, `.opencode/dcp.jsonc`, `.cursor/cli.json`);
  intended for personal 1:1 environment cloning
- `--preserve-existing`: do not overwrite conflicting files
- `--install-deps`: attempt dependency install (brew/apt) for missing tools

### Compatibility behavior

- Existing project `AGENTS.md` is preserved and augmented with a compatibility include marker.
- Existing rules/commands are preserved as directories; only conflicting files are backed up (unless `--preserve-existing` is used).
- In `--project-full`, `--preserve-existing` is disabled to avoid partial/manual setup.
- OpenCode directory compatibility is maintained by installing both singular and plural paths:
  - `.opencode/command` + `.opencode/commands`
  - `.opencode/agent` + `.opencode/agents`
  - `.opencode/plugin` + `.opencode/plugins`
- OpenCode wrapper docs use `~/ai-kb` in global installs; project installs rewrite these references to `<project>/ai-kb`.

### MCP note

This bundle does not install MCP server configurations.

### Post-turn KB analyzer knobs

- `AI_KB_CURSOR_MODEL`: optional Cursor model id for analysis (example: `gpt-5.2`, `sonnet-4`)
- `AI_KB_ANALYZER_MODEL`: legacy alias for `AI_KB_CURSOR_MODEL` when value does not contain `/`
- `AI_KB_ANALYZER_INTERNAL`: reserved sentinel used internally to prevent hook recursion
- `AI_KB_MAX_HISTORY_CHARS`: max transcript chars analyzed (default `120000`)
- `AI_KB_MIN_HISTORY_CHARS`: minimum history size before analysis (default `800`)
- `AI_KB_ANALYZER_TIMEOUT_SEC`: Cursor analyzer timeout in seconds (default `45`)
- `AI_KB_RECOMMENDATION_SCAN_LIMIT`: max recent recommendation docs scanned for dedupe (default `300`)

Model provider note:
- Cursor hook uses Cursor CLI (`agent`) for analysis, so it uses your Cursor authentication.
- Some providers require additional API keys; keep them out of the repo (never in bundle JSON or committed files)

## Security Note

This bundle can still contain machine-specific metadata when you include full machine config.
Keep any API tokens in local-only config, not in committed files.
Handle it as sensitive material.

## Development

Run the repo checks and smoke tests:

```bash
./scripts/run-tests.sh
```

See `CONTRIBUTING.md` for contribution workflow and expectations.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `.github/SECURITY.md`.

## License

MIT. See `LICENSE`.

## Changelog

See `CHANGELOG.md`.
