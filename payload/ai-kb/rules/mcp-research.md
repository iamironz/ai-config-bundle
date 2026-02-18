# Research Guidelines

## When to Research

**Before giving up or guessing**, use available research tools:

1. **Initial fix/implementation failed** → verify the correct approach
2. **Uncertain about API/syntax** → read official documentation
3. **Error message unclear** → search for similar issues and known fixes
4. **Not enough context** → gather more data before proceeding
5. **Multiple plausible solutions** → compare best practices and tradeoffs

## Available Research Tools (Categories)

The exact tooling varies by environment. Use the best available option in each category.

### Official Documentation Lookup

Use when you need:

- Correct API signatures and usage
- Version-specific behavior
- Canonical examples and configuration

### Web Search (Recent Information)

Use when you need:

- Fixes for cryptic error messages
- Migration guides and deprecation context
- Recent best practices and ecosystem changes

### Repository Search (Real-World Examples)

Use when you need:

- Reference implementations and patterns
- Issue/PR discussions that explain edge cases
- Release notes, changelogs, or upgrade docs

### Fetch Primary Sources

- Prefer reading the source page itself over relying on summaries.
- Cite the URL(s) you used.

## Privacy and Safety (Mandatory)

- Do not paste secrets, tokens, private keys, or credentials into external tools.
- Do not paste proprietary code, logs, or internal URLs into external tools.
- Redact sensitive values and minimize snippets to the smallest necessary context.

## Mandatory Research Triggers

> STOP and research if ANY of these apply:

| Situation | Why Research is Required |
|-----------|-------------------------|
| About to say "I don't know how to..." | Never give up without searching first |
| Error persists after 2 fix attempts | Your assumptions are likely wrong — verify |
| Using library/framework for first time | Don't guess API — read the docs |
| Code worked before but now fails | API might have changed — check version |
| Uncertain between multiple approaches | Research best practices before choosing |
| Copy-pasting from memory | Syntax may have changed — verify current |

## Research Flow

1. Try an initial solution; if uncertain, pause to research.
2. For known libraries/frameworks: start with official docs.
3. For errors and "how to" questions: search the exact error text and context.
4. For patterns/examples: search repositories and READMEs, then validate with primary sources.
5. Apply the researched solution and cite sources.

## Tool Selection Quick Reference

| I need... | Use... | Example query |
|-----------|--------|---------------|
| Official API docs | Official docs lookup | "library X API authentication" |
| Fix for error message | Web search | Exact error text |
| Best practices (recent) | Web search + primary sources | "best way to X in Kotlin 2025" |
| Real-world examples | Repository search | "repo example X pattern" |
| Migration guide | Web search + release notes | "migrate from X to Y" |

## Anti-Patterns — Never Do This

| Bad | Good |
|-----|------|
| Guess API syntax from memory | Verify with official docs |
| Give up after 1 failed attempt | Research after 2 attempts |
| Use summaries only | Read primary sources and cite URLs |
| Paste sensitive data into external tools | Redact and minimize context |
