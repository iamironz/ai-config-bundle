import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import os from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath, pathToFileURL } from "node:url"

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url))
const SOURCE_PLUGIN = join(
  REPO_ROOT,
  "payload/.config/opencode/plugins/kb-post-turn-analyzer.js",
)

function makeAnalysis(recommendations) {
  return {
    should_recommend: true,
    confidence: "high",
    conversation_summary: "Regression fixture",
    recommendations,
    index_updates: [],
  }
}

function makeClient(analysis) {
  return {
    session: {
      create: async () => ({ data: { id: "internal-analysis-session" } }),
      prompt: async () => ({ data: { info: { structured_output: analysis } } }),
      delete: async () => ({}),
    },
  }
}

function makeRecommendation(suggestedContent, targetPath = "~/ai-kb/rules/example.md") {
  return {
    action: "update_existing",
    target_path: targetPath,
    reason: "Keep complete context available for KB curation.",
    suggested_content: suggestedContent,
    link_commands: ["~/ai-kb/commands/implement_tests.md"],
  }
}

async function runAnalyzerWithAnalysis(analysis) {
  const tempRoot = await mkdtemp(join(os.tmpdir(), "kb-analyzer-test-"))
  const projectDir = join(tempRoot, "project")
  const moduleDir = join(tempRoot, "module")
  await mkdir(projectDir, { recursive: true })
  await mkdir(join(projectDir, ".opencode"), { recursive: true })
  await mkdir(moduleDir, { recursive: true })

  const modulePath = join(moduleDir, "kb-post-turn-analyzer.mjs")
  const source = await readFile(SOURCE_PLUGIN, "utf8")
  await writeFile(modulePath, source, "utf8")

  const imported = await import(pathToFileURL(modulePath).href)
  const { KbPostTurnAnalyzer } = imported
  const plugin = await KbPostTurnAnalyzer({
    directory: projectDir,
    client: makeClient(analysis),
  })

  await plugin["experimental.session.compacting"](
    {
      session_id: "session-regression",
      generation_id: "generation-regression",
      role: "user",
      text: "x".repeat(1200),
    },
    {
      role: "assistant",
      text: "y".repeat(1200),
    },
  )

  const outDir = join(projectDir, ".opencode", "kb-recommendations")
  const markdownFiles = (await readdir(outDir)).filter((name) => name.endsWith(".md")).sort()
  const mainName = markdownFiles.find((name) => /^\d{8}-\d{6}-/.test(name))

  assert.ok(mainName, "expected recommendation markdown output file")

  const mainPath = join(outDir, mainName)
  const mainMarkdown = await readFile(mainPath, "utf8")
  const blobNames = markdownFiles.filter((name) => name !== mainName)
  const blobs = {}
  for (const name of blobNames) {
    blobs[name] = await readFile(join(outDir, name), "utf8")
  }

  return {
    outDir,
    mainName,
    mainMarkdown,
    blobNames,
    blobs,
  }
}

test("preserves long suggested content in external blob file", async () => {
  const longContent = "LONG-CONTEXT:" + "A".repeat(20000)
  const analysis = makeAnalysis([makeRecommendation(longContent)])

  const artifacts = await runAnalyzerWithAnalysis(analysis)

  assert.ok(
    artifacts.blobNames.length >= 1,
    "expected at least one external markdown blob file for long content",
  )
  const hasFullLongContent = Object.values(artifacts.blobs).some((content) => content.includes(longContent))
  assert.equal(hasFullLongContent, true, "expected external blob to contain full long content")
})

test("main markdown links concisely to externalized content instead of inlining", async () => {
  const longContent = "INLINE-AVOID:" + "B".repeat(12000)
  const analysis = makeAnalysis([makeRecommendation(longContent)])

  const artifacts = await runAnalyzerWithAnalysis(analysis)

  assert.ok(
    artifacts.blobNames.length >= 1,
    "expected externalized files to be present for large markdown sections",
  )
  assert.equal(
    artifacts.mainMarkdown.includes(longContent),
    false,
    "expected main markdown not to inline large suggested content",
  )

  const references = artifacts.blobNames.filter((name) => artifacts.mainMarkdown.includes(name))
  assert.equal(references.length, artifacts.blobNames.length, "expected main markdown to reference every blob")

  const referenceLines = artifacts.mainMarkdown
    .split("\n")
    .filter((line) => artifacts.blobNames.some((name) => line.includes(name)))
  assert.ok(referenceLines.length >= 1, "expected concise reference lines for externalized sections")
  assert.equal(
    referenceLines.every((line) => line.length <= 240),
    true,
    "expected blob references to remain concise",
  )
})

test("externalized fenced code content is byte-preserved", async () => {
  const fencedContent = [
    "```yaml",
    "services:",
    "  caddy:",
    "    image: caddy:2.9.1",
    "    command: |",
    "      echo \"hello\"",
    "      printf '%s\\n' \"$PATH\"",
    "```",
    "",
    "Post-fence explanation line.",
  ].join("\n")

  const analysis = makeAnalysis([makeRecommendation(fencedContent)])
  const artifacts = await runAnalyzerWithAnalysis(analysis)

  assert.ok(artifacts.blobNames.length >= 1, "expected fenced content to be externalized")

  const exactMatchBlob = Object.values(artifacts.blobs).find((content) => content === fencedContent)
  assert.ok(exactMatchBlob, "expected one externalized blob to preserve fenced code bytes exactly")
})

test("creates deterministic multiple references for multiple large sections", async () => {
  const largeSectionOne = "SECTION-ONE:" + "C".repeat(9000)
  const largeSectionTwo = "SECTION-TWO:" + "D".repeat(9000)
  const analysis = makeAnalysis([
    makeRecommendation(largeSectionOne, "~/ai-kb/rules/first.md"),
    makeRecommendation(largeSectionTwo, "~/ai-kb/rules/second.md"),
  ])

  const artifacts = await runAnalyzerWithAnalysis(analysis)

  assert.ok(artifacts.blobNames.length >= 2, "expected one externalized blob per large section")

  const blobForFirst = Object.entries(artifacts.blobs).find(([, content]) => content.includes(largeSectionOne))?.[0]
  const blobForSecond = Object.entries(artifacts.blobs).find(([, content]) => content.includes(largeSectionTwo))?.[0]

  assert.ok(blobForFirst, "expected first large section to map to an external blob")
  assert.ok(blobForSecond, "expected second large section to map to an external blob")
  assert.notEqual(blobForFirst, blobForSecond, "expected separate blobs per section")

  const firstRefPos = artifacts.mainMarkdown.indexOf(blobForFirst)
  const secondRefPos = artifacts.mainMarkdown.indexOf(blobForSecond)
  assert.ok(firstRefPos >= 0, "expected first blob reference in main markdown")
  assert.ok(secondRefPos >= 0, "expected second blob reference in main markdown")
  assert.ok(firstRefPos < secondRefPos, "expected deterministic reference order matching recommendation order")
})
