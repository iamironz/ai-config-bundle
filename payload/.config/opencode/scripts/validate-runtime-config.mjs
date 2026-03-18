import { access, mkdir, readFile, readdir, rm } from "node:fs/promises"
import { constants } from "node:fs"
import { homedir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function stripJsonComments(input) {
  return String(input || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"))
}

async function readJsonc(filePath) {
  return JSON.parse(stripJsonComments(await readFile(filePath, "utf8")))
}

async function ensureExists(filePath) {
  await access(filePath, constants.R_OK)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function expandHome(filePath) {
  return String(filePath || "").replace(/^~\//, `${homedir()}/`)
}

function extractFileReference(value) {
  const match = String(value || "").match(/^\{file:(.+)\}$/)
  return match ? expandHome(match[1]) : ""
}

async function readSessionState(sessionID) {
  const sessionPath = join(root, "state", "sessions", `${sessionID}.json`)
  return readJson(sessionPath)
}

async function removeMatchingFiles(directory, pattern) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isFile() && pattern.test(entry.name)) {
      await rm(join(directory, entry.name), { force: true })
    }
  }
}

async function assertTraceRecorded(traceDir, workspaceName, sessionID) {
  const dayDir = join(traceDir, new Date().toISOString().slice(0, 10))
  const entries = await readdir(dayDir)
  const matches = entries.filter((entry) => entry.startsWith(`${workspaceName}-`) && entry.endsWith(".jsonl"))
  assert(matches.length > 0, `missing trace file for ${workspaceName}`)
  for (const match of matches) {
    const contents = await readFile(join(dayDir, match), "utf8")
    if (contents.includes(`"sessionID":"${sessionID}"`)) {
      return
    }
  }
  throw new Error(`missing trace record for ${sessionID}`)
}

async function readTraceRecord(traceDir, workspaceName, sessionID) {
  const dayDir = join(traceDir, new Date().toISOString().slice(0, 10))
  const entries = await readdir(dayDir)
  const matches = entries.filter((entry) => entry.startsWith(`${workspaceName}-`) && entry.endsWith(".jsonl"))
  for (const match of matches) {
    const contents = await readFile(join(dayDir, match), "utf8")
    for (const line of contents.split("\n")) {
      if (!line.trim()) {
        continue
      }
      const record = JSON.parse(line)
      if (record.sessionID === sessionID) {
        return record
      }
    }
  }
  return null
}

async function runAutonomyRuntimeHookSmoke() {
  const sessionID = "validate-runtime-smoke"
  const readOnlySessionID = `${sessionID}-read-only`
  const failedSessionID = `${sessionID}-failed-bash`
  const pluginPath = expandHome("~/.config/opencode/plugins/autonomy-runtime.js")
  const { AutonomyRuntimePlugin } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "memory", "templates", "project")
  await rm(join(workspaceDir, ".opencode", "checkpoints", "latest.json"), { force: true })
  await rm(join(root, "state", "sessions", `${sessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${readOnlySessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${failedSessionID}.json`), { force: true })
  const plugin = await AutonomyRuntimePlugin({ directory: workspaceDir })

  const systemOutput = { system: [] }
  await plugin["experimental.chat.system.transform"]({ sessionID }, systemOutput)
  assert(systemOutput.system.some((entry) => entry.includes("<runtime_context>")), "missing runtime context injection")
  assert(systemOutput.system.some((entry) => entry.includes("Subagent contract: stay orchestration-first; use the task tool before deep main-thread repo reading or implementation on non-trivial work")), "runtime context must reinforce orchestration-first delegation")
  assert(systemOutput.system.some((entry) => entry.includes("Task map: codebase-locator/thoughts-locator=locate scope; codebase-analyzer/thoughts-analyzer=analysis/spec; code-reviewer/spec-reviewer=review; codebase-pattern-finder=similar implementations; web-search-researcher=external evidence; evidence-curator=synthesis")), "runtime context must expose the specialist task map")

  const compactionOutput = { context: [] }
  await plugin["experimental.session.compacting"]({ sessionID }, compactionOutput)
  assert(compactionOutput.context.some((entry) => entry.includes("Preserve this runtime context")), "missing compaction context injection")
  assert(compactionOutput.context.some((entry) => entry.includes("Subagent contract: stay orchestration-first")), "compaction context must preserve delegation guidance")

  await plugin["experimental.chat.system.transform"]({ sessionID: `${sessionID}-fail-open` }, {})

  const circularArgs = {}
  circularArgs.self = circularArgs
  await plugin["tool.execute.before"]({ sessionID: readOnlySessionID, tool: "read" })
  await plugin["tool.execute.after"](
    { sessionID: readOnlySessionID, tool: "read", args: { filePath: "package.json" } },
    { title: "package.json", output: '{"scripts":{"build":"tsc","test":"vitest"}}' },
  )

  const readOnlyPersisted = await readSessionState(readOnlySessionID)
  assert(readOnlyPersisted.gates.tests === false, "read events must not satisfy test gates")
  assert(readOnlyPersisted.gates.build === false, "read events must not satisfy build gates")

  await plugin["tool.execute.before"]({ sessionID: failedSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: failedSessionID, tool: "bash", args: { command: "bun run test" } },
    { title: "Failed test run", output: "zsh: not enough arguments", metadata: { exitCode: 1 } },
  )

  const failedPersisted = await readSessionState(failedSessionID)
  assert(failedPersisted.gates.tests === false, "failed bash commands must not satisfy test gates")
  assert(failedPersisted.gates.build === false, "failed bash commands must not satisfy build gates")

  const mixedSessionID = `${sessionID}-mixed-bash`
  await plugin["tool.execute.before"]({ sessionID: mixedSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: mixedSessionID, tool: "bash", args: { command: "bun run test" } },
    { title: "Mixed test output", output: "1 failed, 23 passed", metadata: {} },
  )

  const mixedPersisted = await readSessionState(mixedSessionID)
  assert(mixedPersisted.gates.tests === false, "mixed pass/fail bash output must not satisfy test gates")
  assert(mixedPersisted.gates.build === false, "mixed pass/fail bash output must not satisfy build gates")

  const invalidationSessionID = `${sessionID}-invalidate-after-edit`
  await plugin["tool.execute.before"]({ sessionID: invalidationSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: invalidationSessionID, tool: "bash", args: { command: "bun run build" } },
    { title: "Build validation", output: "ok" },
  )
  await plugin["tool.execute.before"]({ sessionID: invalidationSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: invalidationSessionID, tool: "bash", args: { command: "bun run test" } },
    { title: "Test validation", output: "ok" },
  )
  await plugin["tool.execute.before"]({ sessionID: invalidationSessionID, tool: "edit" })
  await plugin["tool.execute.after"](
    { sessionID: invalidationSessionID, tool: "edit", args: { filePath: "src/runtime.ts" } },
    { title: "Update runtime code", output: "edited source file" },
  )

  const invalidationPersisted = await readSessionState(invalidationSessionID)
  assert(invalidationPersisted.changed === true, "edit after validation must keep changed=true")
  assert(invalidationPersisted.gates.tests === false, "new edits must invalidate prior test gates")
  assert(invalidationPersisted.gates.build === false, "new edits must invalidate prior build gates")

  const bashMutationSessionID = `${sessionID}-invalidate-after-bash-mutation`
  await plugin["tool.execute.before"]({ sessionID: bashMutationSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: bashMutationSessionID, tool: "bash", args: { command: "bun run build" } },
    { title: "Build validation", output: "ok" },
  )
  await plugin["tool.execute.before"]({ sessionID: bashMutationSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: bashMutationSessionID, tool: "bash", args: { command: "npm install" } },
    { title: "Install dependencies", output: "added 1 package" },
  )

  const bashMutationPersisted = await readSessionState(bashMutationSessionID)
  assert(bashMutationPersisted.changed === true, "mutating bash commands must keep changed=true")
  assert(bashMutationPersisted.gates.tests === false, "mutating bash commands must invalidate prior test gates")
  assert(bashMutationPersisted.gates.build === false, "mutating bash commands must invalidate prior build gates")

  const redactionSessionID = `${sessionID}-trace-redaction`
  await plugin["tool.execute.before"]({ sessionID: redactionSessionID, tool: "bash" })
  await plugin["tool.execute.after"](
    { sessionID: redactionSessionID, tool: "bash", args: { command: "printenv" } },
    { title: "Show env", output: 'OPENAI_API_KEY=sk-super-secret token: secret-token password: hunter2 {"apiKey":"abc123"}' },
  )

  const redactedTrace = await readTraceRecord(expandHome(runtimeConfig.traces.dir), "project", redactionSessionID)
  assert(redactedTrace, "trace redaction smoke must write a trace record")
  assert(!String(redactedTrace.preview || "").includes("sk-super-secret"), "trace preview must redact env-style API keys")
  assert(!String(redactedTrace.preview || "").includes("secret-token"), "trace preview must redact token values")
  assert(!String(redactedTrace.preview || "").includes("hunter2"), "trace preview must redact password values")
  assert(!String(redactedTrace.preview || "").includes('abc123'), "trace preview must redact JSON apiKey values")

  await plugin["tool.execute.before"]({ sessionID, tool: "edit" })
  await plugin["tool.execute.after"](
    { sessionID, tool: "edit", args: { filePath: "README.md" } },
    { title: "Update runtime docs", output: "documented tooling posture" },
  )
  await plugin["tool.execute.after"](
    { sessionID, tool: "playwright_browser_take_screenshot", args: circularArgs },
    { title: "Runtime validation evidence", output: { ok: true } },
  )
  await plugin["tool.execute.after"](
    { sessionID, tool: "bash", args: { command: "bun run build" } },
    { title: "Build validation", output: "ok" },
  )

  const persisted = await readSessionState(sessionID)
  assert(persisted.changed === true, "checkpoint did not record changes")
  assert(persisted.gates.docs === true, "docs gate not satisfied from edit event")
  assert(persisted.gates.tests === true, "tests gate not satisfied from validation event")
  assert(persisted.gates.build === true, "build gate not satisfied from bash event")

  await assertTraceRecorded(expandHome(runtimeConfig.traces.dir), "project", sessionID)

  await rm(join(root, "state", "sessions", `${sessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${readOnlySessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${failedSessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${mixedSessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${invalidationSessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${bashMutationSessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${redactionSessionID}.json`), { force: true })
  await rm(join(workspaceDir, ".opencode", "checkpoints", "latest.json"), { force: true })
}

