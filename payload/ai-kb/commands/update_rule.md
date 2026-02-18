---
description: "(Custom) Update/add/remove/compact rules and review structure. Args: <action> <rule-file> [content/context]."
---

# Update Rule

> **TL;DR:** Parse action → Check structure type (standalone vs split) → Apply changes following style guidelines → Validate size thresholds → Report status.

## Input

$ARGUMENTS
- Treat `$ARGUMENTS` as the actual action/targets/constraints for this invocation (e.g., `add`, `update`, `remove`, `compact`, `review`).
- If `$ARGUMENTS` is missing details, use the `question` tool to clarify per `~/ai-kb/AGENTS.md`

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Follow parallel execution policy in AGENTS.md (offload heavy work, keep main thread light)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `update_rule`)
- Load and follow `~/ai-kb/rules/kb-maintenance.md` for recommendation-driven updates
- If present, review `.cursor/kb-recommendations/*.md` and `.opencode/kb-recommendations/*.md`

## Instructions

Maintain rule docs at `~/ai-kb/rules/`. Keep rules clean, structured, granular.

## Structure Types

| Type | When | Size |
|------|------|------|
| **Standalone** | Topic cohesive, <150 lines | Full content in single file |
| **With Subdirectory** | >150 lines or distinct subtopics | Overview (35-50 lines) + Level 2 subdocs (20-60 lines each) |

## Style Guidelines

- Concise text, no filler
- Signatures/patterns only — NO code blocks
- Tables for structured data
- Bullet points for lists

## Actions

### `add <topic> <content>`
1. If exists: add to appropriate level
2. If new <150 lines: create standalone
3. If new >150 lines: create level 1 + subdirectory
4. Update subdocuments table if split doc

### `update <file> [context]`
1. Read and modify target
2. Maintain style (no code blocks)
3. If >150 lines → propose split

### `remove <file|section>`
1. Remove content
2. Update subdocuments tables
3. Clean orphaned references

### `compact <file|all>`
1. Code blocks → signatures only
2. Long explanations → bullets
3. Duplicates → consolidate

### `review [file|all]`
Report: size violations, missing entries, orphaned docs, split candidates

## Size Thresholds

| Type | Target | Split At |
|------|--------|----------|
| Level 1 standalone | <150 lines | >150 |
| Level 1 with subdirs | 35-50 lines | N/A |
| Level 2 | 20-60 lines | >60 |

## Process

1. **Analyze:** Parse action, read current state, determine structure type
2. **Execute:** Apply changes following style
3. **Validate:** Size thresholds, subdocs table accuracy, no code blocks
4. **Report:**
   ```
   ## Changes Applied
   - [file]: [what changed]
   
   ## Structure Status
   - [file] (X lines): OK | NEEDS SPLIT | NEEDS COMPACT
   ```

## Examples

```
/update-rule add kotlin "Guard conditions in when expressions"
/update-rule update security/api.md
/update-rule compact defense-in-depth.md
/update-rule review
```
