import { appendFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { homedir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import {
  getMessageText,
  isRuntimeStateQuestion,
  loadRuntimeGrounding,
  normalizeRuntimeStateAnswer,
  renderRuntimeGroundingMessage,
} from "./lib/runtime-grounding.js"

const HOME_CONFIG_PATH = join(homedir(), ".config", "opencode", "runtime", "autonomy-runtime.jsonc")
const SESSION_STATE = new Map()
const WRITE_TOOLS = new Set(["edit", "write", "patch"])
const VALIDATION_TOOL_PREFIXES = ["playwright_", "mobile_", "mobile-xray_", "puppeteer_"]
const BASH_MUTATION_PATTERN = /(\b(?:npm|pnpm|yarn|bun)\s+install\b|\b(?:cargo|swift|go)fmt\b|\b(?:prettier|swiftformat)\b|\b(?:eslint|biome)\b.*\s--fix\b|\b(?:mv|cp|rm|touch|mkdir|tee|chmod|chown|patch)\b|(^|\s)>(>|)?\s*\S+)/i
const NON_TRIVIAL_REQUEST_PATTERN = /\b(implement|fix|refactor|analy[sz]e|audit|review|design|plan|end-to-end|deeply|observability|lineage|delegation|subagent|runtime|tests?)\b/i
const COMPLEXITY_HINT_PATTERN = /\b(whole|full|entire|multi|multiple|parallel|background|complex|system|tooling|plugin|workflow|end-to-end)\b/i
const DELEGATION_GATED_TOOLS = new Set(["bash", "edit", "write", "patch", "grep", "glob", "read"])
const ROOT_MUTATION_TOOLS = new Set(["bash", "edit", "write", "patch"])
const ROOT_ANALYSIS_TOOLS = new Set(["read", "grep", "glob"])
const MERGE_BUDGET_PER_TASK = 0
const CK_TOOL_PATTERN = /(^|[._-])ck($|[._-])/i
const AI_KB_PATH_PATTERN = /(^|\/)(?:ai-kb|\.config\/opencode\/ai-kb)(\/|$)/i
const ACTIVE_TASK_WINDOW_MS = 300000
const TASK_SUBAGENT_TYPES = [
  "codebase-locator",
  "codebase-analyzer",
  "code-implementer",
  "code-reviewer",
  "spec-reviewer",
  "codebase-pattern-finder",
  "thoughts-locator",
  "thoughts-analyzer",
  "web-search-researcher",
  "evidence-curator",
  "fallback-analyzer",
  "supervisor",
]
const TASK_SUBAGENT_SET = new Set(TASK_SUBAGENT_TYPES)
const PUBLIC_TASK_SUBAGENT_TYPES = TASK_SUBAGENT_TYPES.filter((name) => !["fallback-analyzer", "supervisor"].includes(name))
const PRIMARY_RUNTIME_TO_TASK_SUBAGENT = new Map([
  ["explore", "codebase-locator"],
  ["plan", "codebase-analyzer"],
  ["build", "code-implementer"],
  ["summary", "evidence-curator"],
])
const PRIMARY_RUNTIME_FALLBACK_TYPES = new Set(["plan", "compaction", "title"])
const TASK_SUBAGENT_ALIASES = new Map([
  ["implementer", "code-implementer"],
  ["coder", "code-implementer"],
  ["code-implementor", "code-implementer"],
  ["codebase-lator", "codebase-locator"],
  ["codebase-locater", "codebase-locator"],
  ["code-locator", "codebase-locator"],
  ["codelocator", "codebase-locator"],
  ["thought-locator", "thoughts-locator"],
  ["thought-locater", "thoughts-locator"],
  ["thought-analyzer", "thoughts-analyzer"],
  ["code-review", "code-reviewer"],
  ["spec-review", "spec-reviewer"],
  ["pattern-finder", "codebase-pattern-finder"],
  ["web-researcher", "web-search-researcher"],
  ["web-searcher", "web-search-researcher"],
])
const WORKSPACE_INVALIDATION_IGNORES = new Set([
  ".git",
  ".gradle",
  ".idea",
  ".opencode",
  "node_modules",
  "build",
  "dist",
  "coverage",
  "logs",
  "artifacts",
  "DerivedData",
  "Pods",
])

function nowIso() {
  return new Date().toISOString()
}

function expandHome(filePath) {
  if (!filePath) {
    return filePath
  }
  return filePath.startsWith("~/") ? join(homedir(), filePath.slice(2)) : filePath
}

function resolveRuntimePath(directory, filePath) {
  const expanded = expandHome(filePath)
  if (!expanded) {
    return expanded
  }
  return String(expanded).startsWith("/") ? expanded : resolve(directory, expanded)
}

function stripJsonComments(input) {
  return String(input || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

async function readJsonc(filePath) {
  const raw = await readFile(filePath, "utf8")
  return JSON.parse(stripJsonComments(raw))
}

function runtimeConfigCandidates(directory) {
  return [resolve(directory, ".opencode", "runtime", "autonomy-runtime.jsonc"), HOME_CONFIG_PATH]
}

async function exists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch (_error) {
    return false
  }
}

function shouldIgnoreWorkspaceEntry(relativePath, entry) {
  const name = String(entry?.name || "")
  if (!name) {
    return true
  }
  if (entry?.isDirectory?.() && WORKSPACE_INVALIDATION_IGNORES.has(name)) {
    return true
  }
  if (/\.log$/i.test(name)) {
    return true
  }
  if (relativePath.startsWith(".opencode/")) {
    return true
  }
  return false
}

async function latestWorkspaceMtimeMs(directory, maxDepth = 4, budget = { remaining: 5000 }, relativePath = "") {
  if (budget.remaining <= 0 || maxDepth < 0) {
    return 0
  }

  let newest = 0
  let entries = []
  try {
    entries = await readdir(relativePath ? join(directory, relativePath) : directory, { withFileTypes: true })
  } catch (_error) {
    return 0
  }

  for (const entry of entries) {
    if (budget.remaining <= 0) {
      break
    }

    const nextRelativePath = relativePath ? join(relativePath, entry.name) : entry.name
    if (shouldIgnoreWorkspaceEntry(nextRelativePath.replace(/\\/g, "/"), entry)) {
      continue
    }

    budget.remaining -= 1
    const fullPath = join(directory, nextRelativePath)
    try {
      const info = await stat(fullPath)
      newest = Math.max(newest, info.mtimeMs)
      if (entry.isDirectory() && maxDepth > 0) {
        newest = Math.max(newest, await latestWorkspaceMtimeMs(directory, maxDepth - 1, budget, nextRelativePath))
      }
    } catch (_error) {
      // Ignore unreadable paths.
    }
  }

  return newest
}

async function invalidateGatesOnExternalWorkspaceChanges({ directory, persisted }) {
  const checkpointTime = Date.parse(String(persisted?.lastUpdatedAt || ""))
  if (!Number.isFinite(checkpointTime)) {
    return persisted
  }

  const newestWorkspaceMtime = await latestWorkspaceMtimeMs(directory)
  if (newestWorkspaceMtime <= checkpointTime) {
    return persisted
  }

  return {
    ...persisted,
    changed: true,
    gates: { tests: false, build: false, docs: false },
  }
}

function slug(value, fallback = "item") {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback
}

function normalizeTaskSubagentSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function levenshteinDistance(left, right) {
  const a = String(left || "")
  const b = String(right || "")
  if (!a) {
    return b.length
  }
  if (!b) {
    return a.length
  }

  const previous = Array.from({ length: b.length + 1 }, (_value, index) => index)
  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0]
    previous[0] = row
    for (let column = 1; column <= b.length; column += 1) {
      const nextDiagonal = previous[column]
      const substitution = diagonal + (a[row - 1] === b[column - 1] ? 0 : 1)
      const insertion = previous[column] + 1
      const deletion = previous[column - 1] + 1
      previous[column] = Math.min(substitution, insertion, deletion)
      diagonal = nextDiagonal
    }
  }
  return previous[b.length]
}

function inferTaskSubagentFromIntent(promptText, descriptionText) {
  const text = `${descriptionText || ""} ${promptText || ""}`.toLowerCase()
  if (/\b(locat|find|discover|search|map|list|inventory)\b/.test(text)) {
    return /\bthought\b/.test(text) ? "thoughts-locator" : "codebase-locator"
  }
  if (/\b(pattern|example|similar|template|reference)\b/.test(text)) {
    return "codebase-pattern-finder"
  }
  if (/\b(implement|implementation|fix|refactor|rewrite|code change|patch|edit code|modify code|add feature|write test|update test)\b/.test(text)) {
    return "code-implementer"
  }
  if (/\b(spec|requirement|compliance|contract)\b/.test(text)) {
    return "spec-reviewer"
  }
  if (/\b(review|audit|maintainability|reliability|quality)\b/.test(text)) {
    return "code-reviewer"
  }
  if (/\b(thought|notes|decision|research doc)\b/.test(text)) {
    return "thoughts-analyzer"
  }
  if (/\b(web|url|website|browser|documentation|external research|search the web)\b/.test(text)) {
    return "web-search-researcher"
  }
  if (/\b(summary|synthes|evidence|merge findings)\b/.test(text)) {
    return "evidence-curator"
  }
  if (/\b(analy[sz]e|trace|inspect|understand|debug|root cause)\b/.test(text)) {
    return "codebase-analyzer"
  }
  return ""
}

function resolveTaskSubagentType(subagentType, promptText, descriptionText) {
  const requested = normalizeTaskSubagentSlug(subagentType)
  if (requested && TASK_SUBAGENT_SET.has(requested)) {
    return { resolved: requested, changed: false, note: "" }
  }

  if (requested && TASK_SUBAGENT_ALIASES.has(requested)) {
    const resolved = TASK_SUBAGENT_ALIASES.get(requested)
    return {
      resolved,
      changed: true,
      note: `corrected invalid task subagent_type \`${subagentType}\` -> \`${resolved}\``,
    }
  }

  if (requested && PRIMARY_RUNTIME_TO_TASK_SUBAGENT.has(requested)) {
    const resolved = PRIMARY_RUNTIME_TO_TASK_SUBAGENT.get(requested)
    return {
      resolved,
      changed: true,
      note: `mapped primary runtime lane \`${subagentType}\` -> task subagent \`${resolved}\``,
    }
  }

  if (requested && PRIMARY_RUNTIME_FALLBACK_TYPES.has(requested)) {
    return {
      resolved: "fallback-analyzer",
      changed: true,
      note: `requested primary runtime lane \`${subagentType}\` is not a valid task subagent; use that lane outside the task tool`,
    }
  }

  const inferred = inferTaskSubagentFromIntent(promptText, descriptionText)
  let bestMatch = null
  for (const candidate of PUBLIC_TASK_SUBAGENT_TYPES) {
    const distance = levenshteinDistance(requested, candidate)
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = { candidate, distance }
    }
  }

  if (requested && bestMatch && bestMatch.distance <= Math.max(2, Math.floor(bestMatch.candidate.length * 0.2))) {
    return {
      resolved: bestMatch.candidate,
      changed: true,
      note: `corrected invalid task subagent_type \`${subagentType}\` -> \`${bestMatch.candidate}\``,
    }
  }

  if (!requested && inferred) {
    return {
      resolved: inferred,
      changed: true,
      note: `missing task subagent_type; inferred \`${inferred}\` from the task objective`,
    }
  }

  if (requested && inferred) {
    return {
      resolved: inferred,
      changed: true,
      note: `invalid task subagent_type \`${subagentType}\`; inferred \`${inferred}\` from the task objective`,
    }
  }

  return {
    resolved: "fallback-analyzer",
    changed: true,
    note: `invalid task subagent_type \`${subagentType || "(missing)"}\`; valid task subagents are ${PUBLIC_TASK_SUBAGENT_TYPES.join(", ")}`,
  }
}