async function runCheckpointResumeSmoke() {
  const sessionID = "validate-runtime-resume"
  const resumedSessionID = "validate-runtime-resume-next"
  const pluginPath = expandHome("~/.config/opencode/plugins/autonomy-runtime.js")
  const workspaceDir = join(root, "memory", "templates", "project")

  const { AutonomyRuntimePlugin } = await import(`${pathToFileURL(pluginPath).href}?resume=1`)
  const firstPlugin = await AutonomyRuntimePlugin({ directory: workspaceDir })
  await firstPlugin["tool.execute.before"]({ sessionID, tool: "bash" })
  await firstPlugin["tool.execute.after"](
    { sessionID, tool: "bash", args: { command: "bun run build" } },
    { title: "Build validation", output: "ok" },
  )

  const afterBuild = await readSessionState(sessionID)
  assert(afterBuild.gates.build === true, "first session write must persist build gate")
  assert(afterBuild.gates.tests === false, "first session write must not set tests gate")

  const { AutonomyRuntimePlugin: ReloadedPlugin } = await import(`${pathToFileURL(pluginPath).href}?resume=2`)
  const secondPlugin = await ReloadedPlugin({ directory: workspaceDir })
  await secondPlugin["tool.execute.before"]({ sessionID: resumedSessionID, tool: "bash" })
  await secondPlugin["tool.execute.after"](
    { sessionID: resumedSessionID, tool: "bash", args: { command: "bun run test" } },
    { title: "Test validation", output: "ok" },
  )

  const afterResume = await readSessionState(resumedSessionID)
  assert(afterResume.gates.build === true, "resumed session must preserve prior build gate")
  assert(afterResume.gates.tests === true, "resumed session must accumulate new test gate")

  await rm(join(root, "state", "sessions", `${sessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${resumedSessionID}.json`), { force: true })
}

