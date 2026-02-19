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

1. (Optional) Verify `ck` is installed (only needed for ck MCP / semantic KB search):

```bash
ck --version
```

1. Run the installer in dry-run mode:

```bash
./install.sh --dry-run
```

## Common issues

### Missing required tools

If you see `Warning: missing required tools: ...`, install the missing tools and retry.

### ck MCP server not working

If your AI client shows MCP errors for server `ck`:

1. Ensure `ck` is installed (`ck --version`).
2. Ensure the MCP config exists:
   - Cursor: `~/.cursor/mcp.json` or `<repo>/.cursor/mcp.json`
   - OpenCode: `~/.config/opencode/opencode.json` or `<repo>/opencode.json`
3. Restart the client so it reloads MCP servers.

### Unexpected overwrites or backups

- Use `--dry-run` to preview changes.
- Use `--preserve-existing` to avoid overwriting conflicting destination files.

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
