import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const runtimeRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const tracesRoot = join(runtimeRoot, "traces")
const evalRoot = join(runtimeRoot, "evals")
const runtimeConfigPath = join(runtimeRoot, "runtime", "autonomy-runtime.jsonc")

function stripJsonComments(input) {
  return String(input || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

async function loadDefaultReportPath() {
  try {
    const runtimeConfig = JSON.parse(stripJsonComments(await readFile(runtimeConfigPath, "utf8")))
    const reportName = String(runtimeConfig?.evals?.defaultReport || "").trim()
    return reportName ? join(evalRoot, reportName) : join(evalRoot, "latest-report.md")
  } catch (_error) {
    return join(evalRoot, "latest-report.md")
  }
}

function parseArgs(argv) {
  const args = { output: "" }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === "--output") {
      args.output = argv[index + 1] || ""
      index += 1
    }
  }
  return args
}

async function listJsonlFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        files.push(...(await listJsonlFiles(fullPath)))
      } else if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(fullPath)
      }
    }
    return files.sort()
  } catch (_error) {
    return []
  }
}

async function readTraceRecords(files) {
  const records = []
  for (const filePath of files) {
    const raw = await readFile(filePath, "utf8")
    for (const line of raw.split("\n")) {
      if (!line.trim()) {
        continue
      }
      try {
        records.push(JSON.parse(line))
      } catch (_error) {
        // Ignore malformed lines.
      }
    }
  }
  return records
}

async function newestTraceMtime(files) {
  let newest = 0
  for (const filePath of files) {
    const info = await stat(filePath)
    newest = Math.max(newest, info.mtimeMs)
  }
  return newest > 0 ? new Date(newest).toISOString() : "none"
}

function summarize(records) {
  const byTool = new Map()
  const sessions = new Set()
  let changedCount = 0
  let testsSatisfied = 0
  let buildSatisfied = 0

  for (const record of records) {
    sessions.add(record.sessionID)
    byTool.set(record.tool, (byTool.get(record.tool) || 0) + 1)
    if (record.changed) {
      changedCount += 1
    }
    if (record?.gates?.tests) {
      testsSatisfied += 1
    }
    if (record?.gates?.build) {
      buildSatisfied += 1
    }
  }

  return {
    sessionCount: sessions.size,
    toolCounts: [...byTool.entries()].sort((a, b) => b[1] - a[1]),
    changedCount,
    testsSatisfied,
    buildSatisfied,
  }
}

async function writeReport(body, outputPath) {
  if (!outputPath) {
    await mkdir(evalRoot, { recursive: true })
    outputPath = await loadDefaultReportPath()
  }
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, body, "utf8")
  return outputPath
}

const args = parseArgs(process.argv.slice(2))
const traceFiles = await listJsonlFiles(tracesRoot)
const records = await readTraceRecords(traceFiles)
const summary = summarize(records)

const newestTrace = await newestTraceMtime(traceFiles)
const lines = [
  "# OpenCode Eval Report",
  "",
  `- Trace files: ${traceFiles.length}`,
  `- Sessions seen: ${summary.sessionCount}`,
  `- Records with code changes: ${summary.changedCount}`,
  `- Records with test gate satisfied: ${summary.testsSatisfied}`,
  `- Records with build gate satisfied: ${summary.buildSatisfied}`,
  `- Newest trace mtime: ${newestTrace}`,
  "",
  "## Tool Counts",
]

if (summary.toolCounts.length === 0) {
  lines.push("", "No trace records yet.")
} else {
  for (const [tool, count] of summary.toolCounts) {
    lines.push(`- ${tool}: ${count}`)
  }
}

const outputPath = await writeReport(`${lines.join("\n")}\n`, args.output)
console.log(outputPath)
