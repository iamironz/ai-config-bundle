---
description: "(Custom) Update project documentation for code changes. Args: [doc scope]."
---

# Update Docs

Update project documentation to reflect code changes.

**Use for:** Documentation updates, README changes, API docs, architecture docs.

---

## Input

Command input (text after the command name)

- Treat it as the request and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `update_docs`)
- Load and follow `~/ai-kb/rules/kb-maintenance.md` when recommendation queues are present
- Read project docs (`doc/`, `AGENTS.md`) before edits
- Focus rules: `architecture.md`, `error-handling/http.md`
- If present, review `~/.cursor/kb-recommendations/*.md` and `~/.config/opencode/kb-recommendations/*.md`

---

## Workflow

1. **Identify What Changed**
   - List code changes that affect documentation
   - Identify new features, APIs, or behaviors
   - Note deprecated or removed functionality

2. **Find Affected Docs**
   - Search for existing documentation
   - Check README, doc/, wiki, inline comments
   - Identify outdated sections

3. **Update Documentation**
   - Add new feature documentation
   - Update changed behavior descriptions
   - Remove or mark deprecated content
   - Keep examples current

4. **Verify Accuracy**
   - Test documented examples work
   - Verify links are not broken
   - Check formatting renders correctly

5. **Maintain Consistency**
   - Follow existing documentation style
   - Use consistent terminology
   - Keep same level of detail

---

## After Completion

**If new API documented →** verify examples compile/run

**If architecture changed →** update diagrams

**If breaking changes →** document migration path
