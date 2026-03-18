import assert from "node:assert/strict"
import { realpathSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import { spawn } from "node:child_process"
import test from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url))
const PYTHON = process.platform === "win32" ? "python" : "python3"

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

function assertPortableOpencodeCkEntry(config) {
  assert.equal(config.mcp?.ck?.type, "local")
  assert.equal(Array.isArray(config.mcp?.ck?.command), true)
  assert.equal(config.mcp.ck.command[0], "bash")
  assert.equal(config.mcp.ck.command[1], "-lc")
  assert.equal(config.mcp.ck.command.some((value) => String(value).includes("/Users/iamironz")), false)
  assert.equal(config.mcp.ck.command.some((value) => String(value).includes('.config/opencode/ai-kb')), true)
}

function assertRuntimeExternalDirectoryAllow(config) {
  assert.equal(config.permission?.external_directory, "allow")
}

test("payload includes the autonomy runtime bundle", async () => {
  const requiredFiles = [
    "payload/.config/opencode/prime-directive.md",
    "payload/.config/opencode/runtime/bootstrap.md",
    "payload/.config/opencode/runtime/autonomy-runtime.jsonc",
    "payload/.config/opencode/plugins/autonomy-runtime.js",
    "payload/.config/opencode/plugins/lib/runtime-grounding.js",
    "payload/.config/opencode/skills/command-parity-router/SKILL.md",
    "payload/.config/opencode/agent/evidence-curator.md",
    "payload/.config/opencode/agent/fallback-analyzer.md",
    "payload/.config/opencode/agent/supervisor.md",
    "payload/.config/opencode/scripts/bootstrap-project-runtime.mjs",
    "payload/.config/opencode/memory/templates/project/.opencode/checkpoints/latest.json",
    "payload/.config/opencode/memory/templates/project/.opencode/memory/current.md",
    "payload/.config/opencode/overlays/default.jsonc",
    "payload/ai-kb/rules/skill-routing.md",
    "payload/ai-kb/rules/plugin-safety.md",
    "payload/ai-kb/rules/delegation-depth.md",
  ]

  await Promise.all(
    requiredFiles.map(async (relativePath) => {
      const text = await readFile(join(REPO_ROOT, relativePath), "utf8")
      assert.ok(text.length > 0, `${relativePath} should not be empty`)
    }),
  )

  await Promise.all([
    "ai-kb/agents/build.md",
    "ai-kb/agents/plan.md",
    "ai-kb/agents/explore.md",
    "ai-kb/agents/summary.md",
    "ai-kb/agents/compaction.md",
    "ai-kb/agents/title.md",
  ].map(async (relativePath) => {
    const text = await readFile(join(REPO_ROOT, relativePath), "utf8")
    assert.ok(text.length > 0, `${relativePath} should exist as primary agent source`)
  }))

  const config = JSON.parse(
    await readFile(join(REPO_ROOT, "payload/.config/opencode/opencode.json"), "utf8"),
  )
  assert.equal(config.default_agent, "plan")
  assert.equal(config.permission?.task, "allow")
  assert.equal(config.permission?.doom_loop, "allow")
  assertRuntimeExternalDirectoryAllow(config)
  assert.deepEqual(config.tools, { "*": true })
  assertPortableOpencodeCkEntry(config)
  assert.deepEqual(config.plugin, [
    "~/.config/opencode/plugins/autonomy-runtime.js",
    "~/.config/opencode/plugins/kb-post-turn-analyzer.js",
  ])

  const cursorMcp = JSON.parse(
    await readFile(join(REPO_ROOT, "payload/.cursor/mcp.json"), "utf8"),
  )
  assert.equal(cursorMcp.mcpServers?.ck?.command, "bash")
  assert.equal(Array.isArray(cursorMcp.mcpServers?.ck?.args), true)
  assert.equal(
    cursorMcp.mcpServers.ck.args.some((value) => String(value).includes("/Users/iamironz")),
    false,
  )
  assert.equal(
    cursorMcp.mcpServers.ck.args.some((value) => String(value).includes('.config/opencode/ai-kb')),
    true,
  )
})

test("subagents inherit global all-tools posture", async () => {
  const kbAgents = [
    "payload/.config/opencode/agent/codebase-analyzer.md",
    "payload/.config/opencode/agent/code-reviewer.md",
    "payload/.config/opencode/agent/spec-reviewer.md",
    "payload/.config/opencode/agent/codebase-pattern-finder.md",
    "payload/.config/opencode/agent/thoughts-analyzer.md",
    "payload/.config/opencode/agent/thoughts-locator.md",
    "payload/.config/opencode/agent/web-search-researcher.md",
  ]

  await Promise.all(
    kbAgents.map(async (relativePath) => {
      const text = await readFile(join(REPO_ROOT, relativePath), "utf8")
      assert.doesNotMatch(text, /^tools:$/m, `${relativePath} should not carry a restrictive tools block`)
    }),
  )
})

