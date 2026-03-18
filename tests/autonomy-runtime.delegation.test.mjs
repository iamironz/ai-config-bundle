import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import test from "node:test"
import { pathToFileURL } from "node:url"

const REPO_ROOT = new URL("..", import.meta.url).pathname

function run(command, args, cwd = REPO_ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
        return
      }
      reject(new Error(`${command} ${args.join(" ")} failed (${code})\n${stdout}\n${stderr}`))
    })
  })
}

function resetRuntimeGlobals() {
  delete globalThis.__root_session_ids
  delete globalThis.__depth_one_session_ids
  delete globalThis.__active_task_parent_depths
  delete globalThis.__kb_internal_session_ids
  delete globalThis.__root_session_registered
}

async function loadPlugin(projectDir) {
  resetRuntimeGlobals()
  const pluginPath = join(projectDir, ".opencode", "plugins", "autonomy-runtime.js")
  const imported = await import(`${pathToFileURL(pluginPath).href}?cache=${Date.now()}-${Math.random()}`)
  return imported.AutonomyRuntimePlugin({ directory: projectDir })
}

function sessionStatePath(projectDir, sessionID) {
  return join(projectDir, ".opencode", "state", "sessions", `${sessionID}.json`)
}

async function readSessionState(projectDir, sessionID) {
  return JSON.parse(await readFile(sessionStatePath(projectDir, sessionID), "utf8"))
}

async function readTraceRecord(projectDir, sessionID) {
  const traceDir = join(projectDir, ".opencode", "traces", new Date().toISOString().slice(0, 10))
  const entries = await readdir(traceDir)
  for (const entry of entries) {
    const contents = await readFile(join(traceDir, entry), "utf8")
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

async function withInstalledProject(runTest) {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "autonomy-runtime-delegation-"))
  const projectDir = join(tempRoot, "project")
  const fakeHome = join(tempRoot, "home")
  const previousHome = process.env.HOME
  const previousInternalIds = globalThis.__kb_internal_session_ids

  try {
    await mkdir(projectDir, { recursive: true })
    await mkdir(fakeHome, { recursive: true })
    process.env.HOME = fakeHome
    await run("python3", ["install_bundle.py", "--project-dir", projectDir])
    const plugin = await loadPlugin(projectDir)
    await runTest({ plugin, projectDir, fakeHome })
  } finally {
    process.env.HOME = previousHome
    globalThis.__kb_internal_session_ids = previousInternalIds
    resetRuntimeGlobals()
    await rm(tempRoot, { recursive: true, force: true })
  }
}

test("multiple top-level sessions stay root-capable", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const first = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: "ses_rootalpha1234567890" }, first)

    const second = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: "ses_rootbeta12345678901" }, second)

    assert.match(first.system.join("\n"), /Subagent contract: stay orchestration-first/)
    assert.match(second.system.join("\n"), /Subagent contract: stay orchestration-first/)
    assert.doesNotMatch(second.system.join("\n"), /nested subagent at the depth limit/i)
  })
})

test("internal sessions do not steal root registration", async () => {
  await withInstalledProject(async ({ plugin }) => {
    globalThis.__kb_internal_session_ids = new Set(["ses_internalcontrol1234567890"])

    const internal = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: "ses_internalcontrol1234567890" }, internal)

    const root = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: "ses_userroot1234567890123" }, root)

    assert.match(internal.system.join("\n"), /INTERNAL SESSION/)
    assert.match(root.system.join("\n"), /Subagent contract: stay orchestration-first/)
  })
})

test("unknown sessions during active root task become depth-one children", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const parentSessionID = "ses_parentroot1234567890123"
    const childSessionID = "ses_childlane1234567890123"

    await plugin["experimental.chat.system.transform"]({ sessionID: parentSessionID }, { system: [] })

    const beforeTask = {
      args: {
        description: "Locate relevant files",
        prompt: "Locate runtime files",
        subagent_type: "codebase-locator",
      },
    }
    await plugin["tool.execute.before"]({ sessionID: parentSessionID, tool: "task" }, beforeTask)

    const child = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: childSessionID }, child)
    assert.match(child.system.join("\n"), /You are a subagent\./)

    await plugin["tool.execute.after"](
      { sessionID: parentSessionID, tool: "task", args: beforeTask.args },
      { title: "Spawn child", output: `task complete ${childSessionID}` },
    )

    const childAgain = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: childSessionID }, childAgain)
    assert.match(childAgain.system.join("\n"), /You are a subagent\./)
    assert.doesNotMatch(childAgain.system.join("\n"), /nested subagent at the depth limit/i)
  })
})

