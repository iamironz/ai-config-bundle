---
description: "(Custom) Perform comprehensive research using available MCPs. Args: [research query]."
---

# Perform Research

Perform deep research on a topic using all available MCP tools before synthesizing a final answer.

**Use for:** Investigating complex topics, gathering library documentation, finding current best practices, or fixing stubborn errors.

---

## Input

Command input (text after the command name)

- Treat it as the research query and constraints for this invocation.

---

## Before Starting

- Follow `~/ai-kb/AGENTS.md` operational loop (`<rule_context>` required)
- Load and follow `~/ai-kb/rules/command-orchestration.md` (bundle: `research`)
- Read project docs (`doc/`, `AGENTS.md`) before starting
- Load `~/ai-kb/rules/mcp-research.md` to guide tool selection
- If the query is ambiguous, use the `question` tool to clarify scope

---

## Workflow

1. **Analyze & Plan**
   - Break down the research query into sub-questions
   - Load and follow `~/ai-kb/rules/mcp-research.md` for tool selection
   - Check for existing knowledge in `~/ai-kb/rules/` to avoid redundancy

2. **Execute Research Loop**
   - Run multiple queries per item across relevant MCP tools
   - Prefer official docs for APIs, signatures, and version-specific behavior
   - Use web search for recent breakages, migration notes, and real-world fixes
   - Use repository search/examples for implementation patterns and edge cases
   - Iterate if findings are contradictory or incomplete

3. **Synthesize Findings**
   - Combine results into a structured summary
   - Cite sources with URLs
   - Highlight consensus vs. conflict
   - Provide actionable recommendations based on the research
   - If you create a report document, append an "Original Prompt" section at the bottom

4. **Format Output**
   - Use the standard Research Report format:
     - **Executive Summary**: Brief high-level answer
     - **Detailed Findings**: Structured by sub-topic with sources
     - **Sources**: List of [Title](URL)
     - **Recommendations**: Actionable next steps

---

## After Completion

**If findings contradict existing rules →** propose an update via `update_rule`

**If new libraries are recommended →** verify license compatibility and maintenance status

**If code examples are found →** verify they match current project patterns and versions