function normalizeTaskToolArgs(args) {
  if (!args || typeof args !== "object") {
    return args
  }
  const resolution = resolveTaskSubagentType(args.subagent_type, args.prompt, args.description)
  if (!resolution.changed) {
    return args
  }

  const normalizedArgs = Object.assign({}, args, {
    subagent_type: resolution.resolved,
  })
  const note = resolution.resolved === "fallback-analyzer"
    ? `TASK SUBAGENT NORMALIZATION: ${resolution.note}. Recommend the best valid task subagent for the original objective before doing anything else.`
    : `TASK SUBAGENT NORMALIZATION: ${resolution.note}. Continue with the original objective using \`${resolution.resolved}\`.`
  normalizedArgs.prompt = normalizedArgs.prompt ? `${note}\n\n${normalizedArgs.prompt}` : note
  if (normalizedArgs.description) {
    normalizedArgs.description = `[normalized] ${normalizedArgs.description}`
  }
  return normalizedArgs
}

function workspaceId(directory) {
  return createHash("sha1").update(String(directory || "unknown")).digest("hex").slice(0, 12)
}

function redactPreview(value, maxChars) {
  const normalized = String(value || "")
    .replace(/\b(?:sk|rk|pplx)-[A-Za-z0-9._-]+\b/g, "[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/\b[A-Z0-9_]*(?:API_KEY|TOKEN|PASSWORD|SECRET)[A-Z0-9_]*\b\s*=\s*[^\s,;]+/g, (match) => `${match.split("=")[0]}=[REDACTED]`)
    .replace(/(["']?(?:api[_-]?key|token|password|secret)["']?\s*:\s*["'])[^"']+(["'])/gi, "$1[REDACTED]$2")
    .replace(/\b(?:api[_-]?key|token|password|secret)\b\s*[:=]\s*[^\s,;]+/gi, (match) => `${match.split(/[:=]/)[0]}=[REDACTED]`)
    .replace(/\b[A-Z0-9]{20,}\b/g, "[REDACTED]")
    .replace(/\s+/g, " ")
    .trim()
  return normalized.slice(0, maxChars)
}

function bashLikelyMutatesWorkspace(commandText) {
  return BASH_MUTATION_PATTERN.test(String(commandText || ""))
}

async function loadRuntimeConfig(directory) {
  for (const candidate of runtimeConfigCandidates(directory)) {
    if (await exists(candidate)) {
      return readJsonc(candidate)
    }
  }
  return readJsonc(HOME_CONFIG_PATH)
}

function safeSerialize(value) {
  try {
    return JSON.stringify(value || {})
  } catch (_error) {
    return '"[unserializable]"'
  }
}

function toPositiveNumber(value, fallback) {
  const normalized = Number(value)
  return Number.isFinite(normalized) && normalized > 0 ? normalized : fallback
}

function getSessionStateConfig(config) {
  return {
    maxEntries: toPositiveNumber(config?.sessionState?.maxEntries, 200),
    ttlMs: toPositiveNumber(config?.sessionState?.ttlMs, 1000 * 60 * 60 * 12),
  }
}

function pruneSessionState(config, protectedSessionID = "") {
  const { maxEntries, ttlMs } = getSessionStateConfig(config)
  const now = Date.now()

  for (const [sessionID, state] of SESSION_STATE.entries()) {
    const lastTouchedAt = Date.parse(state?.lastTouchedAt || state?.lastUpdatedAt || state?.createdAt || "")
    if (sessionID === protectedSessionID) {
      continue
    }
    if (Number.isFinite(lastTouchedAt) && now - lastTouchedAt > ttlMs) {
      SESSION_STATE.delete(sessionID)
    }
  }

  if (SESSION_STATE.size <= maxEntries) {
    return
  }

  const ranked = [...SESSION_STATE.entries()]
    .filter(([sessionID]) => sessionID !== protectedSessionID)
    .sort((left, right) => {
      const leftTouched = Date.parse(left[1]?.lastTouchedAt || left[1]?.lastUpdatedAt || left[1]?.createdAt || "") || 0
      const rightTouched = Date.parse(right[1]?.lastTouchedAt || right[1]?.lastUpdatedAt || right[1]?.createdAt || "") || 0
      return leftTouched - rightTouched
    })

  while (SESSION_STATE.size > maxEntries && ranked.length > 0) {
    const [sessionID] = ranked.shift()
    SESSION_STATE.delete(sessionID)
  }
}

async function readOptionalFile(filePath, maxChars) {
  try {
    const content = (await readFile(filePath, "utf8")).trim()
    if (!content) {
      return ""
    }
    return content.slice(0, maxChars)
  } catch (_error) {
    return ""
  }
}

async function loadMemory(directory, config) {
  const maxChars = Number(config?.memory?.maxChars || 64000)
  const slots = []
  const pushIfPresent = async (label, filePath) => {
    const content = await readOptionalFile(filePath, maxChars)
    if (content) {
      slots.push({ label, filePath, content })
    }
  }

  for (const filePath of config?.memory?.projectFiles || []) {
    await pushIfPresent("project", resolve(directory, filePath))
  }
  for (const filePath of config?.memory?.globalFiles || []) {
    await pushIfPresent("global", expandHome(filePath))
  }

  let budget = maxChars
  return slots
    .map((item) => {
      if (budget <= 0) {
        return null
      }
      const slice = item.content.slice(0, budget)
      budget -= slice.length
      return { ...item, content: slice }
    })
    .filter(Boolean)
}

async function loadOverlayCatalog(directory, config) {
  const catalogDir = resolveRuntimePath(directory, config?.overlays?.catalogDir)
  if (!catalogDir) {
    return []
  }
  try {
    const entries = await readdir(catalogDir, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonc"))
      .map((entry) => join(catalogDir, entry.name))
      .sort()
    const overlays = []
    for (const filePath of files) {
      overlays.push({ ...(await readJsonc(filePath)), filePath })
    }
    return overlays
  } catch (_error) {
    return []
  }
}

async function matchesOverlay(directory, overlay) {
  if (overlay?.default) {
    return true
  }
  const any = Array.isArray(overlay?.match?.any) ? overlay.match.any : []
  const all = Array.isArray(overlay?.match?.all) ? overlay.match.all : []
  const matchesAny = any.length === 0 ? true : await Promise.all(any.map((item) => exists(resolve(directory, item)))).then((results) => results.some(Boolean))
  const matchesAll = all.length === 0 ? true : await Promise.all(all.map((item) => exists(resolve(directory, item)))).then((results) => results.every(Boolean))
  return matchesAny && matchesAll
}

async function loadProjectOverlayControls(directory, config) {
  for (const relativePath of config?.overlays?.projectControlFiles || []) {
    const fullPath = resolve(directory, relativePath)
    if (await exists(fullPath)) {
      try {
        return {
          controlPath: fullPath,
          exists: true,
          controls: await readJsonc(fullPath),
        }
      } catch (_error) {
        return {
          controlPath: fullPath,
          exists: true,
          controls: {},
        }
      }
    }
  }
  return {
    controlPath: "",
    exists: false,
    controls: {},
  }
}

function normalizeOverlayMode(value, fallback = "exact") {
  const normalized = String(value || "").trim().toLowerCase()
  return normalized === "exact" || normalized === "augment" || normalized === "auto" ? normalized : fallback
}

async function resolveOverlays(directory, config) {
  const catalog = await loadOverlayCatalog(directory, config)
  const byId = new Map(catalog.map((overlay) => [overlay.id, overlay]))
  const projectOverlayControl = await loadProjectOverlayControls(directory, config)
  const projectControls = projectOverlayControl.controls
  const disabled = new Set(Array.isArray(projectControls?.disable) ? projectControls.disable : [])
  const enabled = Array.isArray(projectControls?.enable) ? projectControls.enable : []
  const mode = projectOverlayControl.exists
    ? normalizeOverlayMode(projectControls?.mode, config?.overlays?.projectControlDefaultMode || "exact")
    : "auto"

  const active = []

  const addOverlay = (overlay) => {
    if (!overlay?.id || disabled.has(overlay.id) || active.some((item) => item.id === overlay.id)) {
      return
    }
    active.push(overlay)
  }

  if (mode === "exact") {
    for (const overlayId of enabled) {
      addOverlay(byId.get(overlayId))
    }
  } else {
    for (const overlay of catalog) {
      if (!overlay?.id || disabled.has(overlay.id)) {
        continue
      }
      if ((await matchesOverlay(directory, overlay)) || enabled.includes(overlay.id)) {
        addOverlay(overlay)
      }
    }

    for (const overlayId of enabled) {
      addOverlay(byId.get(overlayId))
    }
  }

  if (!projectOverlayControl.exists) {
    addOverlay(byId.get("default"))
  }

  return {
    active,
    controlPath: projectOverlayControl.controlPath,
    hasProjectControl: projectOverlayControl.exists,
    mode,
  }
}

function renderOverlayControlLine(overlayState) {
  if (!overlayState?.hasProjectControl) {
    return "- Overlay control: auto-match catalog (no project-local .opencode/overlays.jsonc)"
  }
  return `- Overlay control: ${overlayState.mode} via ${overlayState.controlPath}`
}

function renderMemoryPolicy(config) {
  const projectRoot = config?.memory?.projectRoot || ".opencode/memory"
  const projectFiles = Array.isArray(config?.memory?.projectFiles) ? config.memory.projectFiles : []
  if (projectFiles.length === 0) {
    return `- Before answering any question about project-local runtime state, use Read on .opencode/README.md or .opencode/overlays.jsonc when available. If asked for the project-local memory root, answer exactly: ${projectRoot}`
  }
  return `- Before answering any question about project-local runtime state, use Read on .opencode/README.md or .opencode/overlays.jsonc when available. If asked for the project-local memory root, answer exactly: ${projectRoot} (project files: ${projectFiles.join(", ")})`
}

function renderActiveOverlayLines(overlayState) {
  const overlays = Array.isArray(overlayState?.active) ? overlayState.active : []
  if (overlays.length === 0) {
    return ["- Active overlays: none"]
  }

  const lines = [`- Active overlays: ${overlays.map((overlay) => overlay.id).join(", ")}`]
  for (const overlay of overlays) {
    const prioritized = Array.isArray(overlay?.prioritizeMcp) ? overlay.prioritizeMcp.join(", ") : ""
    if (prioritized) {
      lines.push(`- Overlay ${overlay.id} MCP priority: ${prioritized}`)
    }
    for (const instruction of overlay?.instructions || []) {
      lines.push(`- Overlay ${overlay.id}: ${instruction}`)
    }
  }
  return lines
}

function isInternalSession(sessionID) {
  const internalIds = globalThis.__kb_internal_session_ids
  return internalIds instanceof Set && internalIds.has(sessionID)
}

// --- Nesting depth tracking ---
// Max depth 2: root(0) → subagent(1) → sub-subagent(2, hard-blocked).
// Depth 1 can still spawn background tasks (builds, tests, parallel work).
// Depth 2+ is hard-blocked at tool.execute.before — can't use task tool at all.
const MAX_DELEGATION_DEPTH = 2

// Track ROOT sessions explicitly. Any session NOT in this set is a subagent.
const ROOT_SESSIONS = globalThis.__root_session_ids || new Set()
globalThis.__root_session_ids = ROOT_SESSIONS

// Track direct children of root (depth 1) — they may delegate once more.
const DEPTH_ONE_SESSIONS = globalThis.__depth_one_session_ids || new Set()
globalThis.__depth_one_session_ids = DEPTH_ONE_SESSIONS

const ACTIVE_TASK_PARENTS = globalThis.__active_task_parent_depths || new Map()
globalThis.__active_task_parent_depths = ACTIVE_TASK_PARENTS

function getSessionDepth(sessionID) {
  if (ROOT_SESSIONS.has(sessionID)) return 0
  if (DEPTH_ONE_SESSIONS.has(sessionID)) return 1
  return 2 // unknown = at hard-block limit until classified
}

function getLatestActiveTaskParent() {
  const now = Date.now()
  let newest = null
  for (const [sessionID, value] of ACTIVE_TASK_PARENTS.entries()) {
    const startedAt = Number(value?.startedAt || 0)
    if (!Number.isFinite(startedAt) || now - startedAt > ACTIVE_TASK_WINDOW_MS) {
      ACTIVE_TASK_PARENTS.delete(sessionID)
      continue
    }
    if (!newest || startedAt > newest.startedAt) {
      newest = { sessionID, depth: Number(value?.depth || 0), startedAt }
    }
  }
  return newest
}

function ensureSessionClassification(sessionID) {
  if (!sessionID || isInternalSession(sessionID)) {
    return MAX_DELEGATION_DEPTH
  }
  if (ROOT_SESSIONS.has(sessionID)) {
    return 0
  }
  if (DEPTH_ONE_SESSIONS.has(sessionID)) {
    return 1
  }

  const activeParent = getLatestActiveTaskParent()
  if (activeParent) {
    const inferredDepth = Math.min(MAX_DELEGATION_DEPTH, activeParent.depth + 1)
    if (inferredDepth === 1) {
      DEPTH_ONE_SESSIONS.add(sessionID)
    }
    return inferredDepth
  }

  ROOT_SESSIONS.add(sessionID)
  return 0
}

function recordChildSession(parentSessionID, childSessionID) {
  if (!childSessionID || childSessionID === parentSessionID) {
    return
  }
  const parentDepth = getSessionDepth(parentSessionID)
  if (parentDepth === 0) {
    DEPTH_ONE_SESSIONS.add(childSessionID)
  }
}

function renderSubagentExecutionLines(sessionID) {
  if (isInternalSession(sessionID)) {
    return [
      "- INTERNAL SESSION: do NOT use the task tool or spawn subagents. Answer directly using only your own knowledge and the provided context.",
    ]
  }

  const depth = getSessionDepth(sessionID)

  // Depth 0 (root): full delegation, complexity-gated
  if (depth === 0) {
    return [
      "- Subagent contract: stay orchestration-first; use the task tool before deep main-thread repo reading or implementation on non-trivial work.",
      "- Delegation is complexity-gated: only use the task tool when a sub-task is genuinely non-trivial (multi-file analysis, cross-cutting search, independent parallel work). For quick lookups, single file reads, or simple greps — just do it directly.",
      "- Task map: codebase-locator/thoughts-locator=locate scope; codebase-analyzer/thoughts-analyzer=analysis/spec; code-implementer=bounded implementation/fixes/tests; code-reviewer/spec-reviewer=review; codebase-pattern-finder=similar implementations; web-search-researcher=external evidence; evidence-curator=synthesis",
      "- Primary runtime lanes like build/plan/summary are not valid task subagent types. Use task with the specialist map above, then return to the appropriate primary lane for shared-state work or synthesis.",
      "- Main-thread limit: orchestrate, merge, and handle shared-state transitions; keep build as a primary lane for edits and validation after task-based discovery",
      "- Parallelism: launch independent lanes in parallel in the same turn; merge after they finish",
      "- Nesting limit: max depth is 2. Your subagents may delegate once more for genuinely parallel work; their children are hard-blocked from further delegation.",
    ]
  }

  // Depth 1: can delegate sparingly for background work (builds, tests, parallel sub-tasks)
  if (depth === 1) {
    return [
      "- You are a subagent. Strongly prefer working directly with read, grep, glob, bash, edit. Only use task tool for genuinely independent parallel sub-tasks (e.g. parallel file analysis, bounded review, evidence synthesis).",
      "- Do NOT re-delegate your own task. Do NOT delegate single file reads, searches, or anything you can do in one tool call.",
      "- Your children are hard-blocked from further delegation — they must work directly.",
    ]
  }

  // Depth 2+ (hard-blocked at tool level too, but reinforce in prompt)
  return [
    "- You are a nested subagent at the depth limit. Do NOT use the task tool — it will be blocked. Work directly using read, grep, glob, edit, bash. Return your results to the caller.",
  ]
}

function createDefaultDelegationState() {
  return {
    expected: false,
    satisfied: false,
    taskCount: 0,
    blockedToolCount: 0,
    firstBlockedTool: "",
    pendingBlockedTool: "",
    pendingReason: "",
    requestKey: "",
    requestSummary: "",
    reason: "",
    cycle: 0,
    mergeBudgetRemaining: 0,
    analysisSinceTask: 0,
    lastTaskSubagent: "",
  }
}

function serializeDelegationState(delegation) {
  return {
    expected: Boolean(delegation?.expected),
    satisfied: Boolean(delegation?.satisfied),
    taskCount: Number(delegation?.taskCount || 0),
    blockedToolCount: Number(delegation?.blockedToolCount || 0),
    firstBlockedTool: String(delegation?.firstBlockedTool || ""),
    requestKey: String(delegation?.requestKey || ""),
    requestSummary: String(delegation?.requestSummary || ""),
    reason: String(delegation?.reason || ""),
    cycle: Number(delegation?.cycle || 0),
    mergeBudgetRemaining: Number(delegation?.mergeBudgetRemaining || 0),
    analysisSinceTask: Number(delegation?.analysisSinceTask || 0),
    lastTaskSubagent: String(delegation?.lastTaskSubagent || ""),
  }
}

function createDefaultRoutingState() {
  return {
    required: false,
    satisfied: false,
    skillLoaded: "",
    messageKey: "",
    reason: "",
  }
}

function serializeRoutingState(routing) {
  return {
    required: Boolean(routing?.required),
    satisfied: Boolean(routing?.satisfied),
    skillLoaded: String(routing?.skillLoaded || ""),
    messageKey: String(routing?.messageKey || ""),
    reason: String(routing?.reason || ""),
  }
}

function createDefaultKbState() {
  return {
    discoveryMode: "",
    lastTool: "",
    fallbackReason: "",
    loadedDocs: [],
  }
}

function serializeKbState(kb) {
  const loadedDocs = Array.isArray(kb?.loadedDocs)
    ? kb.loadedDocs.map((value) => String(value || "")).filter(Boolean).slice(0, 8)
    : []
  return {
    discoveryMode: String(kb?.discoveryMode || ""),
    lastTool: String(kb?.lastTool || ""),
    fallbackReason: String(kb?.fallbackReason || ""),
    loadedDocs,
  }
}

function createDefaultSessionState() {
  const createdAt = nowIso()
  return {
    createdAt,
    changed: false,
    gates: { tests: false, build: false, docs: false },
    questions: 0,
    lastTool: "",
    lastTitle: "",
    lastUpdatedAt: null,
    lastTouchedAt: createdAt,
    runtimeAnswerGuard: null,
    delegation: createDefaultDelegationState(),
    routing: createDefaultRoutingState(),
    kb: createDefaultKbState(),
  }
}

async function loadPersistedSessionState({ sessionID, directory, config }) {
  const candidates = []
  const stateRoot = resolveRuntimePath(directory, config?.checkpoints?.stateDir)
  if (stateRoot) {
    candidates.push({
      filePath: join(stateRoot, "sessions", `${slug(sessionID, "session")}.json`),
      strictSessionMatch: true,
    })
  }
  candidates.push({
    filePath: resolve(directory, config?.checkpoints?.projectStateFile || ".opencode/checkpoints/latest.json"),
    strictSessionMatch: false,
  })

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(await readFile(candidate.filePath, "utf8"))
      if (candidate.strictSessionMatch && parsed?.sessionID && parsed.sessionID !== sessionID) {
        continue
      }
      return await invalidateGatesOnExternalWorkspaceChanges({ directory, persisted: parsed })
    } catch (_error) {
      // Ignore missing or unreadable persisted state.
    }
  }

  return null
}

async function getSessionState({ sessionID, directory, config }) {
  if (!SESSION_STATE.has(sessionID)) {
    const defaults = createDefaultSessionState()
    const persisted = await loadPersistedSessionState({ sessionID, directory, config })
    SESSION_STATE.set(sessionID, {
      ...defaults,
      ...persisted,
      gates: {
        ...defaults.gates,
        ...(persisted?.gates || {}),
      },
      changed: Boolean(persisted?.changed),
      questions: Number(persisted?.questions || 0),
      lastTool: String(persisted?.lastTool || ""),
      lastTitle: String(persisted?.lastTitle || ""),
      lastUpdatedAt: persisted?.lastUpdatedAt || defaults.lastUpdatedAt,
      lastTouchedAt: defaults.lastTouchedAt,
      runtimeAnswerGuard: persisted?.runtimeAnswerGuard || defaults.runtimeAnswerGuard,
      delegation: {
        ...defaults.delegation,
        ...serializeDelegationState(persisted?.delegation),
        pendingBlockedTool: defaults.delegation.pendingBlockedTool,
        pendingReason: defaults.delegation.pendingReason,
      },
      routing: {
        ...defaults.routing,
        ...serializeRoutingState(persisted?.routing),
      },
      kb: {
        ...defaults.kb,
        ...serializeKbState(persisted?.kb),
      },
    })
  }
  const state = SESSION_STATE.get(sessionID)
  state.lastTouchedAt = nowIso()
  return state
}

function createSyntheticGroundingPart(message, text) {
  return {
    id: `runtime-grounding-${Date.now()}`,
    sessionID: message?.info?.sessionID || "session",
    messageID: message?.info?.id || "message",
    type: "text",
    text,
    synthetic: true,
    metadata: { runtimeGrounding: true },
  }
}

function createSyntheticDelegationPart(message, text) {
  return {
    id: `delegation-guidance-${Date.now()}`,
    sessionID: message?.info?.sessionID || "session",
    messageID: message?.info?.id || "message",
    type: "text",
    text,
    synthetic: true,
    metadata: { delegationGuidance: true },
  }
}

function isNonTrivialDelegationRequest(text) {
  const normalized = String(text || "").trim()
  if (!normalized || isRuntimeStateQuestion(normalized)) {
    return false
  }
  if (/^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|continue|go on)$/i.test(normalized)) {
    return false
  }
  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  return wordCount >= 3 || NON_TRIVIAL_REQUEST_PATTERN.test(normalized) || COMPLEXITY_HINT_PATTERN.test(normalized)
}

function resetDelegationStateForRequest(state, requestKey, requestText, expected) {
  state.delegation = {
    ...createDefaultDelegationState(),
    requestKey,
    requestSummary: redactPreview(requestText, 160),
    expected,
    reason: expected ? "non-trivial root request" : "",
  }
}

function resetRoutingStateForRequest(state, messageID, expected) {
  state.routing = {
    ...createDefaultRoutingState(),
    required: expected,
    messageKey: messageID,
    reason: expected ? "non-trivial root request" : "",
  }
}

function resetKbStateForRequest(state) {
  state.kb = createDefaultKbState()
}

function maybePrimeDelegationForUserMessage(state, sessionID, messageID, userText) {
  if (!state || !messageID) {
    return false
  }

  const expected = !isInternalSession(sessionID) && ensureSessionClassification(sessionID) === 0 && isNonTrivialDelegationRequest(userText)
  if (state.delegation.requestKey === messageID) {
    return expected
  }

  resetDelegationStateForRequest(state, messageID, userText, expected)
  resetRoutingStateForRequest(state, messageID, expected)
  resetKbStateForRequest(state)
  return expected
}

function currentDelegationGateReason(state, toolName) {
  const lowerTool = String(toolName || "").toLowerCase()
  if (state?.routing?.required && !state?.routing?.satisfied) {
    return "load `command-parity-router` and establish KB/rule routing before broad main-thread work"
  }
  if (!state?.delegation?.expected) {
    return "non-trivial root work must stay orchestration-first"
  }
  if (Number(state?.delegation?.taskCount || 0) === 0) {
    return "dispatch at least one specialist `task` lane first"
  }
  if ((ROOT_ANALYSIS_TOOLS.has(lowerTool) || ROOT_MUTATION_TOOLS.has(lowerTool)) && Number(state?.delegation?.mergeBudgetRemaining || 0) <= 0) {
    return "the root merge window is exhausted; redelegate unresolved analysis to another specialist `task` lane"
  }
  return "keep the root session in team-lead orchestration mode"
}

function shouldGateMainThreadTool(sessionID, toolName, state) {
  if (isInternalSession(sessionID)) {
    return false
  }
  if (ensureSessionClassification(sessionID) !== 0) {
    return false
  }
  const lowerTool = String(toolName || "").toLowerCase()
  if (!DELEGATION_GATED_TOOLS.has(lowerTool)) {
    return false
  }
  if (state?.routing?.required && !state?.routing?.satisfied) {
    return true
  }
  if (!state?.delegation?.expected) {
    return false
  }
  if (Number(state?.delegation?.taskCount || 0) === 0) {
    return true
  }
  if ((ROOT_ANALYSIS_TOOLS.has(lowerTool) || ROOT_MUTATION_TOOLS.has(lowerTool)) && Number(state?.delegation?.mergeBudgetRemaining || 0) <= 0) {
    return true
  }
  return false
}

function delegationGateMessage(state, toolName) {
  return `Delegation gate: ${currentDelegationGateReason(state, toolName)}. Root session should act as a team lead: load routing, dispatch specialist tasks, merge briefly, then redelegate until the task is done.`
}

function recordDelegationBlock(state, toolName) {
  if (!state?.delegation) {
    return
  }
  state.delegation.blockedToolCount += 1
  if (!state.delegation.firstBlockedTool) {
    state.delegation.firstBlockedTool = toolName
  }
  state.delegation.pendingBlockedTool = toolName
  state.delegation.pendingReason = currentDelegationGateReason(state, toolName)
  state.delegation.satisfied = false
}

function isKbPath(value) {
  return AI_KB_PATH_PATTERN.test(String(value || "").replace(/\\/g, "/"))
}

function recordKbLoadedDoc(state, value) {
  const normalized = String(value || "").replace(/\\/g, "/")
  if (!normalized) {
    return
  }
  const next = [...(state?.kb?.loadedDocs || [])]
  if (!next.includes(normalized)) {
    next.push(normalized)
  }
  state.kb.loadedDocs = next.slice(-8)
}

function observeKbActivity(state, toolName, args) {
  if (!state?.kb) {
    return
  }
  const lowerTool = String(toolName || "").toLowerCase()
  if (CK_TOOL_PATTERN.test(lowerTool) || lowerTool.includes("mcp__ck")) {
    state.kb.discoveryMode = "ck"
    state.kb.lastTool = toolName
    return
  }

  const kbSignals = [args?.filePath, args?.path, args?.filename, args?.saveTo]
  const kbPath = kbSignals.find(isKbPath)
  if (!kbPath) {
    return
  }

  if (!state.kb.discoveryMode) {
    state.kb.discoveryMode = "index"
  }
  state.kb.lastTool = toolName
  recordKbLoadedDoc(state, kbPath)
  if (/INDEX\.md$/i.test(String(kbPath || ""))) {
    state.kb.fallbackReason = "INDEX fallback observed; ck not observed in runtime evidence"
  }
}

function markRoutingSkillSatisfied(state, skillName) {
  if (!state?.routing) {
    return
  }
  state.routing.satisfied = true
  state.routing.skillLoaded = skillName
}

function normalizeAutonomyContinuationText(text) {
  let normalized = String(text || "")
  normalized = normalized.replace(/if you want,? send [`'\"]?continue[`'\"]?(?: and i will[^.\n]*)?/gi, "")
  normalized = normalized.replace(/send [`'\"]?continue[`'\"]?(?: and i will[^.\n]*)?/gi, "")
  normalized = normalized.replace(/\b(let me know|tell me) if you want me to continue\b[^\n.]*/gi, "")
  normalized = normalized.replace(/\bshould I continue\??/gi, "")
  normalized = normalized.replace(/\s+\./g, ".")
  normalized = normalized.replace(/\n{3,}/g, "\n\n")
  return normalized.trimEnd()
}

async function resolveDelegationGateReadTarget(directory) {
  const candidates = [
    resolve(directory, ".opencode", "README.md"),
    join(homedir(), ".config", "opencode", "README.md"),
    resolve(directory, "README.md"),
  ]
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate
    }
  }
  return join(homedir(), ".config", "opencode", "AGENTS.md")
}

function classifyBash(commandText) {
  const text = String(commandText || "").toLowerCase()
  return {
    tests: /\b(test|vitest|jest|pytest|cargo test|go test|xcodebuild test|gradlew test)\b/.test(text),
    build: /\b(build|compile|xcodebuild|gradlew assemble|tsc|vite build|next build)\b/.test(text),
    docs: /\b(doc|docs)\b/.test(text),
  }
}

function isDocsPath(value) {
  const normalized = String(value || "").toLowerCase()
  return /(^|\/)(docs?|documentation)(\/|$)|\.mdx?$/.test(normalized)
}

function extractExitCode(metadata) {
  if (typeof metadata?.exitCode === "number") {
    return metadata.exitCode
  }
  if (typeof metadata?.code === "number") {
    return metadata.code
  }
  if (typeof metadata?.rc === "number") {
    return metadata.rc
  }
  return null
}

function toolResultSucceeded({ toolName, metadata, outputText }) {
  if (metadata && typeof metadata?.success === "boolean") {
    return metadata.success
  }

  const exitCode = extractExitCode(metadata)
  if (typeof exitCode === "number") {
    return exitCode === 0
  }

  const lowerTool = String(toolName || "").toLowerCase()
  if (lowerTool !== "bash") {
    return true
  }

  const text = String(outputText || "")
  if (!text.trim()) {
    return true
  }
  if (/\b\d+\s+failed\b/i.test(text)) {
    return false
  }
  if (/^\s*failure\s*$/i.test(text)) {
    return false
  }
  if (/(^|\n)(zsh:|sh:|bash:|npm ERR!|error:|traceback|exception\b|build failed|not enough arguments|\bfail(?:ed|ure)?\b)/i.test(text)) {
    return false
  }
  if (/\b(build successful|passed|success)\b/i.test(text)) {
    return true
  }
  return true
}

function classifyToolEvent({ toolName, title, args, outputText, metadata }) {
  const lowerTool = String(toolName || "").toLowerCase()
  const bashText = lowerTool === "bash" ? String(args?.command || "") : ""
  const combined = `${title || ""}\n${safeSerialize(args)}\n${outputText || ""}`
  const bashGateUpdate = classifyBash(bashText)
  const succeeded = toolResultSucceeded({ toolName, metadata, outputText })
  const gateUpdate = {
    tests: succeeded && lowerTool === "bash" ? bashGateUpdate.tests : false,
    build: succeeded && lowerTool === "bash" ? bashGateUpdate.build : false,
    docs: succeeded && lowerTool === "bash" ? bashGateUpdate.docs : false,
  }
  const docsSignals = [args?.filePath, args?.path, args?.saveTo, args?.filename]

  if (succeeded && WRITE_TOOLS.has(lowerTool) && docsSignals.some(isDocsPath)) {
    gateUpdate.docs = true
  }

  if (
    succeeded &&
    VALIDATION_TOOL_PREFIXES.some((prefix) => lowerTool.startsWith(prefix)) &&
    /\b(validate|validation|verify|verified|evidence|screenshot|snapshot|smoke|assert|runtime)\b/i.test(combined)
  ) {
    gateUpdate.tests = true
  }

  return gateUpdate
}

async function swallowPluginErrors(work) {
  try {
    await work()
  } catch (_error) {
    // Fail-open by contract: plugin issues must not interrupt a normal session.
  }
}

async function persistCheckpoint({ directory, sessionID, config, state }) {
  const stateRoot = resolveRuntimePath(directory, config?.checkpoints?.stateDir)
  const workspace = slug(directory.split("/").filter(Boolean).pop(), "workspace")
  const payload = {
    sessionID,
    workspace,
    workspaceId: workspaceId(directory),
    depth: getSessionDepth(sessionID),
    changed: state.changed,
    gates: state.gates,
    questions: state.questions,
    lastTool: state.lastTool,
    lastTitle: state.lastTitle,
    lastUpdatedAt: state.lastUpdatedAt,
    delegation: serializeDelegationState(state.delegation),
    routing: serializeRoutingState(state.routing),
    kb: serializeKbState(state.kb),
  }

  if (stateRoot) {
    const target = join(stateRoot, "sessions", `${slug(sessionID, "session")}.json`)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  }

  const projectRoot = resolve(directory, ".opencode")
  if (await exists(projectRoot)) {
    const target = resolve(directory, config?.checkpoints?.projectStateFile || ".opencode/checkpoints/latest.json")
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8")
  }
}

async function appendTrace({ directory, sessionID, config, record }) {
  const traceRoot = resolveRuntimePath(directory, config?.traces?.dir)
  if (!traceRoot) {
    return
  }
  const day = new Date().toISOString().slice(0, 10)
  const workspace = slug(directory.split("/").filter(Boolean).pop(), "workspace")
  const target = join(traceRoot, day, `${workspace}-${workspaceId(directory)}.jsonl`)
  await mkdir(dirname(target), { recursive: true })
  await appendFile(target, `${JSON.stringify({ sessionID, workspace, ...record })}\n`, "utf8")
}

function renderRuntimeContext({ config, memory, overlayState, state, sessionID }) {
  const lines = [
    "System override: when asked about project-local runtime state paths, answer with `.opencode/...` paths only, and consult `.opencode/README.md` or `.opencode/overlays.jsonc` first when available.",
    "<runtime_context>",
    `- Mode: ${config?.routing?.defaultMode || "autonomy-first"}`,
    `- Supervisor path: ${(config?.routing?.supervisorWhen || []).join("; ")}`,
    `- Question escalation: ${config?.routing?.questionEscalation || "single targeted question only"}`,
    renderMemoryPolicy(config),
    renderOverlayControlLine(overlayState),
  ]

  lines.push(...renderActiveOverlayLines(overlayState))
  lines.push(...renderSubagentExecutionLines(sessionID))

  if (memory.length > 0) {
    for (const item of memory) {
      lines.push(`- Memory ${item.label} ${item.filePath}: ${redactPreview(item.content, 220)}`)
    }
  }

  if (state.changed) {
    const pending = Object.entries(state.gates)
      .filter(([, satisfied]) => !satisfied)
      .map(([gate]) => gate)
    lines.push(`- Checkpoint: code changed; pending gates = ${pending.join(", ") || "none"}`)
  } else {
    lines.push("- Checkpoint: no pending change gates recorded yet")
  }

  lines.push(`- Evidence: local traces in ${config?.traces?.dir || "~/.config/opencode/traces"}`)
  lines.push("</runtime_context>")
  return lines.join("\n")
}

function renderCompactionContext({ config, memory, overlayState, state, sessionID }) {
  const lines = ["Preserve this runtime context during compaction:"]
  lines.push(renderMemoryPolicy(config))
  lines.push(renderOverlayControlLine(overlayState))
  lines.push(...renderActiveOverlayLines(overlayState))
  lines.push(...renderSubagentExecutionLines(sessionID))
  if (memory.length > 0) {
    lines.push(`- Memory sources: ${memory.map((item) => item.filePath).join(", ")}`)
  }
  if (state.changed) {
    const pending = Object.entries(state.gates)
      .filter(([, satisfied]) => !satisfied)
      .map(([gate]) => gate)
    lines.push(`- Pending gates after code changes: ${pending.join(", ") || "none"}`)
  }
  if (state.questions > 0) {
    lines.push(`- Question escalations used: ${state.questions}`)
  }
  return lines.join("\n")
}

export const AutonomyRuntimePlugin = async ({ directory }) => {
  return {
    "experimental.chat.system.transform": async (input, output) => {
      await swallowPluginErrors(async () => {
        const sessionID = input?.sessionID || "session"
        ensureSessionClassification(sessionID)

        const config = await loadRuntimeConfig(directory)
        pruneSessionState(config, sessionID)
        const memory = await loadMemory(directory, config)
        const overlayState = await resolveOverlays(directory, config)
        const state = await getSessionState({ sessionID, directory, config })
        output.system.push(renderRuntimeContext({ config, memory, overlayState, state, sessionID }))
      })
    },
    "experimental.chat.messages.transform": async (_input, output) => {
      await swallowPluginErrors(async () => {
        const messages = Array.isArray(output?.messages) ? output.messages : []
        const latestUserMessage = [...messages].reverse().find((message) => message?.info?.role === "user")
        if (!latestUserMessage) {
          return
        }

        const sessionID = latestUserMessage?.info?.sessionID || "session"
        ensureSessionClassification(sessionID)
        const config = await loadRuntimeConfig(directory)
        pruneSessionState(config, sessionID)
        const state = await getSessionState({ sessionID, directory, config })
        const userText = getMessageText(latestUserMessage.parts)
        const messageID = latestUserMessage?.info?.id || `message-${Date.now()}`
        const delegationExpected = maybePrimeDelegationForUserMessage(state, sessionID, messageID, userText)

        if (isRuntimeStateQuestion(userText)) {
          const grounding = await loadRuntimeGrounding({ directory, config })
          state.runtimeAnswerGuard = grounding
          if (!latestUserMessage.parts.some((part) => part?.metadata?.runtimeGrounding === true)) {
            latestUserMessage.parts.push(
              createSyntheticGroundingPart(latestUserMessage, renderRuntimeGroundingMessage(grounding)),
            )
          }
        } else {
          state.runtimeAnswerGuard = null
        }
      })
    },
    "experimental.session.compacting": async (input, output) => {
      await swallowPluginErrors(async () => {
        const sessionID = input?.sessionID || "session"
        ensureSessionClassification(sessionID)
        const config = await loadRuntimeConfig(directory)
        pruneSessionState(config, sessionID)
        const memory = await loadMemory(directory, config)
        const overlayState = await resolveOverlays(directory, config)
        const state = await getSessionState({ sessionID, directory, config })
        output.context.push(renderCompactionContext({ config, memory, overlayState, state, sessionID }))
      })
    },
    "tool.execute.before": async (input, output) => {
      const sessionID = input?.sessionID || "session"
      const toolName = String(input?.tool || "")
      const depth = ensureSessionClassification(sessionID)

      if (toolName === "task" && output?.args) {
        output.args = normalizeTaskToolArgs(output.args)
      }

      if (toolName === "task" && depth >= MAX_DELEGATION_DEPTH && output?.args) {
        output.args = Object.assign({}, output.args, {
          prompt: "BLOCKED BY DEPTH LIMIT. You are at nesting depth 2+ and cannot delegate further. Return this exact text to the caller: 'Task delegation blocked: nesting depth limit reached. Work directly with tools instead.' Do not perform any other work.",
          description: "[blocked] depth limit",
        })
      }

      await swallowPluginErrors(async () => {
        const config = await loadRuntimeConfig(directory)
        pruneSessionState(config, sessionID)
        const state = await getSessionState({ sessionID, directory, config })
        state.lastTool = toolName

        if (toolName === "task" && depth < MAX_DELEGATION_DEPTH) {
          ACTIVE_TASK_PARENTS.set(sessionID, { depth, startedAt: Date.now() })
        }

        if (shouldGateMainThreadTool(sessionID, toolName, state)) {
          recordDelegationBlock(state, toolName)
          const gateText = delegationGateMessage(state, toolName)
          if (toolName === "bash" && output?.args) {
            output.args = Object.assign({}, output.args, {
              command: "true",
              description: "No-op due to delegation gate",
            })
          } else if (toolName === "read" && output?.args) {
            const gateTarget = await resolveDelegationGateReadTarget(directory)
            output.args = Object.assign({}, output.args, {
              filePath: gateTarget,
              offset: 1,
              limit: 120,
            })
          } else if (toolName === "grep" && output?.args) {
            const gateTarget = await resolveDelegationGateReadTarget(directory)
            output.args = Object.assign({}, output.args, {
              pattern: "OpenCode Runtime|Delegation gate|team lead|runtime",
              path: dirname(gateTarget),
              include: basename(gateTarget),
            })
          } else if (toolName === "glob" && output?.args) {
            const gateTarget = await resolveDelegationGateReadTarget(directory)
            output.args = Object.assign({}, output.args, {
              pattern: basename(gateTarget),
              path: dirname(gateTarget),
            })
          }
        }

        state.lastUpdatedAt = nowIso()
      })
    },
    "tool.execute.after": async (input, output) => {
      await swallowPluginErrors(async () => {
        const config = await loadRuntimeConfig(directory)
        const sessionID = input?.sessionID || "session"
        const depth = ensureSessionClassification(sessionID)
        pruneSessionState(config, sessionID)
        const state = await getSessionState({ sessionID, directory, config })
        const toolName = String(input?.tool || "")
        const args = input?.args || {}
        const docsSignals = [args?.filePath, args?.path, args?.saveTo, args?.filename]
        const isDocsWrite = WRITE_TOOLS.has(toolName) && docsSignals.some(isDocsPath)
        const isBashMutation = toolName === "bash" && bashLikelyMutatesWorkspace(args?.command)
        const delegationBlocked = state.delegation.pendingBlockedTool === toolName

        observeKbActivity(state, toolName, args)

        if (toolName === "task") {
          ACTIVE_TASK_PARENTS.delete(sessionID)
          state.delegation.taskCount += 1
          state.delegation.cycle += 1
          state.delegation.satisfied = true
          state.delegation.mergeBudgetRemaining = MERGE_BUDGET_PER_TASK
          state.delegation.analysisSinceTask = 0
          state.delegation.lastTaskSubagent = String(args?.subagent_type || "")
          state.delegation.pendingBlockedTool = ""
          state.delegation.pendingReason = ""
        }

        const outputText = typeof output?.output === "string" ? output.output : safeSerialize(output?.output)

        if (toolName === "skill" && String(args?.name || "") === "command-parity-router") {
          markRoutingSkillSatisfied(state, "command-parity-router")
        }

        if (
          depth === 0 &&
          (ROOT_ANALYSIS_TOOLS.has(toolName) || ROOT_MUTATION_TOOLS.has(toolName)) &&
          state.delegation.expected &&
          !delegationBlocked &&
          Number(state.delegation.taskCount || 0) > 0
        ) {
          state.delegation.analysisSinceTask += 1
          if (state.delegation.mergeBudgetRemaining > 0) {
            state.delegation.mergeBudgetRemaining -= 1
          }
          if (state.delegation.mergeBudgetRemaining <= 0) {
            state.delegation.satisfied = false
            state.delegation.pendingReason = currentDelegationGateReason(state, toolName)
          }
        }

        if (WRITE_TOOLS.has(toolName) || isBashMutation) {
          state.changed = true
          state.gates = {
            tests: false,
            build: false,
            docs: isDocsWrite,
          }
        }
        if (toolName === "question") {
          state.questions += 1
        }

        if (toolName === "task") {
          const combined = outputText + " " + safeSerialize(output?.metadata)
          const childMatch = combined.match(/\b(ses_[a-zA-Z0-9]{15,40})\b/)
          if (childMatch && childMatch[1] !== sessionID) {
            recordChildSession(sessionID, childMatch[1])
          }
        }

        const gateUpdate = classifyToolEvent({
          toolName,
          title: output?.title || "",
          args,
          outputText,
          metadata: output?.metadata,
        })
        state.gates.tests = state.gates.tests || gateUpdate.tests
        state.gates.build = state.gates.build || gateUpdate.build
        state.gates.docs = state.gates.docs || gateUpdate.docs

        if (delegationBlocked) {
          state.delegation.pendingBlockedTool = ""
        }

        state.lastTitle = output?.title || ""
        state.lastUpdatedAt = nowIso()
        state.lastTouchedAt = state.lastUpdatedAt

        await Promise.allSettled([
          persistCheckpoint({ directory, sessionID, config, state }),
          appendTrace({
            directory,
            sessionID,
            config,
            record: {
              at: state.lastUpdatedAt,
              tool: toolName,
              title: output?.title || "",
              depth: getSessionDepth(sessionID),
              changed: state.changed,
              gates: state.gates,
              routingRequired: state.routing.required,
              routingSatisfied: state.routing.satisfied,
              routingSkillLoaded: state.routing.skillLoaded,
              kbDiscoveryMode: state.kb.discoveryMode,
              kbLoadedDocs: state.kb.loadedDocs,
              kbFallbackReason: state.kb.fallbackReason,
              delegationExpected: state.delegation.expected,
              delegationSatisfied: state.delegation.satisfied,
              delegationBlocked,
              delegationTaskCount: state.delegation.taskCount,
              delegationCycle: state.delegation.cycle,
              mergeBudgetRemaining: state.delegation.mergeBudgetRemaining,
              firstBlockedTool: state.delegation.firstBlockedTool,
              success: toolResultSucceeded({ toolName, metadata: output?.metadata, outputText }),
              exitCode: extractExitCode(output?.metadata),
              preview: redactPreview(outputText, Number(config?.traces?.previewChars || 240)),
            },
          }),
        ])
      })
    },
    "experimental.text.complete": async (input, output) => {
      await swallowPluginErrors(async () => {
        const config = await loadRuntimeConfig(directory)
        const sessionID = input?.sessionID || "session"
        const state = await getSessionState({ sessionID, directory, config })
        const currentText = String(output?.text || "")
        output.text = normalizeAutonomyContinuationText(output.text)
        if (!state.runtimeAnswerGuard) {
          return
        }
        output.text = normalizeRuntimeStateAnswer(output.text, state.runtimeAnswerGuard)
      })
    },
  }
}
