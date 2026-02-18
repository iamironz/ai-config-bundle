# AGENTS.md

Repository guide for agentic coding tools.

## Quick commands

All tests:

```bash
./scripts/run-tests.sh
```

Smoke test installer (dry-run only):

```bash
./install.sh --dry-run
python3 ./install_bundle.py --project-dir /tmp/ai-config-bundle-test --dry-run
```

## Build / lint / test

- Build: no repo-level build step
- Lint/format: no configured linter or formatter
- Tests: run via `./scripts/run-tests.sh` (bash required)

## Repository layout

- `install_bundle.py` installer logic (CLI entrypoint)
- `install.sh` thin wrapper around the Python installer
- `manifest.json` bundle manifest (copied items, text rewrite rules)
- `payload/` files copied into target machine/project
- `docs/` documentation
- `scripts/` helper scripts (tests, release helpers)

## Python conventions

- Keep changes idempotent (repeat installs should not churn backups).
- Prefer small helper functions over deeply nested logic.
- Validate inputs early and return actionable errors.
- Avoid introducing non-stdlib dependencies.

## Security and portability rules

- Do not commit secrets, tokens, or credentials.
- Avoid hardcoding absolute machine paths into payload files.
- Keep payload contents safe to publish publicly.
