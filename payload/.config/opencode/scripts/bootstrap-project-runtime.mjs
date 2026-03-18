import { join } from "node:path"
import {
  assertRepo,
  copyTemplateIfMissing,
  detectRepoSignals,
  ensureCheckpointIgnore,
  inferOverlays,
  loadProjectConfig,
  parseArgs,
  patchProjectConfig,
  pathExists,
  projectStateTemplateRoot,
  rel,
  renderBridgeConfig,
  renderOverlayConfig,
  resolveRepoPath,
  writeFileIfChanged,
  formatJson,
} from "./lib/project-runtime.mjs"

const args = parseArgs(process.argv.slice(2))
const repoPath = resolveRepoPath(args.repo)
await assertRepo(repoPath)

const actions = []
const templateFiles = [
  ".opencode/README.md",
  ".opencode/memory/current.md",
  ".opencode/memory/decisions.md",
  ".opencode/memory/handoff.md",
]

for (const relativePath of templateFiles) {
  const changed = await copyTemplateIfMissing(
    join(projectStateTemplateRoot, relativePath.replace(/^\.opencode\//, "")),
    join(repoPath, relativePath),
    args.dryRun,
  )
  if (changed) {
    actions.push(`scaffolded ${relativePath}`)
  }
}

const signals = await detectRepoSignals(repoPath)
const overlays = inferOverlays(signals, args.overlays)
const overlaysPath = join(repoPath, ".opencode", "overlays.jsonc")
if (args.refreshOverlays || !(await pathExists(overlaysPath))) {
  const changed = await writeFileIfChanged(overlaysPath, renderOverlayConfig(overlays), args.dryRun)
  if (changed) {
    actions.push(`wrote .opencode/overlays.jsonc -> ${overlays.join(", ")}`)
  }
}

if (await ensureCheckpointIgnore(repoPath, args.dryRun)) {
  actions.push("added .opencode/checkpoints/ to .gitignore")
}

const { configPath, config } = await loadProjectConfig(repoPath)
if (!config && args.bridgeConfig) {
  const changed = await writeFileIfChanged(configPath, await renderBridgeConfig(repoPath), args.dryRun)
  if (changed) {
    actions.push(`created ${rel(repoPath, configPath)}`)
  }
}

if (config && args.patchConfig) {
  const changed = await writeFileIfChanged(configPath, formatJson(patchProjectConfig(config)), args.dryRun)
  if (changed) {
    actions.push(`patched ${rel(repoPath, configPath)}`)
  }
}

if (!args.bridgeConfig && !config) {
  actions.push("note: no opencode.json found; global runtime will still apply")
}

if (!args.patchConfig && config && config.tools?.["*"] === true) {
  actions.push("note: existing opencode.json still widens tools with tools[*]=true; rerun with --patch-config to inherit global narrowing")
}

console.log(JSON.stringify({
  repo: repoPath,
  dryRun: args.dryRun,
  overlays,
  signals,
  actions,
}, null, 2))
