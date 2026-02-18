# Technical Debt Management

## Quantification
- **Technical Debt Ratio** = cost to fix / cost to develop
- **SQALE Method** — debt in time units (hours/days)
- Financial framing: hours × hourly rate = dollar cost

## Management Strategies
- Allocate **20% of sprint capacity** to debt (non-negotiable)
- Dedicated tech debt backlog with same priority as features
- Periodic "debt sprints" for larger refactors
- Track debt categories (reckless vs prudent, deliberate vs inadvertent)

## Warning Signs
- Delays in time-to-market
- High volume of defect-related work
- Code smells accumulating
- Knowledge silos forming

## Related Principles
- **DRY** — no duplicated logic
- **KISS** — avoid premature optimization
- **YAGNI** — don't build speculative features
- **Composition over Inheritance** — prefer delegation
