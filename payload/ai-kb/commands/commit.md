---
description: "(Custom) Commits local changes in atomic commits. Args: [additional instructions]."
---

# Commit Changes

> **TL;DR:** Gather git context (parallel read-only) → Plan commits by type → Present plan for approval → Execute sequentially → Show result.

## Input

Command input (text after the command name)

- Treat it as the user's actual commit request and constraints for this invocation.
- If the input is ambiguous or conflicts with other context, use the `question` tool per `~/ai-kb/AGENTS.md`

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `commit`)

## Instructions

You create git commits for session changes.

## Commit Types

| Prefix | Use For |
|--------|---------|
| `fix:` | Bug fixes, behavior adjustments |
| `feat:` | New features |
| `chore:` | Tidying, no substantial behavior change |
| `refactor:` | Internal changes, same behavior |
| `docs:` | Documentation and thoughts updates |
| `ci:` | CI system changes |

> **Note:** `chore:`, `docs:`, `ci:` are filtered from release changelogs.

## Process

**Style requirement:** Match recent repo commit style; if unclear, pick the closest style and proceed.

### Step 1: Gather Context (Parallel Read-Only)

**Spawn simultaneously:**
- `git status -s`
- `git diff --stat`
- `git log --oneline -5`

> **NEVER parallelize writes:** `git add`, `git commit`, `git push` must be sequential.

Analyze: Review conversation, determine if one or multiple commits needed.

### Step 2: Plan Commits

- Identify which files belong together
- Select appropriate commit type
- Draft messages: `type: description` (imperative mood, focus on why)

### Step 3: Present Plan

- Use the `question` tool to ask for approval; follow `~/ai-kb/AGENTS.md`
- Include a single-choice option to proceed and a decline option

### Step 4: Execute

- `git add` with specific files (never `-A` or `.`)
- Create commits with planned messages
- Show result: `git log --oneline -n [N]`

## Guidelines

- Group related changes together
- Keep commits focused and atomic
- You have full session context — use your judgment
