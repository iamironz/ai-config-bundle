import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"

const MAX_HISTORY_CHARS = Number(process.env.AI_KB_MAX_HISTORY_CHARS || 120000)
const MIN_HISTORY_CHARS = Number(process.env.AI_KB_MIN_HISTORY_CHARS || 800)
const SCAN_LIMIT = Number(process.env.AI_KB_RECOMMENDATION_SCAN_LIMIT || 300)

const activeSessionAnalyses = new Set()
const internalSessionIds = new Set()
let analyzerBusy = false

function slug(value, fallback) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || fallback
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function tokenize(value) {
  return new Set((normalizeText(value).match(/[a-z0-9_]{3,}/g) || []).filter(Boolean))
}

function coverageRatio(base, candidate) {
  const baseTokens = tokenize(base)
  const candidateTokens = tokenize(candidate)
  if (baseTokens.size === 0 || candidateTokens.size === 0) {
    return 0
  }
  let intersection = 0
  for (const token of candidateTokens) {
    if (baseTokens.has(token)) {
      intersection += 1
    }
  }
  return intersection / Math.max(1, candidateTokens.size)
}

function containsOrSimilar(base, candidate) {
  const baseNorm = normalizeText(base)
  const candidateNorm = normalizeText(candidate)
  if (candidateNorm.length >= 50 && baseNorm.includes(candidateNorm)) {
    return true
  }
  return coverageRatio(baseNorm, candidateNorm) >= 0.55
}

function collectStrings(value, maxItems = 5000) {
  const out = []
  const stack = [value]
  while (stack.length > 0 && out.length < maxItems) {
    const current = stack.pop()
    if (typeof current === "string") {
      const trimmed = current.trim()
      if (trimmed) {
        out.push(trimmed)
      }
      continue
    }
    if (Array.isArray(current)) {
      for (let i = current.length - 1; i >= 0; i -= 1) {
        stack.push(current[i])
      }
      continue
    }
    if (current && typeof current === "object") {
      for (const key of Object.keys(current)) {
        stack.push(current[key])
      }
    }
  }
  return out
}

function findIdByKeyPattern(value, pattern) {
  const stack = [{ node: value, keyPath: [] }]
  while (stack.length > 0) {
    const { node, keyPath } = stack.pop()
    if (!node || typeof node !== "object") {
      continue
    }
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i -= 1) {
        stack.push({ node: node[i], keyPath })
      }
      continue
    }
    for (const [key, child] of Object.entries(node)) {
      const nextPath = [...keyPath, key]
      if (typeof child === "string" && pattern.test(nextPath.join("."))) {
        return child.trim()
      }
      if (child && typeof child === "object") {
        stack.push({ node: child, keyPath: nextPath })
      }
    }
  }
  return ""
}

function normalizeHistory(rawText) {
  if (!rawText) {
    return ""
  }
  const cleaned = rawText.replace(/\u0000/g, "").trim()
  if (cleaned.length <= MAX_HISTORY_CHARS) {
    return cleaned
  }
  return cleaned.slice(cleaned.length - MAX_HISTORY_CHARS)
}

function sliceSinceLastCompaction(historyText) {
  const patterns = [/session\.compacted/i, /\bprecompact\b/i, /\bcompaction\b/i, /\bcompacted\b/i]
  let lastIndex = -1
  for (const pattern of patterns) {
    for (const match of historyText.matchAll(new RegExp(pattern.source, "gi"))) {
      if (typeof match.index === "number" && match.index > lastIndex) {
        lastIndex = match.index
      }
    }
  }
  return lastIndex < 0 ? historyText : historyText.slice(lastIndex)
}

