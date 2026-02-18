# Code Quality Metrics

## Size Limits (NO EXCEPTIONS)

> These limits apply to ALL files — production AND test code.

| Metric | Ideal | Hard Limit |
|--------|-------|------------|
| **Functions** | 20-50 lines | 80 max |
| **Files** | 200-400 lines | 500 max |
| **Line width** | 80 chars | 100 max |
| **Nesting** | 2 levels | 3 max |
| **Parameters** | 2-3 | 4 max |
| **Complexity** | 5-7 | 10 max |

### Common False Exceptions

| Claim | Reality |
|-------|---------|
| "Test files can be longer" | NO — split by scenario/feature |
| "Generated code is exempt" | NO — configure generator or exclude from review |
| "Legacy code is exempt" | NO — refactor incrementally |
| "Complex domain needs more" | NO — extract helpers/utilities |

## Cognitive Complexity
- Measures human understandability (not just branches)
- Considers: nesting depth, recursive calls, shorthand expressions
- **Threshold**: 15 for functions (SonarQube default)
- Better predictor of maintainability than cyclomatic alone

## Code Smells
- **Bloaters**: Long method, large class, long parameter list
- **Couplers**: Feature envy, inappropriate intimacy, message chains
- **Dispensables**: Dead code, duplication, speculative generality
- **Change Preventers**: Divergent change, shotgun surgery
