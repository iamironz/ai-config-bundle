# Commands Index

Canonical command playbooks live under `ai-kb/commands/`.
Tool-specific command files (Cursor/OpenCode) should be thin wrappers that delegate here.

## Shared Conventions

- Command input is the text after the command name; treat it as the request and constraints for the invocation.
- Follow `ai-kb/AGENTS.md` for the operational loop and `<rule_context>` citation protocol.
- For command offloading/parallelization policy: `ai-kb/rules/command-orchestration.md`.
- For KB recommendation workflow: `ai-kb/rules/kb-maintenance.md`.

## Command Catalog

| Command | Canonical doc | Use for |
|---------|---------------|---------|
| `create_plan` | `ai-kb/commands/create_plan.md` | Explore options and write a plan (after feedback) |
| `execute_plan` | `ai-kb/commands/execute_plan.md` | Execute an existing plan without editing it |
| `implement_feature` | `ai-kb/commands/implement_feature.md` | Implement a new feature (TDD-first when feasible) |
| `fix_issue` | `ai-kb/commands/fix_issue.md` | Diagnose and fix a bug (TDD-first when feasible) |
| `implement_tests` | `ai-kb/commands/implement_tests.md` | Add missing tests and run them immediately |
| `run_tests` | `ai-kb/commands/run_tests.md` | Run the most relevant test scope for changes |
| `run_build` | `ai-kb/commands/run_build.md` | Run the most relevant build step for changes |
| `review_code` | `ai-kb/commands/review_code.md` | Review code for quality, architecture, risks |
| `validate_domain` | `ai-kb/commands/validate_domain.md` | Verify behavior matches domain/spec requirements |
| `validate_runtime` | `ai-kb/commands/validate_runtime.md` | Debug runtime behavior, logs, state timelines |
| `research` | `ai-kb/commands/research.md` | Research uncertain APIs/errors/best practices |
| `update_docs` | `ai-kb/commands/update_docs.md` | Update project docs to match changes |
| `update_rule` | `ai-kb/commands/update_rule.md` | Add/update/compact KB rules and structure |
| `suggest_kb_updates` | `ai-kb/commands/suggest_kb_updates.md` | Propose KB updates from durable learnings |
| `commit` | `ai-kb/commands/commit.md` | Create local git commits (opt-in, approval gated) |