function buildAnalyzerPrompt(historyText) {
  return [
    "You are a senior KB curator.",
    "Analyze the history window pending compaction and identify durable knowledge that should update AI KB.",
    "Use cross-turn reasoning (patterns across the dialog), not single-turn keyword matching.",
    "Return strict JSON only.",
    "Schema:",
    "{",
    '  "should_recommend": boolean,',
    '  "confidence": "low"|"medium"|"high",',
    '  "conversation_summary": string,',
    '  "recommendations": [',
    "    {",
    '      "action": "update_existing"|"create_new",',
    '      "target_path": string,',
    '      "reason": string,',
    '      "suggested_content": string,',
    '      "link_commands": [string]',
    "    }",
    "  ],",
    '  "index_updates": [',
    "    {",
    '      "index_path": "~/ai-kb/rules/INDEX.md",',
    '      "entry": string,',
    '      "reason": string',
    "    }",
    "  ]",
    "}",
    "Constraints:",
    "- target_path must be under ~/ai-kb/rules/ or ~/ai-kb/commands/",
    "- recommendations should be concise and non-duplicative",
    "- if no KB updates are needed, return should_recommend=false with empty arrays",
    "",
    "History window:",
    historyText,
  ].join("\n")
}

function buildSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      should_recommend: { type: "boolean" },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
      conversation_summary: { type: "string" },
      recommendations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            action: { type: "string", enum: ["update_existing", "create_new"] },
            target_path: { type: "string" },
            reason: { type: "string" },
            suggested_content: { type: "string" },
            link_commands: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["action", "target_path", "reason", "suggested_content", "link_commands"],
        },
      },
      index_updates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            index_path: { type: "string" },
            entry: { type: "string" },
            reason: { type: "string" },
          },
          required: ["index_path", "entry", "reason"],
        },
      },
    },
    required: ["should_recommend", "confidence", "conversation_summary", "recommendations", "index_updates"],
  }
}

async function runStructuredAnalysis(client, historyText) {
  const created = await client.session.create({
    body: {
      title: "[internal] kb-post-turn-analyzer",
    },
  })
  const createdSession = created?.data ?? created
  const analyzerSessionId = createdSession?.id
  if (!analyzerSessionId) {
    return null
  }

  internalSessionIds.add(analyzerSessionId)
  try {
    const response = await client.session.prompt({
      path: { id: analyzerSessionId },
      body: {
        parts: [{ type: "text", text: buildAnalyzerPrompt(historyText) }],
        format: {
          type: "json_schema",
          schema: buildSchema(),
          retryCount: 1,
        },
      },
    })
    const payload = response?.data ?? response
    const structured = payload?.info?.structured_output ?? payload?.info?.structured
    if (!structured || typeof structured !== "object") {
      return null
    }
    return structured
  } finally {
    try {
      await client.session.delete({ path: { id: analyzerSessionId } })
    } catch (_error) {
      // Ignore cleanup failures; plugin must remain fail-open.
    }
    internalSessionIds.delete(analyzerSessionId)
  }
}

async function resolveRecommendationDir(directory) {
  const projectDir = join(directory, ".opencode")
  try {
    const info = await stat(projectDir)
    if (info.isDirectory()) {
      return join(projectDir, "kb-recommendations")
    }
  } catch (_error) {
    // Ignore; fall back to global queue.
  }
  return join(homedir(), ".config", "opencode", "kb-recommendations")
}

async function readProjectFile(directory, relativePath) {
  const relative = String(relativePath || "").trim().replace(/\\/g, "/")
  try {
    if (relative.startsWith("ai-kb/")) {
      return await readFile(join(directory, relative), "utf8")
    }
    if (relative.startsWith("~/ai-kb/")) {
      return await readFile(join(homedir(), relative.slice(2)), "utf8")
    }
    return ""
  } catch (_error) {
    return ""
  }
}

async function loadExistingRecommendationDocs(outDir) {
  try {
    const entries = await readdir(outDir, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name)
      .sort()
      .slice(-SCAN_LIMIT)

    const docs = []
    for (const fileName of files) {
      try {
        docs.push(await readFile(join(outDir, fileName), "utf8"))
      } catch (_error) {
        // Ignore unreadable files.
      }
    }
    return docs
  } catch (_error) {
    return []
  }
}

