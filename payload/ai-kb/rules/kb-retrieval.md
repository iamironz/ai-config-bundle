# KB Retrieval (ck-first)

Use ck (BeaconBay/ck) as the primary retrieval mechanism for this KB. The goal is to avoid
manually scanning or preloading large parts of `~/ai-kb/`.

## Requirements

- Prefer ck MCP server `ck` for discovery (semantic/hybrid/regex).
- Keep results high-signal: use a high relevance threshold and only follow up on the top matches.
- Prefer using ck snippets first; read full KB docs only when snippets are insufficient.
- Use `<rule_context>` to prove what you loaded and what you enforce.

## Enforcement Contract (Mandatory)

- ck-first is mandatory, not optional.
- Before loading KB docs, run at least two ck searches:
  - one intent-level query
  - one keyword-refined query based on extracted task terms
- Manual fallback (`rules/INDEX.md` table scan) is allowed only if ck is unavailable or failing.
- If fallback is used, explicitly record the ck failure reason in `<rule_context>`.
- If ck is available, do not start with manual directory/index scanning.

## Search Strategy

All ck search tools require a **`path`** parameter. Use `path: "."` to search the entire KB
(ck is started with its working directory set to `ai-kb/`).

- Use `semantic_search` for concepts (best default for KB discovery).
- Use `hybrid_search` when you have both concept + specific keywords.
- Use `regex_search` for exact strings, filenames, headings, or tables (e.g., `Subdocuments`).
- Use `lexical_search` for keyword matching when you know specific terms.

Recommended strict defaults (tune by refining queries, not by lowering threshold):

- `semantic_search`: `path: "."`, `top_k` 10-20, `threshold` 0.8, `snippet_length` ~200.
- If you need more local context, increase `snippet_length` (e.g., 300-600) before reading full files.
- `hybrid_search`: `path: "."`, `threshold` ~0.02 (RRF scale), `top_k` 10-25.
- `regex_search`: `path: "."`, keep patterns narrow to avoid noisy results.
- `lexical_search`: `path: "."`, useful when semantic misses exact terminology.

## Discovery Loop (Aggressive, High-Signal)

Treat ck discovery with the same aggressiveness as the fallback `rules/INDEX.md` workflow:

1. Extract 4-10 keywords from the user request (domain, symbols, artifacts, errors).
2. Run `semantic_search` (threshold stays high) on the user's intent.
3. Run a second query with refined keywords (semantic or hybrid).
4. Use `hybrid_search` to require both meaning + keywords when you know specific terms.
5. Use `regex_search` to locate:
   - entrypoints (`AGENTS.md`, `rules/INDEX.md`, `commands/INDEX.md`)
   - headings like `Subdocuments`
   - exact domain terms (android, ios, kotlin, security, etc.)

Avoid "low-threshold fishing" for KB retrieval. If you must lower the semantic threshold, do it as a last resort and keep it >= 0.7.

## Keyword Index Usage (Example)

Instead of reading KB structure docs end-to-end:

- Use `regex_search` on `rules/INDEX.md` for domain keywords if you need a deterministic fallback.
- Use `regex_search` for `Subdocuments` inside a Level 1 rule to locate relevant Level 2 subdocs.
- Use `semantic_search` directly across the KB for the user’s intent (preferred).

## Prohibited Retrieval Patterns

- Reading `rules/INDEX.md` first when ck is available.
- Manually scanning large portions of `~/ai-kb/rules/**` before ck discovery.
- Loading many full docs without first checking ck snippets/top matches.
- Falling back to index flow without documenting why ck could not be used.

## `<rule_context>` Evidence Requirements

Include these fields in `<rule_context>` for every non-trivial task:

- `Matched keywords` (derived from user request)
- `CK status` (`available` or `unavailable` with reason)
- `CK queries` (the exact query strings used)
- `CK-selected docs` (paths selected from search results)
- `Loaded` and `Enforcing` (as required by `AGENTS.md`)

## Concrete Example

User asks: "How should I handle Compose recomposition?"

```
1. semantic_search(path=".", query="Compose recomposition side effects", top_k=10, threshold=0.8)
   → finds rules/android/compose.md (score 0.85)

2. Read the snippet; if it references a Subdocuments table, follow up:
   regex_search(path=".", query="Subdocuments", include_patterns=["rules/android/compose.md"])

3. Load full file only if snippet is insufficient:
   Read rules/android/compose.md

4. Cross-cut: also load architecture.md, code-quality.md, error-handling.md
   (use semantic_search or read directly — they are always-load rules).
```

## Available ck Tools

| Tool | Use for |
|------|---------|
| `semantic_search` | Concept/meaning-based discovery (primary) |
| `hybrid_search` | Combined semantic + keyword matching |
| `lexical_search` | Keyword/term matching |
| `regex_search` | Exact strings, headings, filenames |
| `reindex` | Force re-index after bulk KB edits |
| `index_status` | Check index health and file/chunk counts |
| `health_check` | Verify ck server is running |

All search/index tools require `path` (use `"."` for the full KB).

## Index Freshness (Automatic Delta Indexing)

ck automatically keeps its index up to date by detecting file changes via hashing and updating
only changed content during semantic/hybrid searches.

- There is no documented built-in file-watcher/daemon mode for continuous background reindexing.
- If you need a hard refresh after bulk edits, use `reindex` (MCP) or `ck --clean && ck --index` (CLI).