test("non-trivial requests inject delegation guidance and record blocked main-thread work", async () => {
  await withInstalledProject(async ({ plugin, projectDir }) => {
    const sessionID = "ses_delegationroot1234567890"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })

    const userMessage = {
      info: { id: "msg-delegation", role: "user", sessionID },
      parts: [
        {
          id: "part-delegation",
          type: "text",
          sessionID,
          messageID: "msg-delegation",
          text: "Implement the whole plan end-to-end for runtime delegation, lineage, observability, and tests.",
        },
      ],
    }
    const transformed = { messages: [userMessage] }
    await plugin["experimental.chat.messages.transform"]({}, transformed)

    const guidance = transformed.messages[0].parts.find((part) => part?.metadata?.delegationGuidance === true)
    assert.equal(guidance, undefined)

    await plugin["tool.execute.before"]({ sessionID, tool: "grep" }, {})
    const grepOutput = { title: "Search files", output: "original grep results" }
    await plugin["tool.execute.after"](
      { sessionID, tool: "grep", args: { pattern: "delegation" } },
      grepOutput,
    )

    assert.equal(String(grepOutput.output), "original grep results")

    const state = await readSessionState(projectDir, sessionID)
    assert.equal(state.delegation.expected, true)
    assert.equal(state.delegation.satisfied, false)
    assert.equal(state.delegation.blockedToolCount, 1)
    assert.equal(state.delegation.firstBlockedTool, "grep")

    const trace = await readTraceRecord(projectDir, sessionID)
    assert.ok(trace, "expected a trace record for the gated tool")
    assert.equal(trace.depth, 0)
    assert.equal(trace.delegationExpected, true)
    assert.equal(trace.delegationBlocked, true)
  })
})

test("non-trivial root sessions rewrite mutating bash before any task dispatch", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_bashgate123456789012345"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })

    const userMessage = {
      info: { id: "msg-bash-gate", role: "user", sessionID },
      parts: [
        {
          id: "part-bash-gate",
          type: "text",
          sessionID,
          messageID: "msg-bash-gate",
          text: "Deeply analyze the tooling and implement the whole plan end-to-end.",
        },
      ],
    }
    await plugin["experimental.chat.messages.transform"]({}, { messages: [userMessage] })

    const before = {
      args: {
        command: "npm install",
        description: "Installs dependencies",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "bash" }, before)

    assert.notEqual(before.args.command, "npm install")
    assert.equal(before.args.command, "true")
    assert.equal(before.args.description, "No-op due to delegation gate")
  })
})

test("task subagent typos normalize to valid specialists", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_tasktypenorm12345678901"
    const beforeTask = {
      args: {
        description: "Locate install files",
        prompt: "Locate install files and related runtime config",
        subagent_type: "codebase-lator",
      },
    }

    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, beforeTask)

    assert.equal(beforeTask.args.subagent_type, "codebase-locator")
    assert.match(beforeTask.args.prompt, /TASK SUBAGENT NORMALIZATION:/)
    assert.match(beforeTask.args.prompt, /codebase-lator/)
  })
})

test("task requests using primary runtime lanes reroute safely", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_tasklaneroute1234567890"

    const exploreTask = {
      args: {
        description: "Locate install files",
        prompt: "Locate install files and related runtime config",
        subagent_type: "explore",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, exploreTask)
    assert.equal(exploreTask.args.subagent_type, "codebase-locator")

    const buildTask = {
      args: {
        description: "Run build validation",
        prompt: "Run build validation and summarize what the correct lane should be",
        subagent_type: "build",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, buildTask)
    assert.equal(buildTask.args.subagent_type, "code-implementer")
    assert.match(buildTask.args.prompt, /mapped primary runtime lane `build` -> task subagent `code-implementer`/i)
  })
})

