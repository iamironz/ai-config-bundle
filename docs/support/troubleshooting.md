# Troubleshooting

## How to use this page

Start with baseline checks, then capture a minimal repro command and its output.

## Baseline checks

1. Verify required tools:

```bash
python3 --version
node --version
git --version
```

2. Verify `ck` when you want semantic KB search:

```bash
ck --version
```

3. Run the installer in dry-run mode:

```bash
./install.sh --dry-run
```

## Common issues

### ck MCP server not working

If your AI client shows MCP errors for server `ck`:

1. Ensure `ck` is installed (`ck --version`).
2. Ensure the MCP config exists:
   - Cursor: `~/.cursor/mcp.json` or `<repo>/.cursor/mcp.json`
   - OpenCode: `~/.config/opencode/opencode.json` or `<repo>/opencode.json`
3. The OpenCode/Cursor `ck` launcher searches, in order:
   - repo-local `ai-kb/`
   - mirrored `~/.config/opencode/ai-kb/`
   - `~/ai-kb/`
4. Restart the client and start a fresh session so it reloads MCP servers and runtime config.

### OpenCode still shows old prompts or behavior

If OpenCode still mentions old agent names, old prompt text, or stale runtime behavior:

1. Reinstall for that target again.
2. Start a fresh session in the repo; existing sessions keep old injected context.
3. Check the local project config (`<repo>/opencode.json`) and the local runtime files under `<repo>/.opencode/`.

### Unexpected overwrites or backups

- Use `--dry-run` to preview changes.
- Use `--preserve-existing` to avoid overwriting conflicting destination files.
- Use `--uninstall` to roll back managed files (restores `.bak.<stamp>` backups first when available).

### Project mode fails with "Project directory does not exist"

`--project-dir` must point to an existing directory.

```bash
mkdir -p /path/to/project
./install.sh --project-dir /path/to/project --dry-run
```

## Reporting an issue

Open a bug report and include:

- the exact command you ran
- full installer output
- OS + Python + Node + Git versions