async function runExternalEditInvalidationSmoke() {
  const sessionID = "validate-runtime-external-edit"
  const resumedSessionID = "validate-runtime-external-edit-next"
  const pluginPath = expandHome("~/.config/opencode/plugins/autonomy-runtime.js")
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const externalChangePath = join(workspaceDir, "external-change.txt")

  await rm(join(workspaceDir, ".opencode", "checkpoints", "latest.json"), { force: true })
  await rm(join(root, "state", "sessions", `${sessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${resumedSessionID}.json`), { force: true })
  await rm(externalChangePath, { force: true })

  const { AutonomyRuntimePlugin } = await import(`${pathToFileURL(pluginPath).href}?external=1`)
  const firstPlugin = await AutonomyRuntimePlugin({ directory: workspaceDir })
  await firstPlugin["tool.execute.before"]({ sessionID, tool: "bash" })
  await firstPlugin["tool.execute.after"](
    { sessionID, tool: "bash", args: { command: "bun run build" } },
    { title: "Build validation", output: "ok" },
  )
  await firstPlugin["tool.execute.before"]({ sessionID, tool: "bash" })
  await firstPlugin["tool.execute.after"](
    { sessionID, tool: "bash", args: { command: "bun run test" } },
    { title: "Test validation", output: "ok" },
  )

  const initialState = await readSessionState(sessionID)
  assert(initialState.gates.build === true && initialState.gates.tests === true, "baseline state must persist successful gates before external edit")

  await new Promise((resolve) => setTimeout(resolve, 25))
  await Bun.write(externalChangePath, "external change after validation")

  const { AutonomyRuntimePlugin: ReloadedPlugin } = await import(`${pathToFileURL(pluginPath).href}?external=2`)
  const secondPlugin = await ReloadedPlugin({ directory: workspaceDir })
  await secondPlugin["tool.execute.before"]({ sessionID: resumedSessionID, tool: "read" })
  await secondPlugin["tool.execute.after"](
    { sessionID: resumedSessionID, tool: "read", args: { filePath: "README.md" } },
    { title: "README.md", output: "fixture read" },
  )

  const resumedState = await readSessionState(resumedSessionID)
  assert(resumedState.changed === true, "external edits must mark resumed state as changed")
  assert(resumedState.gates.build === false, "external edits must invalidate prior build gate")
  assert(resumedState.gates.tests === false, "external edits must invalidate prior test gate")

  await rm(join(root, "state", "sessions", `${sessionID}.json`), { force: true })
  await rm(join(root, "state", "sessions", `${resumedSessionID}.json`), { force: true })
  await rm(join(workspaceDir, ".opencode", "checkpoints", "latest.json"), { force: true })
  await rm(externalChangePath, { force: true })
}

