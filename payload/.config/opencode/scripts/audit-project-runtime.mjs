import { join } from "node:path"
import {
  assertRepo,
  checkpointIgnore,
  detectRepoSignals,
  inferOverlays,
  loadProjectConfig,
  parseArgs,
  pathExists,
  resolveRepoPath,
  watcherIgnore,
} from "./lib/project-runtime.mjs"
import { readFile } from "node:fs/promises"

const args = parseArgs(process.argv.slice(2))
const repoPath = resolveRepoPath(args.repo)
await assertRepo(repoPath)

const signals = await detectRepoSignals(repoPath)
const recommendedOverlays = inferOverlays(signals, args.overlays)
const gitignorePath = join(repoPath, ".gitignore")
const gitignore = (await pathExists(gitignorePath)) ? await readFile(gitignorePath, "utf8") : ""
const overlaysPath = join(repoPath, ".opencode", "overlays.jsonc")
const { config } = await loadProjectConfig(repoPath)

const report = {
  repo: repoPath,
  signals,
  recommendedOverlays,
  hasProjectState: await pathExists(join(repoPath, ".opencode", "README.md")),
  hasMemoryFiles:
    (await pathExists(join(repoPath, ".opencode", "memory", "current.md"))) &&
    (await pathExists(join(repoPath, ".opencode", "memory", "decisions.md"))) &&
    (await pathExists(join(repoPath, ".opencode", "memory", "handoff.md"))),
  hasOverlayFile: await pathExists(overlaysPath),
  checkpointIgnoredInGit: gitignore.includes(checkpointIgnore),
  hasProjectConfig: Boolean(config),
  widensToolSurface: Boolean(config?.tools?.["*"] === true),
  checkpointIgnoredInWatcher: Boolean(config?.watcher?.ignore?.includes(watcherIgnore)),
  recommendations: [],
}

if (!report.hasProjectState || !report.hasMemoryFiles) {
  report.recommendations.push("bootstrap .opencode/ state")
}
if (!report.hasOverlayFile) {
  report.recommendations.push("create .opencode/overlays.jsonc")
}
if (!report.checkpointIgnoredInGit) {
  report.recommendations.push("ignore .opencode/checkpoints/ in .gitignore")
}
if (report.hasProjectConfig && report.widensToolSurface) {
  report.recommendations.push("patch opencode.json to stop widening tools[*]")
}
if (report.hasProjectConfig && !report.checkpointIgnoredInWatcher) {
  report.recommendations.push("add watcher ignore for .opencode/checkpoints/**")
}
if (!report.hasProjectConfig) {
  report.recommendations.push("project opencode.json is optional; create one only if repo-scoped MCPs are needed")
}

console.log(JSON.stringify(report, null, 2))
