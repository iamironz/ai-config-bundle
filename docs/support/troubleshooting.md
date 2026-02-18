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

1. Run the installer in dry-run mode:

```bash
./install.sh --dry-run
```

## Common issues

### Missing required tools

If you see `Warning: missing required tools: ...`, install the missing tools and retry.

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