async function recommendationAlreadyCovered({ recommendation, directory, existingDocs }) {
  const targetPath = String(recommendation?.target_path || "").trim()
  const suggested = String(recommendation?.suggested_content || "").trim()
  const reason = String(recommendation?.reason || "").trim()
  if (!targetPath && !suggested && !reason) {
    return true
  }

  const targetDoc = await readProjectFile(directory, targetPath)
  if (targetDoc) {
    if (suggested && containsOrSimilar(targetDoc, suggested)) {
      return true
    }
    if (reason && containsOrSimilar(targetDoc, reason)) {
      return true
    }
  }

  for (const doc of existingDocs) {
    const sameTarget = targetPath && doc.toLowerCase().includes(`\`${targetPath.toLowerCase()}\``)
    if (sameTarget) {
      if (suggested && containsOrSimilar(doc, suggested)) {
        return true
      }
      if (reason && containsOrSimilar(doc, reason)) {
        return true
      }
    }

    // Guard against model drift that chooses a different target path
    // for substantially the same recommendation content.
    if (suggested && containsOrSimilar(doc, suggested)) {
      return true
    }
    if (reason && containsOrSimilar(doc, reason)) {
      return true
    }
  }
  return false
}

async function indexUpdateAlreadyCovered({ update, directory, existingDocs }) {
  const indexPath = String(update?.index_path || "~/ai-kb/rules/INDEX.md").trim()
  const entry = String(update?.entry || "").trim()
  const reason = String(update?.reason || "").trim()

  const indexDoc = await readProjectFile(directory, indexPath)
  if (indexDoc && entry && containsOrSimilar(indexDoc, entry)) {
    return true
  }

  for (const doc of existingDocs) {
    const sameIndexPath = indexPath && doc.toLowerCase().includes(`\`${indexPath.toLowerCase()}\``)
    if (sameIndexPath) {
      if (entry && containsOrSimilar(doc, entry)) {
        return true
      }
      if (reason && containsOrSimilar(doc, reason)) {
        return true
      }
    }

    if (entry && containsOrSimilar(doc, entry)) {
      return true
    }
    if (reason && containsOrSimilar(doc, reason)) {
      return true
    }
  }
  return false
}

async function filterNovelAnalysis({ analysis, directory, outDir }) {
  const existingDocs = await loadExistingRecommendationDocs(outDir)

  const recommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : []
  const indexUpdates = Array.isArray(analysis?.index_updates) ? analysis.index_updates : []

  const filteredRecommendations = []
  for (const recommendation of recommendations) {
    if (!recommendation || typeof recommendation !== "object") {
      continue
    }
    if (
      !(await recommendationAlreadyCovered({
        recommendation,
        directory,
        existingDocs,
      }))
    ) {
      filteredRecommendations.push(recommendation)
    }
  }

  const filteredIndexUpdates = []
  for (const update of indexUpdates) {
    if (!update || typeof update !== "object") {
      continue
    }
    if (
      !(await indexUpdateAlreadyCovered({
        update,
        directory,
        existingDocs,
      }))
    ) {
      filteredIndexUpdates.push(update)
    }
  }

  return {
    ...analysis,
    should_recommend: filteredRecommendations.length > 0 || filteredIndexUpdates.length > 0,
    recommendations: filteredRecommendations,
    index_updates: filteredIndexUpdates,
  }
}