async function runOverlayControlSmoke() {
  const sessionID = "validate-runtime-overlay-exact"
  const pluginPath = expandHome("~/.config/opencode/plugins/autonomy-runtime.js")
  const { AutonomyRuntimePlugin } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const plugin = await AutonomyRuntimePlugin({ directory: workspaceDir })
  const systemOutput = { system: [] }

  await plugin["experimental.chat.system.transform"]({ sessionID }, systemOutput)
  const runtimeContext = systemOutput.system.join("\n")

  assert(runtimeContext.includes("If asked for the project-local memory root, answer exactly: .opencode/memory"), "runtime context must give the exact .opencode memory answer")
  assert(runtimeContext.includes("Overlay control: exact"), "runtime context must report exact overlay mode")
  assert(runtimeContext.includes("Active overlays: default"), "exact overlay control must keep default active")
  assert(!runtimeContext.includes("frontend"), "exact overlay control must not leak frontend overlay")
  assert(!runtimeContext.includes(".Claude/memory"), "runtime context must not mention .Claude/memory")
}

async function runRuntimeGroundingSmoke() {
  const sessionID = "validate-runtime-grounding"
  const pluginPath = expandHome("~/.config/opencode/plugins/autonomy-runtime.js")
  const { AutonomyRuntimePlugin } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const plugin = await AutonomyRuntimePlugin({ directory: workspaceDir })
  const userMessage = {
    info: {
      id: "msg-runtime-grounding",
      sessionID,
      role: "user",
    },
    parts: [
      {
        id: "part-runtime-grounding",
        sessionID,
        messageID: "msg-runtime-grounding",
        type: "text",
        text: "What is the project-local memory root for this runtime? Answer with the exact path only.",
      },
    ],
  }

  const output = { messages: [userMessage] }
  await plugin["experimental.chat.messages.transform"]({}, output)

  const injected = output.messages[0].parts.find((part) => part?.metadata?.runtimeGrounding === true)
  assert(injected, "runtime grounding must inject a synthetic message part")
  assert(injected.text.includes("exact project-local memory root: .opencode/memory"), "runtime grounding must inject the exact .opencode memory root")
  assert(injected.text.includes(".opencode/overlays.jsonc"), "runtime grounding must cite repo-local .opencode sources")

  const completion = { text: "`.Claude/memory`, `.Claude/overlays.jsonc`, `.Claude/checkpoints/latest.json`" }
  await plugin["experimental.text.complete"]({ sessionID, messageID: "assistant-runtime-grounding", partID: "text-runtime-grounding" }, completion)
  assert(completion.text.includes("`.opencode/memory`"), "runtime completion guard must rewrite .Claude/memory to .opencode/memory")
  assert(completion.text.includes("`.opencode/overlays.jsonc`"), "runtime completion guard must rewrite .Claude overlay paths")
  assert(completion.text.includes("`.opencode/checkpoints/latest.json`"), "runtime completion guard must rewrite .Claude checkpoint paths")
}