test("implementation intent normalizes to code-implementer", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_taskimplement1234567890"
    const beforeTask = {
      args: {
        description: "Implement the feature",
        prompt: "Implement the requested fix in the repo and run targeted validation",
      },
    }

    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, beforeTask)

    assert.equal(beforeTask.args.subagent_type, "code-implementer")
    assert.match(beforeTask.args.prompt, /inferred `code-implementer`/i)
  })
})

test("skill routing is required before broad root work and recorded once loaded", async () => {
  await withInstalledProject(async ({ plugin, projectDir }) => {
    const sessionID = "ses_routinggate123456789012"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })

    const userMessage = {
      info: { id: "msg-routing-gate", role: "user", sessionID },
      parts: [
        {
          id: "part-routing-gate",
          type: "text",
          sessionID,
          messageID: "msg-routing-gate",
          text: "Implement the whole runtime delegation plan with tests and docs.",
        },
      ],
    }
    await plugin["experimental.chat.messages.transform"]({}, { messages: [userMessage] })

    const beforeRead = {
      args: {
        filePath: join(projectDir, "README.md"),
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "read" }, beforeRead)
    assert.notEqual(beforeRead.args.filePath, join(projectDir, "README.md"))

    await plugin["tool.execute.after"](
      { sessionID, tool: "skill", args: { name: "command-parity-router" } },
      { title: "Loaded skill", output: "loaded" },
    )

    const state = await readSessionState(projectDir, sessionID)
    assert.equal(state.routing.required, true)
    assert.equal(state.routing.satisfied, true)
    assert.equal(state.routing.skillLoaded, "command-parity-router")
  })
})

test("root analysis re-gates after merge budget is exhausted", async () => {
  await withInstalledProject(async ({ plugin, projectDir }) => {
    const sessionID = "ses_mergebudget12345678901"
    const childSessionID = "ses_mergebudgetchild1234567"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })

    const userMessage = {
      info: { id: "msg-merge-budget", role: "user", sessionID },
      parts: [
        {
          id: "part-merge-budget",
          type: "text",
          sessionID,
          messageID: "msg-merge-budget",
          text: "Implement the whole runtime delegation plan with tests.",
        },
      ],
    }
    await plugin["experimental.chat.messages.transform"]({}, { messages: [userMessage] })
    await plugin["tool.execute.after"](
      { sessionID, tool: "skill", args: { name: "command-parity-router" } },
      { title: "Loaded skill", output: "loaded" },
    )

    const beforeTask = {
      args: {
        description: "Analyze runtime files",
        prompt: "Review runtime plugin scope",
        subagent_type: "codebase-analyzer",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, beforeTask)
    await plugin["tool.execute.after"](
      { sessionID, tool: "task", args: beforeTask.args },
      { title: "Spawn child", output: `done ${childSessionID}` },
    )

    const blockedRead = { args: { filePath: join(projectDir, "README.md") } }
    await plugin["tool.execute.before"]({ sessionID, tool: "read" }, blockedRead)
    assert.notEqual(blockedRead.args.filePath, join(projectDir, "README.md"))
    await plugin["tool.execute.after"](
      { sessionID, tool: "read", args: blockedRead.args },
      { title: "Read file", output: "ok" },
    )

    const state = await readSessionState(projectDir, sessionID)
    assert.equal(state.delegation.taskCount, 1)
    assert.equal(state.delegation.cycle, 1)
    assert.equal(state.delegation.mergeBudgetRemaining, 0)
    assert.equal(state.delegation.satisfied, false)
  })
})