function buildMarkdown({ timestamp, sessionId, generationId, historyChars, analysis }) {
  const summary = String(analysis?.conversation_summary || "").trim()
  const confidence = String(analysis?.confidence || "unknown").trim()
  const recommendations = Array.isArray(analysis?.recommendations) ? analysis.recommendations : []
  const indexUpdates = Array.isArray(analysis?.index_updates) ? analysis.index_updates : []

  const lines = [
    "# KB Enrichment Recommendation",
    "",
    `- Generated: \`${timestamp}\``,
    "- Source hook: `opencode plugin experimental.session.compacting`",
    "- Analyzer: `opencode structured output`",
    "- Scope: `history window pending compaction (since previous compaction, or full history for first compaction)`",
    `- Session: \`${sessionId}\``,
    `- Generation: \`${generationId}\``,
    `- History size: \`${historyChars}\` chars`,
    `- Confidence: \`${confidence}\``,
  ]

  if (summary) {
    lines.push("")
    lines.push("## Conversation Summary")
    lines.push("")
    lines.push(summary)
  }

  lines.push("")
  lines.push("## Recommendations")
  for (const recommendation of recommendations) {
    if (!recommendation || typeof recommendation !== "object") {
      continue
    }
    const action = String(recommendation.action || "update_existing").trim()
    const targetPath = String(recommendation.target_path || "").trim()
    const reason = String(recommendation.reason || "").trim()
    const suggested = String(recommendation.suggested_content || "").trim()
    const linked = Array.isArray(recommendation.link_commands) ? recommendation.link_commands : []

    lines.push(`- **${action}** \`${targetPath}\``)
    if (reason) {
      lines.push(`  - Reason: ${reason}`)
    }
    if (suggested) {
      lines.push(`  - Suggested content: ${suggested}`)
    }
    if (linked.length > 0) {
      lines.push("  - Link command docs:")
      for (const link of linked) {
        if (typeof link === "string" && link.trim()) {
          lines.push(`    - \`${link.trim()}\``)
        }
      }
    }
  }

  lines.push("")
  lines.push("## Index Updates")
  for (const update of indexUpdates) {
    if (!update || typeof update !== "object") {
      continue
    }
    const indexPath = String(update.index_path || "~/ai-kb/rules/INDEX.md").trim()
    const entry = String(update.entry || "").trim()
    const reason = String(update.reason || "").trim()
    lines.push(`- \`${indexPath}\``)
    if (entry) {
      lines.push(`  - Entry: ${entry}`)
    }
    if (reason) {
      lines.push(`  - Reason: ${reason}`)
    }
  }

  lines.push("")
  lines.push("## Next Action")
  lines.push("")
  lines.push("- Apply validated KB updates, then maintain `~/ai-kb/rules/INDEX.md` and command references.")
  return `${lines.join("\n")}\n`
}

async function analyzeCompactionWindow({ directory, client, input, output }) {
  if (analyzerBusy) {
    return
  }

  const payload = { input, output }
  const rawSessionId =
    findIdByKeyPattern(payload, /session[_\-.]?id/i) ||
    findIdByKeyPattern(payload, /conversation[_\-.]?id/i) ||
    "session"

  if (internalSessionIds.has(rawSessionId)) {
    return
  }
  if (activeSessionAnalyses.has(rawSessionId)) {
    return
  }

  const rawHistory = normalizeHistory(collectStrings(payload).join("\n"))
  if (rawHistory.length < MIN_HISTORY_CHARS) {
    return
  }
  const windowText = sliceSinceLastCompaction(rawHistory)
  if (windowText.length < MIN_HISTORY_CHARS) {
    return
  }

  activeSessionAnalyses.add(rawSessionId)
  analyzerBusy = true
  try {
    const analysis = await runStructuredAnalysis(client, windowText)
    if (!analysis || !analysis.should_recommend || !Array.isArray(analysis.recommendations)) {
      return
    }

    const outDir = await resolveRecommendationDir(directory)
    const filtered = await filterNovelAnalysis({
      analysis,
      directory,
      outDir,
    })
    if (!filtered.should_recommend) {
      return
    }

    const now = new Date()
    const iso = now.toISOString()
    const stamp = iso.replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")
    const sessionId = slug(rawSessionId, "session")
    const rawGenerationId = findIdByKeyPattern(payload, /generation[_\-.]?id/i) || "generation"
    const generationId = slug(rawGenerationId, "generation")
    const outFile = join(outDir, `${stamp}-${sessionId}-${generationId}.md`)
    const body = buildMarkdown({
      timestamp: iso,
      sessionId,
      generationId,
      historyChars: windowText.length,
      analysis: filtered,
    })

    await mkdir(outDir, { recursive: true })
    await writeFile(outFile, body, "utf8")
  } catch (_error) {
    // Fail-open: analysis issues should never impact the interactive workflow.
  } finally {
    analyzerBusy = false
    activeSessionAnalyses.delete(rawSessionId)
  }
}

export const KbPostTurnAnalyzer = async ({ directory, client }) => {
  return {
    "experimental.session.compacting": async (input, output) => {
      await analyzeCompactionWindow({ directory, client, input, output })
    },
  }
}