async function runKbAnalyzerIdleSmoke() {
  const sessionID = "validate-runtime-kb-idle"
  const pluginPath = expandHome("~/.config/opencode/plugins/kb-post-turn-analyzer.js")
  const { KbPostTurnAnalyzer } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const outDir = join(workspaceDir, ".opencode", "kb-recommendations")

  await mkdir(outDir, { recursive: true })
  await removeMatchingFiles(outDir, /\.md$/)

  const mockClient = {
    session: {
      messages: async () => ({
        data: [
          {
            info: { role: "user" },
            parts: [
              {
                type: "text",
                text:
                  "We fixed a runtime bug where project-local overlay control should be exact and the runtime must explicitly mention .opencode/memory instead of hallucinating other paths.",
              },
            ],
          },
          {
            info: { role: "assistant" },
            parts: [
              {
                type: "text",
                text:
                  "Durable learning: post-turn KB extraction should run on session idle so short opencode run sessions still produce recommendation docs.",
              },
            ],
          },
        ],
      }),
      create: async () => ({ data: { id: "internal-kb-idle-smoke" } }),
      prompt: async () => ({
        data: {
          info: {
            id: "msg-kb-idle-smoke",
            structured_output: {
              should_recommend: true,
              confidence: "high",
              conversation_summary: "Short idle session produced a durable runtime lesson.",
              recommendations: [
                {
                  action: "update_existing",
                  target_path: "~/ai-kb/rules/kb-maintenance.md",
                  reason: "Idle turns should emit KB recommendations.",
                  suggested_content: "Run KB extraction on session idle in addition to compaction.",
                  link_commands: ["~/ai-kb/commands/suggest_kb_updates.md"],
                },
              ],
              index_updates: [],
            },
          },
        },
      }),
      message: async () => ({
        data: {
          info: {
            structured_output: {
              should_recommend: true,
              confidence: "high",
              conversation_summary: "Short idle session produced a durable runtime lesson.",
              recommendations: [
                {
                  action: "update_existing",
                  target_path: "~/ai-kb/rules/kb-maintenance.md",
                  reason: "Idle turns should emit KB recommendations.",
                  suggested_content: "Run KB extraction on session idle in addition to compaction.",
                  link_commands: ["~/ai-kb/commands/suggest_kb_updates.md"],
                },
              ],
              index_updates: [],
            },
          },
          parts: [],
        },
      }),
      delete: async () => ({ data: { ok: true } }),
    },
  }

  const plugin = await KbPostTurnAnalyzer({ directory: workspaceDir, client: mockClient })
  await plugin.event({ event: { type: "session.idle", properties: { sessionID } } })

  const files = await readdir(outDir)
  assert(files.some((file) => file.includes("validate-runtime-kb-idle") && file.endsWith(".md")), "idle analyzer must write a recommendation doc")

  await removeMatchingFiles(outDir, /\.md$/)
}