test("root mutating tools remain gated after delegated coding work", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_rootmutategate123456789"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })
    await plugin["experimental.chat.messages.transform"]({}, {
      messages: [{
        info: { id: "msg-root-mutate", role: "user", sessionID },
        parts: [{ id: "part-root-mutate", type: "text", sessionID, messageID: "msg-root-mutate", text: "Implement the whole runtime delegation plan with tests." }],
      }],
    })
    await plugin["tool.execute.after"](
      { sessionID, tool: "skill", args: { name: "command-parity-router" } },
      { title: "Loaded skill", output: "loaded" },
    )
    const beforeTask = {
      args: {
        description: "Implement the runtime fix",
        prompt: "Implement the requested change and validate it",
        subagent_type: "code-implementer",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, beforeTask)
    await plugin["tool.execute.after"](
      { sessionID, tool: "task", args: beforeTask.args },
      { title: "Spawn child", output: "done ses_mutatingchild123456789" },
    )

    const beforeBash = { args: { command: "npm install", description: "Installs dependencies" } }
    await plugin["tool.execute.before"]({ sessionID, tool: "bash" }, beforeBash)
    assert.equal(beforeBash.args.command, "true")
    assert.equal(beforeBash.args.description, "No-op due to delegation gate")
  })
})

test("root output strips continue prompts once routing is required", async () => {
  await withInstalledProject(async ({ plugin }) => {
    const sessionID = "ses_no_continue1234567890123"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })
    await plugin["experimental.chat.messages.transform"]({}, {
      messages: [{
        info: { id: "msg-no-continue", role: "user", sessionID },
        parts: [{ id: "part-no-continue", type: "text", sessionID, messageID: "msg-no-continue", text: "Implement the whole runtime delegation plan with tests." }],
      }],
    })
    const output = { text: "I found the issue. If you want, send `continue` and I will finish the rest." }
    await plugin["experimental.text.complete"]({ sessionID }, output)
    assert.doesNotMatch(output.text, /send `continue`/i)
  })
})

test("index fallback is tracked without noisy injected boilerplate", async () => {
  await withInstalledProject(async ({ plugin, projectDir }) => {
    const sessionID = "ses_kbwording1234567890123"
    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })
    await plugin["experimental.chat.messages.transform"]({}, {
      messages: [{
        info: { id: "msg-kb-wording", role: "user", sessionID },
        parts: [{ id: "part-kb-wording", type: "text", sessionID, messageID: "msg-kb-wording", text: "Implement the whole runtime delegation plan with tests." }],
      }],
    })
    await plugin["tool.execute.after"](
      { sessionID, tool: "skill", args: { name: "command-parity-router" } },
      { title: "Loaded skill", output: "ok" },
    )
    await plugin["tool.execute.after"](
      { sessionID, tool: "read", args: { filePath: "/tmp/project/ai-kb/rules/INDEX.md" } },
      { title: "Read kb index", output: "ok" },
    )
    const state = await readSessionState(projectDir, sessionID)
    assert.equal(state.kb.discoveryMode, "index")
    assert.match(state.kb.fallbackReason, /ck not observed in runtime evidence/i)
    const output = { text: "Runtime summary." }
    await plugin["experimental.text.complete"]({ sessionID }, output)
    assert.equal(output.text, "Runtime summary.")
  })
})

test("task dispatch satisfies the current delegation gate", async () => {
  await withInstalledProject(async ({ plugin, projectDir }) => {
    const sessionID = "ses_tasksatisfy123456789012"
    const childSessionID = "ses_childsatisfy12345678901"

    await plugin["experimental.chat.system.transform"]({ sessionID }, { system: [] })

    const userMessage = {
      info: { id: "msg-task-satisfy", role: "user", sessionID },
      parts: [
        {
          id: "part-task-satisfy",
          type: "text",
          sessionID,
          messageID: "msg-task-satisfy",
          text: "Implement the whole runtime delegation plan with tests.",
        },
      ],
    }
    await plugin["experimental.chat.messages.transform"]({}, { messages: [userMessage] })

    const beforeTask = {
      args: {
        description: "Analyze runtime files",
        prompt: "Review runtime plugin scope",
        subagent_type: "codebase-analyzer",
      },
    }
    await plugin["tool.execute.before"]({ sessionID, tool: "task" }, beforeTask)
    await plugin["tool.execute.after"](
      { sessionID, tool: "task", args: beforeTask.args },
      { title: "Spawn child", output: `done ${childSessionID}` },
    )

    const state = await readSessionState(projectDir, sessionID)
    assert.equal(state.delegation.satisfied, true)
    assert.equal(state.delegation.taskCount, 1)
    assert.equal(state.delegation.blockedToolCount, 0)
  })
})
