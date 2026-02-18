# Contributing

Thanks for contributing.

## Requirements

- Python 3
- Node.js
- Git

## Workflow

1. Run tests before opening a PR:

```bash
./scripts/run-tests.sh
```

1. Update docs for behavior and flag changes.
1. Update `CHANGELOG.md` for user-visible changes.

## Pull Request Expectations

- Describe behavior changes and reasoning clearly.
- Include reproducible test steps and outcomes.
- Keep the bundle portable:
  - no hardcoded machine-specific absolute paths in payload files
  - no secrets or tokens in payload files
- Update docs and changelog when required.
