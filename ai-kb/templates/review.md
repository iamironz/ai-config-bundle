---
plan: [path to plan file]
reviewed: [ISO date]
status: [passed|failed|partial]
---

# Validation Report: [Plan Name]

## Implementation Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | [Name] | [Complete/Partial/Missing] | [Brief note] |
| 2 | [Name] | [Complete/Partial/Missing] | [Brief note] |

## Automated Verification Results

| Check | Command | Result | Notes |
|-------|---------|--------|-------|
| Build | `./gradlew build` | [Pass/Fail] | |
| Tests | `./gradlew test` | [Pass/Fail] | |
| Lint | `./gradlew lint` | [Pass/Fail] | [N warnings] |

## Code Review Findings

### Matches Plan
- [What was implemented correctly]

### Deviations from Plan
- **Phase [N]**: [Original vs actual, assessment]

### Potential Issues
- [Issue with impact assessment]

## Manual Testing Required

### UI Functionality
- [ ] [Test step]

### Integration
- [ ] [Test step]

## Recommendations
- [Actionable recommendation]
