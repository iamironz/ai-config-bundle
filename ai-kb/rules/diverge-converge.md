# Diverge-Converge Ideation

Reusable policy for exploratory work that benefits from branching options before selecting one path.

## Use It When

- Problem framing is open-ended or under-specified.
- Multiple plausible approaches exist and choice materially affects implementation.
- The request explicitly asks to compare options, brainstorm, or "diverge then converge".
- Early exploration can reduce downstream rework or architectural risk.

## Do Not Use It When

- Task is deterministic (single clear fix, known command, mechanical edit).
- Constraints already force one viable path.
- Time-sensitive execution favors direct implementation over ideation.
- The user explicitly requests a single-path execution without alternatives.

## Branching Guidance (Divergence)

- Default to 3-5 branches.
- Use 2 branches for narrow scope; use 6-7 only for high-uncertainty, high-impact decisions.
- Keep branches meaningfully distinct (architecture, risk profile, implementation sequence, or tooling).
- Timebox branch generation and capture assumptions per branch.

## Convergence Rubric

Score each branch briefly using these criteria:

1. Goal fit (meets DoD and constraints)
2. Feasibility (effort, dependencies, team/tool readiness)
3. Risk (technical, operational, regression)
4. Verifiability (testability and validation clarity)
5. Reversibility (rollback/migration cost)

Select the best branch (or hybrid), state why in 1-3 bullets, then proceed with a single execution plan.

## Integration Notes

- Treat this as an ideation layer; do not override `ai-kb/rules/command-orchestration.md`.
- Keep Task Context Packet requirements unchanged.
- Prefer this pattern in planning/research/review workflows when triggers are present.
