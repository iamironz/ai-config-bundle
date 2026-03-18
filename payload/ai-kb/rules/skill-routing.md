# Skill Routing

Mandatory policy for automatic intent-to-workflow routing via skills.

## Core Rules

- For every substantive request without an explicit slash command, load `command-parity-router` skill first.
- Infer workflow intent from user text; do not require users to restate requests as commands.
- When multiple intents are present, compose multiple workflows in one execution.
- Routing remains mandatory, but runtime safety limits may require direct execution in the current lane instead of another Task dispatch.
- Ask only blocking clarifications; otherwise proceed with explicit assumptions.
- If skill loading is unavailable, apply this mapping directly and continue.

## Intent to Workflow Mapping

| Intent | Workflow doc |
|---|---|
| plan/options/approach | `~/ai-kb/commands/create_plan.md` |
| execute existing plan | `~/ai-kb/commands/execute_plan.md` |
| feature implementation | `~/ai-kb/commands/implement_feature.md` |
| bug fix/debug | `~/ai-kb/commands/fix_issue.md` |
| add tests | `~/ai-kb/commands/implement_tests.md` |
| run tests | `~/ai-kb/commands/run_tests.md` |
| run build | `~/ai-kb/commands/run_build.md` |
| deep scan/review/audit | `~/ai-kb/commands/review_code.md` |
| exploratory ideation, alternatives, tradeoffs, "diverge then converge" | `~/ai-kb/commands/create_plan.md` + `~/ai-kb/rules/diverge-converge.md` |
| validate domain/spec | `~/ai-kb/commands/validate_domain.md` |
| validate runtime/logs | `~/ai-kb/commands/validate_runtime.md` |
| external research | `~/ai-kb/commands/research.md` |
| docs update | `~/ai-kb/commands/update_docs.md` |
| rule update | `~/ai-kb/commands/update_rule.md` |
| kb suggestion | `~/ai-kb/commands/suggest_kb_updates.md` |
| local commit | `~/ai-kb/commands/commit.md` |

## Composition Order

1. Clarify DoD and hard constraints
2. Research/runtime/domain validation
3. Plan
4. Implement/fix
5. Tests/build/review
6. Docs/rules updates
7. Commit (only when explicitly requested)

## Enforcement

- Background-first remains mandatory at the root. Runtime safety rules may force direct work only for internal or depth-limited sessions, not as a normal root-path escape hatch.
- If runtime context marks the session as internal or depth-limited, keep the routed workflow direct; do not violate `plugin-safety.md` or `delegation-depth.md` just to satisfy generic delegation defaults.
- Routed/delegated tasks must include the full Task Context Packet from `~/ai-kb/rules/command-orchestration.md` (objective + DoD, scope/assumptions, relevant artifacts, constraints/rules, expected output format), including shared context per parallel lane and lane-specific objectives.
- If skill routing was skipped accidentally, stop and re-enter through skill routing.
- For exploratory requests, apply `~/ai-kb/rules/diverge-converge.md` with context-sensitive branch counts (default 3-5) and explicit "when not to diverge" checks.
