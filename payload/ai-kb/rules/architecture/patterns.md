# Architecture Patterns

## Offline-First Architecture

### Local-First Principle
- Device storage is primary source of truth
- Backend is eventual consistency partner
- Users get instant interactions regardless of connectivity

### Patterns
- **Sync Queue**: Queue local changes for background sync
- **Optimistic UI**: Show changes immediately, rollback on failure
- **Conflict Resolution**: Last-write-wins, merge strategies, or CRDTs

### Considerations
- Handle storage limits and data eviction
- Plan for sync failures and retries
- Document conflict resolution in ADRs

---

## Event-Driven Architecture

### Event Sourcing
- Store state as sequence of events, not current state
- Enables audit trails, temporal queries, state reconstruction
- Best for: financial, compliance, complex state transitions

### Patterns
- **Saga**: Orchestrate distributed transactions (choreography or orchestration)
- **Transactional Outbox**: Write events to outbox table in same transaction
- **Competing Consumer**: Multiple consumers process shared queue (design for idempotency)

### Event Contracts
- Treat events as first-class APIs
- Version events, document schema
- Event catalog for discoverability

---

## CQRS

### When to Use
- High read-to-write ratio
- Read/write structures differ significantly
- Need independent scaling

### Implementation
- Separate read models (denormalized) from write models (normalized)
- Can use different databases for each
- Handle eventual consistency in UI

### Without Event Sourcing
- CQRS can work without event sourcing
- Start with command/query separation, add ES later if needed