test("home install writes the runtime bundle under the target home", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-home-runtime-"))
  const targetHome = join(tempRoot, "home")

  try {
    await mkdir(targetHome, { recursive: true })
    await run(PYTHON, ["install_bundle.py", "--target-home", targetHome])
    const resolvedTargetHome = realpathSync(targetHome)

    const installedConfig = JSON.parse(
      await readFile(join(targetHome, ".config/opencode/opencode.json"), "utf8"),
    )
    assert.equal(installedConfig.default_agent, "plan")
    assert.equal(installedConfig.permission?.task, "allow")
    assert.equal(installedConfig.permission?.doom_loop, "allow")
    assertRuntimeExternalDirectoryAllow(installedConfig)
    assert.deepEqual(installedConfig.tools, { "*": true })
    assertPortableOpencodeCkEntry(installedConfig)
    assert.deepEqual(installedConfig.plugin, [
      `${resolvedTargetHome}/.config/opencode/plugins/autonomy-runtime.js`,
      `${resolvedTargetHome}/.config/opencode/plugins/kb-post-turn-analyzer.js`,
    ])

    const requiredInstalledFiles = [
      ".config/opencode/prime-directive.md",
      ".config/opencode/runtime/bootstrap.md",
      ".config/opencode/plugins/autonomy-runtime.js",
      ".config/opencode/memory/templates/project/.opencode/checkpoints/latest.json",
      "ai-kb/rules/skill-routing.md",
      "ai-kb/rules/plugin-safety.md",
      "ai-kb/rules/delegation-depth.md",
    ]

    await Promise.all(
      requiredInstalledFiles.map(async (relativePath) => {
        const text = await readFile(join(targetHome, relativePath), "utf8")
        assert.ok(text.length > 0, `${relativePath} should exist after home install`)
      }),
    )

    const homeKbAgent = await readFile(join(targetHome, ".config/opencode/agents/codebase-analyzer.md"), "utf8")
    assert.ok(homeKbAgent.includes(`${resolvedTargetHome}/.config/opencode/ai-kb/AGENTS.md`))
    assert.doesNotMatch(homeKbAgent, /~\/ai-kb\/AGENTS\.md/)

    const mirroredKbAgents = await readFile(join(targetHome, ".config/opencode/ai-kb/AGENTS.md"), "utf8")
    assert.ok(mirroredKbAgents.length > 0)

    const installedCursorMcp = JSON.parse(
      await readFile(join(targetHome, ".cursor/mcp.json"), "utf8"),
    )
    assert.equal(installedCursorMcp.mcpServers?.ck?.command, "bash")
    assert.equal(Array.isArray(installedCursorMcp.mcpServers?.ck?.args), true)
    assert.equal(
      installedCursorMcp.mcpServers.ck.args.some((value) => String(value).includes("/Users/iamironz")),
      false,
    )
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test("project install writes a repo-local runtime-aware opencode config", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-project-runtime-"))
  const projectDir = join(tempRoot, "project")

  try {
    await mkdir(projectDir, { recursive: true })
    await run(PYTHON, ["install_bundle.py", "--project-dir", projectDir])

    const installedConfig = JSON.parse(await readFile(join(projectDir, "opencode.json"), "utf8"))
    assert.equal(installedConfig.default_agent, "plan")
    assert.equal(installedConfig.permission?.task, "allow")
    assert.equal(installedConfig.permission?.doom_loop, "allow")
    assertRuntimeExternalDirectoryAllow(installedConfig)
    assert.deepEqual(installedConfig.tools, { "*": true })
    assertPortableOpencodeCkEntry(installedConfig)
    assert.ok(installedConfig.instructions.includes(".opencode/prime-directive.md"))
    assert.ok(installedConfig.instructions.includes(".opencode/runtime/bootstrap.md"))
    assert.equal(Array.isArray(installedConfig.plugin), true)
    assert.equal(installedConfig.plugin.length, 2)
    assert.equal(installedConfig.plugin.every((value) => String(value).startsWith("file://")), true)
    assert.equal(
      installedConfig.plugin.some((value) => String(value).endsWith("/.opencode/plugins/autonomy-runtime.js")),
      true,
    )
    assert.equal(
      installedConfig.plugin.some((value) => String(value).endsWith("/.opencode/plugins/kb-post-turn-analyzer.js")),
      true,
    )

    const requiredInstalledFiles = [
      ".opencode/AGENTS.md",
      ".opencode/prime-directive.md",
      ".opencode/runtime/bootstrap.md",
      ".opencode/runtime/autonomy-runtime.jsonc",
      ".opencode/plugins/autonomy-runtime.js",
      ".opencode/plugins/lib/runtime-grounding.js",
      ".opencode/skills/command-parity-router/SKILL.md",
      ".opencode/agents/evidence-curator.md",
      ".opencode/checkpoints/latest.json",
      ".opencode/memory/current.md",
      ".opencode/overlays.jsonc",
      ".opencode/scripts/bootstrap-project-runtime.mjs",
      "ai-kb/rules/skill-routing.md",
      "ai-kb/rules/plugin-safety.md",
      "ai-kb/rules/delegation-depth.md",
    ]

    await Promise.all(
      requiredInstalledFiles.map(async (relativePath) => {
        const text = await readFile(join(projectDir, relativePath), "utf8")
        assert.ok(text.length > 0, `${relativePath} should exist after install`)
      }),
    )

    const projectKbAgent = await readFile(join(projectDir, ".opencode/agents/codebase-analyzer.md"), "utf8")
    assert.match(projectKbAgent, /ai-kb\/AGENTS\.md/)
    assert.doesNotMatch(projectKbAgent, /~\/ai-kb\/AGENTS\.md/)
    assert.doesNotMatch(projectKbAgent, /~\/\.config\/opencode\/ai-kb\/AGENTS\.md/)

    const gitignore = await readFile(join(projectDir, ".gitignore"), "utf8")
    assert.match(gitignore, /\.opencode\/checkpoints\//)

    const installedCursorMcp = JSON.parse(
      await readFile(join(projectDir, ".cursor/mcp.json"), "utf8"),
    )
    assert.equal(installedCursorMcp.mcpServers?.ck?.command, "bash")
    assert.equal(Array.isArray(installedCursorMcp.mcpServers?.ck?.args), true)
    assert.equal(
      installedCursorMcp.mcpServers.ck.args.some((value) => String(value).includes("/Users/iamironz")),
      false,
    )

    const { AutonomyRuntimePlugin } = await import(
      pathToFileURL(join(projectDir, ".opencode/plugins/autonomy-runtime.js")).href
    )
    const plugin = await AutonomyRuntimePlugin({ directory: projectDir })
    const output = { system: [] }
    await plugin["experimental.chat.system.transform"]({ sessionID: "session-runtime" }, output)

    const runtimeContext = output.system.find((entry) =>
      typeof entry === "string" && entry.includes("<runtime_context>"),
    )

    assert.ok(runtimeContext, "expected runtime context injection from autonomy plugin")
    assert.match(runtimeContext, /Subagent contract: stay orchestration-first/)
    assert.match(runtimeContext, /Parallelism: launch independent lanes in parallel/)
    assert.match(runtimeContext, /answer exactly: \.opencode\/memory/)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test("home install normalizes legacy OpenCode ck paths", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-home-runtime-upgrade-"))
  const targetHome = join(tempRoot, "home")

  try {
    await mkdir(join(targetHome, ".config/opencode"), { recursive: true })
    await writeFile(
      join(targetHome, ".config/opencode/opencode.json"),
      JSON.stringify(
        {
          permission: {
            external_directory: {
              "~/.config/opencode": "allow",
              "~/ai-kb": "allow",
            },
          },
          mcp: {
            ck: {
              type: "local",
              command: ["bash", "-lc", "exec /Users/iamironz/.local/bin/ck --serve"],
              enabled: true,
              timeout: 15000,
            },
          },
        },
        null,
        2,
      ) + "\n",
    )

    await run(PYTHON, ["install_bundle.py", "--target-home", targetHome])

    const installedConfig = JSON.parse(
      await readFile(join(targetHome, ".config/opencode/opencode.json"), "utf8"),
    )
    assertPortableOpencodeCkEntry(installedConfig)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test("project install preserves existing config posture while adding subagent-critical tools", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-project-runtime-merge-"))
  const projectDir = join(tempRoot, "project")

  try {
    await mkdir(projectDir, { recursive: true })
    await writeFile(
      join(projectDir, "opencode.json"),
      JSON.stringify(
        {
          instructions: ["custom.md"],
          permission: { edit: "ask" },
          tools: { bash: false },
        },
        null,
        2,
      ) + "\n",
    )

    await run(PYTHON, ["install_bundle.py", "--project-dir", projectDir])

    const installedConfig = JSON.parse(await readFile(join(projectDir, "opencode.json"), "utf8"))
    assert.equal(installedConfig.permission?.edit, "allow")
    assert.equal(installedConfig.permission?.task, "allow")
    assert.equal(installedConfig.permission?.skill, "allow")
    assert.equal(installedConfig.permission?.question, "allow")
    assert.equal(installedConfig.permission?.bash, "allow")
    assert.equal(installedConfig.permission?.webfetch, "allow")
    assert.equal(installedConfig.permission?.doom_loop, "allow")
    assert.equal(installedConfig.permission?.edit, "allow")
    assertRuntimeExternalDirectoryAllow(installedConfig)

    assert.deepEqual(installedConfig.tools, { "*": true })
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test("reinstall normalizes runtime-owned agent prompts in existing config", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-agent-prompt-normalize-"))
  const projectDir = join(tempRoot, "project")

  try {
    await mkdir(projectDir, { recursive: true })
    await writeFile(
      join(projectDir, "opencode.json"),
      JSON.stringify(
        {
          agent: {
            general: {
              prompt: "old prompt",
            },
            build: {
              prompt: "old build prompt",
            },
          },
          default_agent: "general",
        },
        null,
        2,
      ) + "\n",
    )

    await run(PYTHON, ["install_bundle.py", "--project-dir", projectDir])

    const installedConfig = JSON.parse(await readFile(join(projectDir, "opencode.json"), "utf8"))
    assert.match(installedConfig.agent.plan.prompt, /For every substantive task, first load `command-parity-router`/);
    assert.match(installedConfig.agent.plan.prompt, /offload implementation, analysis, research, review, and exploration to background or parallel specialist `task` lanes/);
    assert.match(installedConfig.agent.build.prompt, /Stay orchestration-first even in the build lane/)
    assert.match(installedConfig.agent.build.prompt, /Prefer dispatching `code-implementer` for actual implementation work/)
    assert.match(installedConfig.agent.build.prompt, /redelegate unresolved work instead of continuing broad implementation on the root lane or asking the user to continue/)
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})

test("project install normalizes legacy plugin and Cursor ck paths", async () => {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "bundle-project-runtime-upgrade-"))
  const projectDir = join(tempRoot, "project")

  try {
    await mkdir(join(projectDir, ".cursor"), { recursive: true })
    await writeFile(
      join(projectDir, "opencode.json"),
      JSON.stringify(
        {
          permission: {
            external_directory: {
              "~/.config/opencode": "allow",
              "~/ai-kb": "allow",
            },
          },
          plugin: [
            "~/.config/opencode/plugins/autonomy-runtime.js",
            ".opencode/plugins/kb-post-turn-analyzer.js",
          ],
          mcp: {
            ck: {
              type: "local",
              command: ["bash", "-lc", "exec /Users/iamironz/.local/bin/ck --serve"],
              enabled: true,
              timeout: 15000,
            },
          },
        },
        null,
        2,
      ) + "\n",
    )
    await writeFile(
      join(projectDir, ".cursor/mcp.json"),
      JSON.stringify(
        {
          mcpServers: {
            ck: {
              type: "stdio",
              command: "/Users/iamironz/.local/bin/ck-mcp",
            },
          },
        },
        null,
        2,
      ) + "\n",
    )

    await run(PYTHON, ["install_bundle.py", "--project-dir", projectDir])

    const installedConfig = JSON.parse(await readFile(join(projectDir, "opencode.json"), "utf8"))
    assertPortableOpencodeCkEntry(installedConfig)
    assertRuntimeExternalDirectoryAllow(installedConfig)
    assert.equal(installedConfig.plugin.length, 2)
    assert.equal(installedConfig.plugin.every((value) => String(value).startsWith("file://")), true)
    assert.equal(
      installedConfig.plugin.some((value) => String(value).includes("~/.config/opencode/plugins/autonomy-runtime.js")),
      false,
    )
    assert.equal(
      installedConfig.plugin.some((value) => String(value).includes(".opencode/plugins/kb-post-turn-analyzer.js") && !String(value).startsWith("file://")),
      false,
    )

    const installedCursorMcp = JSON.parse(
      await readFile(join(projectDir, ".cursor/mcp.json"), "utf8"),
    )
    assert.equal(installedCursorMcp.mcpServers?.ck?.command, "bash")
    assert.equal(Array.isArray(installedCursorMcp.mcpServers?.ck?.args), true)
    assert.equal(
      installedCursorMcp.mcpServers.ck.args.some((value) => String(value).includes("/Users/iamironz")),
      false,
    )
  } finally {
    await rm(tempRoot, { recursive: true, force: true })
  }
})
