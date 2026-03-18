# Plugin Safety

Mandatory guardrails for plugins, hooks, analyzers, and other control-plane automation.

## Core Rules

- Expose only the minimal hook surface required; do not attach heavy analysis to per-token or other high-frequency hooks unless the recursion risk is explicitly bounded.
- Keep heavy analysis on coarse triggers such as compaction or end-of-turn checkpoints.
- Give internal control-plane sessions an explicit identity and keep them out of normal automation loops.
- Recommendation generators may write proposal artifacts, never mutate canonical KB docs or user worktrees directly.
- Fail open: plugin errors must not break the interactive session.
- Use shared registries when multiple plugins must recognize or suppress the same internal activity.

## Trigger Budgeting

| Concern | Required guardrail |
|---|---|
| High-frequency hooks | Prefer compaction/end-of-turn or another coarse trigger for heavy work |
| Burst session creation | Circuit breaker or rate window |
| Repeated runs | Cooldown between analyses |
| Overlap | Concurrency cap and active-session dedupe |
| Re-entry | Ignore internal/control-plane sessions and already-active session IDs |

## Internal Session Handling

- Register internal session IDs before prompting them and remove the IDs during cleanup.
- Exclude internal session IDs from root election and delegation lineage inference.
- Internal sessions must never spawn subagents or trigger the same analyzer again.
- Internal sessions must never consume user-facing delegation gates or root-capable session slots.
- Use explicit markers or titles so downstream checks can detect control-plane traffic even when IDs are missing from the payload.
- Clean up temporary sessions and tracking state in `finally` paths.

## Output Safety

- Filter duplicates against existing KB docs and queued recommendation files before writing new proposals.
- Externalize oversized suggested content to sidecar artifacts instead of bloating the main recommendation file.
- Prefer project-local queues when they exist; fall back to global queues only when project-local control files are absent.
- Keep logs and artifacts free of secrets or private user content.

## Failure Handling

- Swallow and log plugin/analyzer errors on the control plane instead of surfacing them as user-facing failures.
- On partial failure, preserve the user's main session and skip the analyzer run.
- Reset busy flags, active-session sets, and other in-memory guards even when cleanup fails.
