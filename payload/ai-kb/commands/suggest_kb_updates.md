---
description: "(Custom) Suggest KB rule/command updates from recent work. Args: [focus keywords or scope]."
---

# Suggest KB Updates

Generate KB enrichment recommendations (rules/commands) based on durable learnings from recent work.

This command creates recommendation docs only. It MUST NOT directly edit KB rules/commands.

**Use for:** Capturing reusable principles, pitfalls, and workflows worth adding to `~/ai-kb/`.

---

## Input

Command input (text after the command name)

- Treat it as the focus scope (keywords, files, incident name, or "what we learned").
- If scope is empty, default to the most recent meaningful work segment in this session.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required).
- Load and follow:
  - `~/ai-kb/rules/INDEX.md` (target selection)
  - `~/ai-kb/rules/kb-maintenance.md` (recommendation workflow)
  - `~/ai-kb/rules/command-orchestration.md` (bundle: `suggest_kb_updates`)
- Privacy guardrails:
  - Do not include secrets, tokens, credentials, private keys.
  - Do not include proprietary code, internal URLs, or sensitive logs.
  - Redact specifics; keep guidance general and portable.

---

## Structured Output (Same Schema as the Hooks)

Produce a JSON object with this schema:

```json
{
  "should_recommend": true,
  "confidence": "low",
  "conversation_summary": "string",
  "recommendations": [
    {
      "action": "update_existing",
      "target_path": "~/ai-kb/rules/<...>.md",
      "reason": "string",
      "suggested_content": "string",
      "link_commands": ["~/ai-kb/commands/<...>.md"]
    }
  ],
  "index_updates": [
    {
      "index_path": "~/ai-kb/rules/INDEX.md",
      "entry": "string",
      "reason": "string"
    }
  ]
}
```

Constraints:

- `target_path` must be under `~/ai-kb/rules/` or `~/ai-kb/commands/`.
- Recommendations must be concise and non-duplicative.
- If nothing durable should be added, set `should_recommend=false` and use empty arrays.

---

## Workflow

1. **Build the history window**
   - Summarize the work segment in plain text (goal, constraints, key decisions, mistakes, fixes).
   - Keep it focused; omit sensitive details.

2. **Generate recommendations (JSON)**
   - Use the schema above.
   - Prefer updating an existing rule/command when it fits.
   - Create new rule/command only when no existing target fits cleanly.

3. **Deduplicate**
   - Scan recommendation queues for similar content and skip duplicates.
     - Project-local (preferred): `.cursor/kb-recommendations/`, `.opencode/kb-recommendations/`
     - Global fallback: `~/.cursor/kb-recommendations/`, `~/.config/opencode/kb-recommendations/`
   - If the target KB doc exists (`target_path`): skip if it already contains equivalent guidance.

4. **Write recommendation file(s)**
   - Write to any recommendation queue that exists (create directory if missing and safe to do so).
     - Project-local (preferred): `.cursor/kb-recommendations/`, `.opencode/kb-recommendations/`
     - Global fallback: `~/.cursor/kb-recommendations/`, `~/.config/opencode/kb-recommendations/`
   - Filename: `<YYYYMMDD-HHMMSS>-manual-suggest_kb_updates.md`

Use this markdown structure:

```
# KB Enrichment Recommendation

- Generated: `<ISO8601>`
- Source: `manual:suggest_kb_updates`
- Scope: `<short scope summary>`
- Confidence: `<low|medium|high>`

## Conversation Summary
<text>

## Recommendations
- **<action>** `<target_path>`
  - Reason: <reason>
  - Suggested content: <suggested_content>
  - Link command docs:
    - `<path>`

## Index Updates
- `~/ai-kb/rules/INDEX.md`
  - Entry: <entry>
  - Reason: <reason>

## Next Action
- Review and apply validated updates using `update_rule` or `update_docs`.
```

---

## After Completion

- If recommendations are valid: apply them explicitly using `update_rule` (and update the index when needed).
- Do not auto-apply KB changes as part of this command.
