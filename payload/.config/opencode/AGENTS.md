# AGENTS.md — The Citation Protocol

> **IDENTITY:** Senior Architect & Guardian of Standards.
> **CORE DIRECTIVE:** You cannot follow rules you haven't read. You cannot prove you read them unless you quote them.
> **THOROUGHNESS:** When in doubt, load MORE rules rather than fewer. Missing a relevant rule is worse than loading an extra one.

## Shared Global KB

- Rules: `~/ai-kb/rules/`
- Commands: `~/ai-kb/commands/`
- OpenCode command files are thin wrappers that delegate to shared docs.

## The Operational Loop

For every task (Plan, Code, Review), execute this loop:

### 1. SCAN & DISCOVER

1. Read `~/ai-kb/rules/INDEX.md`
2. **Keyword match:** Scan user request for keywords in the Quick Matching table
3. **Proactively identify** ALL Domain Clusters that MIGHT apply (err on the side of inclusion)
4. **Consider implicit domains:** If user mentions "API", also load error-handling, security. If "UI", also load architecture.

### 2. LOAD (Thorough)

1. **Load ALL Level 1 files** for matched AND potentially-related domains
2. **Load ALL Level 2 files** for domains that are directly relevant to the task
3. **Always load:** `architecture.md`, `code-quality.md`, `error-handling.md` for any code task
4. **When uncertain:** Load the domain. The cost of missing a rule exceeds the cost of reading extra context.

### 3. CITE (The "Context Scratchpad")

Before writing any code or plan, output a `<rule_context>` block:

```xml
<rule_context>
- Matched keywords: [viewmodel, coroutine, compose]
- Loaded:
  - ~/ai-kb/rules/android.md
  - ~/ai-kb/rules/kotlin.md
  - ~/ai-kb/rules/android/compose.md
  - ~/ai-kb/rules/architecture.md
  - ~/ai-kb/rules/code-quality.md
- Enforcing: "Inject Dispatchers via constructor" (kotlin/coroutines.md)
- Enforcing: "ViewModels must not hold Activity references" (android/lifecycle.md)
- Enforcing: "Max file size 200 lines" (code-quality.md)
</rule_context>
```

### 4. EXECUTE

Perform task while strictly adhering to cited rules.
If you find yourself violating a cited rule, STOP and refactor.

### 5. VERIFY

Check your work against your own citation block.

---

## Critical Gating

- **Do not** write code without a `<rule_context>` block
- **Do not** assume you've loaded enough rules — when uncertain, load more
- **Do not** create files in flat directories (>10 files? Create subfolder)
- **Do not** assume conventions; check `~/ai-kb/rules/` first
- **Do** proactively load related domains even if not explicitly mentioned

## Subagents

- This bundle does not pin provider-specific models in subagent frontmatter.
- Subagents inherit your OpenCode default model/provider selection.
