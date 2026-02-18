# Lock-Free Data Structures

## Memory Reclamation
- **Hazard Pointers**: Mark pointers currently in use
- **Epoch-Based Reclamation (EBR)**: Grace periods for safe deallocation
- **RCU (Read-Copy-Update)**: Readers never block, writers create new versions

## ABA Problem
- CAS succeeds incorrectly because value changed A→B→A
- Solve with version counters or tagged pointers

## Progress Guarantees
- **Wait-free**: Every thread completes in bounded steps
- **Lock-free**: Some thread always completes
- **Obstruction-free**: Thread completes if running alone

---

## Memory Ordering

### Semantics
- `relaxed` — no ordering guarantees
- `acquire` — reads after this see writes before release
- `release` — writes before this visible after acquire
- `acq_rel` — both acquire and release
- `seq_cst` — total order (strongest, default)

### Rules
- Use weakest sufficient ordering for performance
- Acquire-release pairing creates happens-before relationship
- Too few fences = bugs, too many = slow

### Considerations
- Store buffers and speculative execution can expose races
- `consume` ordering rarely used correctly — avoid