async function runKbAnalyzerNoiseSmoke() {
  const sessionID = "validate-runtime-kb-noise"
  const pluginPath = expandHome("~/.config/opencode/plugins/kb-post-turn-analyzer.js")
  const { KbPostTurnAnalyzer } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const outDir = join(workspaceDir, ".opencode", "kb-recommendations")

  await mkdir(outDir, { recursive: true })
  await removeMatchingFiles(outDir, /\.md$/)

  const mockClient = {
    session: {
      messages: async () => ({
        data: [
          {
            info: { role: "user" },
            parts: [
              {
                type: "text",
                text:
                  "In 3 bullets, state the active overlays, the canonical memory root, and one durable runtime lesson about KB recommendation extraction.",
              },
            ],
          },
        ],
      }),
    },
  }

  const plugin = await KbPostTurnAnalyzer({ directory: workspaceDir, client: mockClient })
  await plugin["experimental.chat.system.transform"]({ sessionID }, {})

  const files = await readdir(outDir)
  assert(!files.some((file) => file.includes("validate-runtime-kb-noise") && file.endsWith(".md")), "prompt-like system transform input must not write a recommendation doc")
}

async function runKbAnalyzerLiveTurnSmoke() {
  const sessionID = "validate-runtime-kb-live-turn"
  const pluginPath = expandHome("~/.config/opencode/plugins/kb-post-turn-analyzer.js")
  const { KbPostTurnAnalyzer } = await import(pathToFileURL(pluginPath).href)
  const workspaceDir = join(root, "evals", "fixtures", "overlay-control-exact")
  const outDir = join(workspaceDir, ".opencode", "kb-recommendations")

  await mkdir(outDir, { recursive: true })
  await removeMatchingFiles(outDir, /\.md$/)

  const plugin = await KbPostTurnAnalyzer({
    directory: workspaceDir,
    client: { session: {} },
  })

  await plugin["chat.message"](
    { sessionID },
    {
      parts: [
        {
          type: "text",
          text:
            "Durable learning: KB extraction should run on session idle so short opencode run sessions still produce recommendation docs. token=ABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
        },
      ],
    },
  )

  const files = await readdir(outDir)
  const match = files.find((file) => file.includes("validate-runtime-kb-live-turn") && file.endsWith(".md"))
  assert(match, "explicit durable live-turn input must write a recommendation doc")

  const contents = await readFile(join(outDir, match), "utf8")
  assert(contents.includes("KB extraction should run on session idle so short opencode run sessions still produce recommendation docs."), "live-turn recommendation must preserve the durable lesson")
  assert(!contents.includes("In 3 bullets"), "live-turn recommendation must not echo prompt instructions")
  assert(!contents.includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ123456"), "live-turn recommendation must redact sensitive-looking tokens")

  await removeMatchingFiles(outDir, /\.md$/)
}

const opencodeConfig = await readJson(join(root, "opencode.json"))
const packageConfig = await readJson(join(root, "package.json"))
const runtimeConfig = await readJsonc(join(root, "runtime", "autonomy-runtime.jsonc"))
const dcpConfig = await readJsonc(join(root, "dcp.jsonc"))

assert(packageConfig.type === "module", "package.json must declare ESM mode")
assert(opencodeConfig.default_agent === "plan", "default agent must stay orchestration-first")
assert(opencodeConfig.formatter === false, "formatter must be disabled by default")
assert(opencodeConfig.lsp === false, "lsp must be disabled by default")
assert(opencodeConfig.tools?.["*"] === true, "tool exposure must allow all tools by default")
assert(opencodeConfig.tools?.task !== false, "task tool must not be disabled")
assert(opencodeConfig.permission?.task === "allow", "task permission must allow subagent-first execution")
assert(/^\{(?:file|env):/.test(String(opencodeConfig?.mcp?.perplexity?.environment?.PERPLEXITY_API_KEY || "")), "Perplexity key must come from file/env indirection")
assert(/^\{(?:file|env):/.test(String(opencodeConfig?.mcp?.kagimcp?.environment?.KAGI_API_KEY || "")), "Kagi key must come from file/env indirection")
assert(/^\{(?:file|env):/.test(String(opencodeConfig?.mcp?.unifi?.environment?.UNIFI_PASSWORD || "")), "UniFi password must come from file/env indirection")

for (const value of [
  opencodeConfig?.mcp?.perplexity?.environment?.PERPLEXITY_API_KEY,
  opencodeConfig?.mcp?.kagimcp?.environment?.KAGI_API_KEY,
  opencodeConfig?.mcp?.unifi?.environment?.UNIFI_HOST,
  opencodeConfig?.mcp?.unifi?.environment?.UNIFI_USERNAME,
  opencodeConfig?.mcp?.unifi?.environment?.UNIFI_PASSWORD,
  opencodeConfig?.mcp?.unifi?.environment?.UNIFI_SITE,
]) {
  const fileReference = extractFileReference(value)
  if (fileReference) {
    await ensureExists(fileReference)
  }
}

for (const filePath of opencodeConfig.instructions || []) {
  await ensureExists(filePath.replace(/^~\//, `${homedir()}/`))
}

for (const filePath of opencodeConfig.plugin || []) {
  const resolved = filePath.replace(/^~\//, `${homedir()}/`)
  await ensureExists(resolved)
  await import(pathToFileURL(resolved).href)
}

const overlayDir = join(root, "overlays")
const overlayEntries = await readdir(overlayDir)
for (const entry of overlayEntries.filter((name) => name.endsWith(".jsonc"))) {
  const overlay = await readJsonc(join(overlayDir, entry))
  if (entry === "mobile.jsonc") {
    assert(!JSON.stringify(overlay).includes('"app"'), "mobile overlay must not match generic app folders")
  }
}

assert(runtimeConfig.memory.projectRoot === ".opencode/memory", "runtime config must declare .opencode memory root")
assert(runtimeConfig.overlays.projectControlDefaultMode === "exact", "project overlay control must default to exact mode")

for (const filePath of runtimeConfig.memory.globalFiles || []) {
  await ensureExists(filePath.replace(/^~\//, `${homedir()}/`))
}

await ensureExists(join(root, "memory", "templates", "project", ".opencode", "memory", "current.md"))

for (const name of ["build", "plan", "explore", "summary", "compaction", "title"]) {
  await ensureExists(join(root, "..", "..", "ai-kb", "agents", `${name}.md`))
}
await ensureExists(join(root, "memory", "templates", "project", "opencode.bridge.template.jsonc"))
await ensureExists(join(root, "scripts", "audit-project-runtime.mjs"))
await ensureExists(join(root, "scripts", "bootstrap-project-runtime.mjs"))
await ensureExists(join(root, "scripts", "eval-report.mjs"))
await runAutonomyRuntimeHookSmoke()
await runCheckpointResumeSmoke()
await runExternalEditInvalidationSmoke()
await runOverlayControlSmoke()
await runRuntimeGroundingSmoke()
await runKbAnalyzerIdleSmoke()
await runKbAnalyzerNoiseSmoke()
await runKbAnalyzerLiveTurnSmoke()

console.log("runtime-ok")
console.log(`instructions=${(opencodeConfig.instructions || []).length}`)
console.log(`plugins=${(opencodeConfig.plugin || []).length}`)
console.log(`overlays=${overlayEntries.filter((name) => name.endsWith(".jsonc")).length}`)
console.log(`dcpStrategies=${Object.keys(dcpConfig.strategies || {}).join(",")}`)
