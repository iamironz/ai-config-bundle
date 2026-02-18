# KB Maintenance

Use this rule to keep the knowledge base updated from real implementation learnings.

## Recommendation Sources

- Cursor hook output: `.cursor/kb-recommendations/*.md`
- OpenCode plugin output: `.opencode/kb-recommendations/*.md`
- Manual command output: `suggest_kb_updates` (writes to the same recommendation queues)

## Maintenance Workflow

1. Review new recommendation files and validate relevance.
2. Prefer updating an existing rule or command document first.
3. If no existing doc fits, create a new rule file under `~/ai-kb/rules/`.
4. Add every new rule file to `~/ai-kb/rules/INDEX.md`.
5. Update related command docs under `~/ai-kb/commands/` so the new rule is discoverable.
6. Keep entries concise, domain-scoped, and free of project-specific private details.

## Quality Guardrails

- Do not apply recommendations blindly; treat them as proposals.
- Reject duplicate or contradictory guidance.
- Ensure new guidance does not conflict with `architecture.md`, `error-handling.md`, `security.md`, and `tdd.md`.
