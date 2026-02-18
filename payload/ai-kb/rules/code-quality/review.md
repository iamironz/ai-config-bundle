# Code Review

## 10-Step Framework
1. **Functionality** — meets requirements + edge cases
2. **Readability** — naming, formatting, comments
3. **Structure/Design** — SOLID, modularity, separation
4. **Performance** — bottlenecks, memory, algorithms
5. **Error Handling** — try-catch, logging, no sensitive data
6. **Security** — validation, injection, secrets
7. **Tests** — coverage, edge cases (confirm build/tests green)
8. **Reuse/Dependencies** — DRY, dependency freshness
9. **Standards** — linters, static analysis
10. **Documentation** — inline comments, docstrings

## PR Standards
- Include ticket numbers in title
- Screenshots for UI changes
- Document breaking changes
- Self-review before requesting review

## Documentation Standards

### Required Levels
- **Inline comments** — only for non-obvious/complex logic
- **Function docstrings** — parameters, returns, exceptions
- **Module documentation** — purpose, dependencies, usage
- **Architecture docs** — system interactions

### Rules
- Comments explain "why" not "what"
- Keep docs in sync with code
- Use consistent docstring format
- Document design decisions and trade-offs
