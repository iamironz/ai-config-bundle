---
description: "(Custom) Inspect runtime behavior and logs for correctness. Args: [scenario/logs]."
---

# Validate Runtime

Analyze runtime behavior, logs, and actual system state to validate correctness.

**Use for:** Runtime debugging, log analysis, state inspection, behavior verification.

---

## Input

Command input (text after the command name)

- Treat it as the scenario/logs to analyze and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `validate_runtime`)
- Read project docs (`doc/`, `AGENTS.md`) before analysis
- Focus rules: `logging.md`, `error-handling.md`, `thread-safety.md` (plus security via INDEX)

---

## Workflow

1. **Gather Runtime Data**
   - Collect relevant logs
   - Capture application state
   - Note timing and sequence of events
   - Identify user actions that triggered behavior

2. **Analyze Logs**
   - Look for errors and warnings
   - Trace request/response flow
   - Identify timing anomalies
   - Check for missing expected entries

3. **Inspect State**
   - Check database/storage state
   - Verify in-memory state consistency
   - Compare expected vs actual values
   - Look for stale or corrupted data

4. **Trace Data Flow**
   - Follow data from input to output
   - Identify transformation points
   - Check for data loss or corruption
   - Verify ordering and timing

5. **Identify Root Cause**
   - Correlate findings across sources
   - Form hypothesis
   - Design verification experiment
   - Confirm or refine hypothesis using the `question` tool per `~/ai-kb/AGENTS.md` if user input is required

6. **Document Findings**
   - Timeline of events
   - Root cause analysis
   - Evidence supporting conclusion
   - Recommended fix

---

## After Completion

**If race condition found →** verify fix with stress testing

**If data corruption found →** plan data recovery/migration

**If configuration issue →** document correct configuration

**If external system issue →** document workaround and escalation
