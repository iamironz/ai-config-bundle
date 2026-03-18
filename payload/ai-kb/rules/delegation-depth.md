# Delegation Depth

Mandatory rules for nested task execution and runtime-imposed delegation ceilings.

## Core Rules

- Root sessions should delegate by default for substantive work and avoid direct repo exploration whenever a specialist lane can do it instead.
- Substantive root requests should satisfy the delegation gate before broad main-thread search, repo reading, or mutation work.
- Depth-1 subagents should prefer direct work and only delegate independent, non-trivial parallel lanes.
- Depth-2 and deeper sessions must work directly and must not spawn further subagents.
- Internal control-plane sessions never delegate regardless of depth and never count as roots.
- If lineage is temporarily unknown, infer child depth from active task context or metadata when possible; otherwise treat new user-facing sessions as root-capable and internal/control sessions as direct-only.

## Depth Model

| Session state | Expected behavior |
|---|---|
| Root / depth 0 | Orchestrate, dispatch lanes, merge, and handle shared-state transitions |
| Depth 1 | Prefer direct tools; delegate only independent non-trivial parallel subproblems |
| Depth 2+ | Direct work only; no Task dispatch |
| Internal/control-plane | Direct work only; never spawn subagents |
| Unknown lineage during active parent task | Infer child depth from the active task window or metadata |
| Unknown lineage with no active parent | Treat user-facing sessions as new roots; keep internal/control sessions direct |

## Lineage Registration

- Record parent/child links from task metadata or session IDs before relying on nested delegation.
- Propagate depth markers or equivalent runtime context so children know their ceiling.
- Infer child depth from active parent-task context when child session metadata arrives late.
- Exclude internal/control-plane sessions from root election and lineage inference.
- If child registration fails and no active parent context exists, fall back to a new root session instead of silently forcing an unrelated session to depth 2.
- Do not re-delegate the same task you were given.

## Routing Interaction

- Command-intent routing still applies, but runtime safety rules override generic background-first defaults.
- When runtime context forbids the task tool, execute the routed workflow directly in the current lane and return results upward.
- Do not bounce work between lanes just to satisfy a generic delegation preference.
- Do not force unrelated top-level sessions into depth 2 just because another root session already exists.
