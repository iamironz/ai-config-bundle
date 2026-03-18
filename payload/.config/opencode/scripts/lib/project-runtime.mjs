import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import { constants } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const modulePath = fileURLToPath(import.meta.url)
export const configRoot = resolve(dirname(modulePath), "..", "..")
export const projectTemplateRoot = join(configRoot, "memory", "templates", "project")
export const projectStateTemplateRoot = join(projectTemplateRoot, ".opencode")
export const bridgeTemplatePath = join(projectTemplateRoot, "opencode.bridge.template.jsonc")
export const checkpointIgnore = ".opencode/checkpoints/"
export const watcherIgnore = ".opencode/checkpoints/**"

const frontendSignals = new Set([
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "design-sample",
  "frontend",
  "web",
  "pages",
  "public",
])

const mobileSignals = new Set([
  "android",
  "androidApp",
  "ios",
  "iosApp",
  "composeApp",
  "build.gradle",
  "build.gradle.kts",
  "Podfile",
  "Package.swift",
])

function hasNamedSignal(names, signalSet) {
  for (const name of names) {
    if (signalSet.has(name)) {
      return true
    }
  }
  return false
}

function hasPatternSignal(names, patterns) {
  for (const name of names) {
    for (const pattern of patterns) {
      if (pattern.test(name)) {
        return true
      }
    }
  }
  return false
}

export function stripJsonComments(input) {
  return String(input || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

export async function pathExists(filePath) {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch (_error) {
    return false
  }
}

export async function readJsonc(filePath) {
  return JSON.parse(stripJsonComments(await readFile(filePath, "utf8")))
}

export function formatJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function parseArgs(argv) {
  const args = {
    repo: process.cwd(),
    dryRun: false,
    bridgeConfig: false,
    patchConfig: false,
    refreshOverlays: false,
    overlays: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === "--repo") {
      args.repo = argv[index + 1] || args.repo
      index += 1
    } else if (token === "--dry-run") {
      args.dryRun = true
    } else if (token === "--bridge-config") {
      args.bridgeConfig = true
    } else if (token === "--patch-config") {
      args.patchConfig = true
    } else if (token === "--refresh-overlays") {
      args.refreshOverlays = true
    } else if (token === "--overlay") {
      const value = argv[index + 1] || ""
      if (value) {
        args.overlays.push(value)
      }
      index += 1
    }
  }

  return args
}

export async function ensureDirectory(directory) {
  await mkdir(directory, { recursive: true })
}

export async function writeFileIfChanged(filePath, contents, dryRun) {
  const existing = (await pathExists(filePath)) ? await readFile(filePath, "utf8") : ""
  if (existing === contents) {
    return false
  }
  if (!dryRun) {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, contents, "utf8")
  }
  return true
}

export async function copyTemplateIfMissing(templatePath, targetPath, dryRun) {
  if (await pathExists(targetPath)) {
    return false
  }
  const contents = await readFile(templatePath, "utf8")
  if (!dryRun) {
    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(targetPath, contents, "utf8")
  }
  return true
}

export async function assertRepo(directory) {
  const info = await stat(directory)
  if (!info.isDirectory()) {
    throw new Error(`not a directory: ${directory}`)
  }
}

async function scanSignals(directory, depth, found) {
  if (depth < 0) {
    return
  }
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    found.add(entry.name)
    if (entry.isDirectory() && depth > 0 && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "build" && entry.name !== "dist") {
      await scanSignals(join(directory, entry.name), depth - 1, found)
    }
  }
}

export async function detectRepoSignals(repoPath) {
  const names = new Set()
  await scanSignals(repoPath, 2, names)
  return {
    frontend: hasNamedSignal(names, frontendSignals),
    mobile:
      hasNamedSignal(names, mobileSignals) ||
      hasPatternSignal(names, [/(^|[-_])(ios|apple)([-_]|$)/i, /\.xcodeproj$/i, /\.xcworkspace$/i]),
  }
}

export function inferOverlays(signals, requested) {
  const overlays = new Set(["default", ...requested])
  if (signals.frontend) {
    overlays.add("frontend")
  }
  if (signals.mobile) {
    overlays.add("mobile")
  }
  return [...overlays]
}

export async function ensureCheckpointIgnore(repoPath, dryRun) {
  const gitignorePath = join(repoPath, ".gitignore")
  const existing = (await pathExists(gitignorePath)) ? await readFile(gitignorePath, "utf8") : ""
  if (existing.includes(checkpointIgnore)) {
    return false
  }
  const prefix = existing && !existing.endsWith("\n") ? "\n" : ""
  const next = `${existing}${prefix}${checkpointIgnore}\n`
  if (!dryRun) {
    await writeFile(gitignorePath, next, "utf8")
  }
  return true
}

export async function loadProjectConfig(repoPath) {
  const configPath = join(repoPath, "opencode.json")
  if (!(await pathExists(configPath))) {
    return { configPath, config: null }
  }
  return { configPath, config: await readJsonc(configPath) }
}

export function patchProjectConfig(config) {
  const next = structuredClone(config)
  next.watcher = next.watcher || {}
  next.watcher.ignore = Array.isArray(next.watcher.ignore) ? next.watcher.ignore : []
  if (!next.watcher.ignore.includes(watcherIgnore)) {
    next.watcher.ignore.push(watcherIgnore)
  }

  if (next.tools && next.tools["*"] === true) {
    delete next.tools["*"]
    if (Object.keys(next.tools).length === 0) {
      delete next.tools
    }
  }

  return next
}

export async function renderBridgeConfig(repoPath) {
  const template = await readFile(bridgeTemplatePath, "utf8")
  return template.replaceAll("__REPO_PATH__", repoPath)
}

export function renderOverlayConfig(overlays) {
  return `${JSON.stringify({ mode: "exact", enable: overlays, disable: [] }, null, 2)}\n`
}

export function rel(repoPath, targetPath) {
  const value = relative(repoPath, targetPath)
  return value || "."
}

export function resolveRepoPath(repoPath) {
  return resolve(repoPath)
}
