import { readFile, stat } from "node:fs/promises"
import { resolve } from "node:path"

const RUNTIME_STATE_QUERY = /\b(project-local|repo-local|runtime state|working memory|memory root|memory path|checkpoint|checkpoints|overlay|overlays|\.opencode|where .*memory|where is .*memory|where .*checkpoint|where .*overlay)\b/i
const README_BULLET = /^-\s+`([^`]+)`\s+-\s+(.+)$/

async function pathExists(filePath) {
  try {
    await stat(filePath)
    return true
  } catch (_error) {
    return false
  }
}

async function readOptionalFile(filePath, maxChars = 16000) {
  try {
    const content = await readFile(filePath, "utf8")
    return content.slice(0, maxChars)
  } catch (_error) {
    return ""
  }
}

function normalizePath(filePath, fallback) {
  const value = String(filePath || "").trim()
  return value || fallback
}

function extractRuntimeFacts(readmeText) {
  const facts = []
  for (const line of String(readmeText || "").split("\n")) {
    const match = line.trim().match(README_BULLET)
    if (!match) {
      continue
    }
    facts.push(`${match[1]} - ${match[2]}`)
    if (facts.length >= 4) {
      break
    }
  }
  return facts
}

export function getMessageText(parts) {
  return (Array.isArray(parts) ? parts : [])
    .filter((part) => part?.type === "text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim()
}

export function isRuntimeStateQuestion(text) {
  return RUNTIME_STATE_QUERY.test(String(text || ""))
}

export async function loadRuntimeGrounding({ directory, config }) {
  const memoryRoot = normalizePath(config?.memory?.projectRoot, ".opencode/memory")
  const checkpointPath = normalizePath(config?.checkpoints?.projectStateFile, ".opencode/checkpoints/latest.json")
  const overlayControlPath = normalizePath(config?.overlays?.projectControlFiles?.[0], ".opencode/overlays.jsonc")
  const readmePath = resolve(directory, ".opencode/README.md")
  const overlayPath = resolve(directory, overlayControlPath)
  const checkpointFilePath = resolve(directory, checkpointPath)
  const memoryDirPath = resolve(directory, memoryRoot)
  const readmeText = await readOptionalFile(readmePath)
  const readmeFacts = extractRuntimeFacts(readmeText)

  const verifiedFiles = []
  if (await pathExists(readmePath)) {
    verifiedFiles.push(".opencode/README.md")
  }
  if (await pathExists(overlayPath)) {
    verifiedFiles.push(overlayControlPath)
  }
  if (await pathExists(memoryDirPath)) {
    verifiedFiles.push(memoryRoot)
  }
  if (await pathExists(checkpointFilePath)) {
    verifiedFiles.push(checkpointPath)
  }

  return {
    memoryRoot,
    checkpointPath,
    overlayControlPath,
    verifiedFiles,
    readmeFacts,
  }
}

export function renderRuntimeGroundingMessage(grounding) {
  const lines = ["Runtime-state grounding for this repo:"]
  if (grounding?.memoryRoot) {
    lines.push(`- exact project-local memory root: ${grounding.memoryRoot}`)
  }
  if (grounding?.overlayControl) {
    lines.push(`- exact project-local overlay control file: ${grounding.overlayControl}`)
  }
  if (grounding?.checkpointFile) {
    lines.push(`- exact project-local checkpoint file: ${grounding.checkpointFile}`)
  }
  lines.push("Answer runtime-state questions from these exact `.opencode/` paths only. Do not mention `.Claude` unless a verified repo-local file does.")
  return lines.join("\n")
}

export function normalizeRuntimeStateAnswer(text, grounding) {
  const value = String(text || "")
  if (!value) {
    return value
  }

  return value
    .replace(/\.claude\/memory\b/gi, grounding.memoryRoot)
    .replace(/\.claude\/overlays\.jsonc\b/gi, grounding.overlayControlPath)
    .replace(/\.claude\/checkpoints\/latest\.json\b/gi, grounding.checkpointPath)
}
