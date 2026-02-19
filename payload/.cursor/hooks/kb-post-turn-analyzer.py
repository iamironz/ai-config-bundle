#!/usr/bin/env python3
from __future__ import annotations
import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

MAX_HISTORY_CHARS = int(os.environ.get("AI_KB_MAX_HISTORY_CHARS", "120000"))
MIN_HISTORY_CHARS = int(os.environ.get("AI_KB_MIN_HISTORY_CHARS", "800"))
ANALYZER_TIMEOUT_SEC = int(os.environ.get("AI_KB_ANALYZER_TIMEOUT_SEC", "45"))
SCAN_LIMIT = int(os.environ.get("AI_KB_RECOMMENDATION_SCAN_LIMIT", "300"))

# Prevent recursion when this hook spawns `agent` for analysis.
#
# `agent` itself can run hooks; we set this env var for the analyzer subprocess so any nested
# invocations of this hook become a no-op (fail-open).
SENTINEL_ENV_KEY = "AI_KB_ANALYZER_INTERNAL"


def _respond() -> None:
    sys.stdout.write("{}")


def _slug(value: str, fallback: str) -> str:
    safe = re.sub(r"[^a-zA-Z0-9._-]+", "-", (value or "").strip())
    safe = safe.strip("-")
    return safe or fallback


def _workspace_root(payload: dict[str, Any]) -> Path:
    workspace_roots = payload.get("workspace_roots")
    if (
        isinstance(workspace_roots, list)
        and workspace_roots
        and isinstance(workspace_roots[0], str)
    ):
        return Path(workspace_roots[0] or ".")
    return Path(".")


def _read_transcript(payload: dict[str, Any]) -> str:
    raw_path = payload.get("transcript_path")
    if not isinstance(raw_path, str) or not raw_path.strip():
        return ""

    path = Path(raw_path.strip())
    if not path.exists() or not path.is_file():
        return ""

    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""

    if len(text) > MAX_HISTORY_CHARS:
        return text[-MAX_HISTORY_CHARS:]
    return text


def _slice_since_last_compaction(history_text: str) -> str:
    patterns = [
        re.compile(r"session\.compacted", flags=re.IGNORECASE),
        re.compile(r"\bprecompact\b", flags=re.IGNORECASE),
        re.compile(r"\bcompaction\b", flags=re.IGNORECASE),
        re.compile(r"\bcompacted\b", flags=re.IGNORECASE),
    ]
    last_index = -1
    for pattern in patterns:
        for match in pattern.finditer(history_text):
            if match.start() > last_index:
                last_index = match.start()
    if last_index < 0:
        return history_text
    return history_text[last_index:]


def _analysis_prompt() -> str:
    return (
        "You are a senior KB curator.\n"
        "Analyze the history window pending compaction and identify durable knowledge "
        "that should be added to AI KB rules/commands.\n"
        "Use dialog-history reasoning, not single-turn observations.\n"
        "Return strict JSON only with this schema:\n"
        "{\n"
        '  "should_recommend": boolean,\n'
        '  "confidence": "low"|"medium"|"high",\n'
        '  "conversation_summary": string,\n'
        '  "recommendations": [\n'
        "    {\n"
        '      "action": "update_existing"|"create_new",\n'
        '      "target_path": string,\n'
        '      "reason": string,\n'
        '      "suggested_content": string,\n'
        '      "link_commands": [string]\n'
        "    }\n"
        "  ],\n"
        '  "index_updates": [\n'
        "    {\n"
        '      "index_path": "~/ai-kb/rules/INDEX.md",\n'
        '      "entry": string,\n'
        '      "reason": string\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Constraints:\n"
        "- target_path must be under ~/ai-kb/rules/ or ~/ai-kb/commands/\n"
        "- recommendations should be concise and non-duplicative\n"
        "- if no KB updates are needed, return should_recommend=false and empty arrays"
    )


def _find_analysis_object(value: Any) -> dict[str, Any] | None:
    if isinstance(value, dict):
        if isinstance(value.get("should_recommend"), bool) and isinstance(
            value.get("recommendations"), list
        ):
            return value
        for nested in value.values():
            found = _find_analysis_object(nested)
            if found:
                return found
    if isinstance(value, list):
        for nested in value:
            found = _find_analysis_object(nested)
            if found:
                return found
    return None


def _extract_first_json_object(text: str) -> dict[str, Any] | None:
    """Best-effort extraction of a JSON object embedded in plain text."""

    if "{" not in text:
        return None

    for match in re.finditer(r"\{", text):
        start = match.start()
        depth = 0
        in_string = False
        escaped = False
        for i in range(start, len(text)):
            ch = text[i]
            if in_string:
                if escaped:
                    escaped = False
                elif ch == "\\":
                    escaped = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start : i + 1]
                    try:
                        parsed = json.loads(candidate)
                    except Exception:
                        break
                    if isinstance(parsed, dict):
                        found = _find_analysis_object(parsed)
                        return found or parsed
                    break
        # Continue scanning for the next '{' if this one didn't parse.
    return None


def _extract_assistant_json(text: str) -> dict[str, Any] | None:
    if not text.strip():
        return None

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            found = _find_analysis_object(parsed)
            return found or parsed
    except Exception:
        pass

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
        except Exception:
            continue
        found = _find_analysis_object(parsed)
        if found:
            return found

    fenced = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", text, flags=re.IGNORECASE)
    if fenced:
        try:
            parsed = json.loads(fenced.group(1))
            if isinstance(parsed, dict):
                found = _find_analysis_object(parsed)
                return found or parsed
        except Exception:
            pass

    embedded = _extract_first_json_object(text)
    if embedded:
        return embedded
    return None


def _cursor_model() -> str:
    model = os.environ.get("AI_KB_CURSOR_MODEL", "").strip()
    if model:
        return model
    # Back-compat: if someone already set AI_KB_ANALYZER_MODEL to a Cursor model id
    # (e.g. "gpt-5.2"), accept it as long as it's not in provider/model form.
    model = os.environ.get("AI_KB_ANALYZER_MODEL", "").strip()
    if model and "/" not in model:
        return model
    return ""


def _run_ai_analyzer(history_text: str, workspace_root: Path) -> dict[str, Any] | None:
    agent_bin = shutil.which("agent")
    if not agent_bin:
        return None

    prompt = _analysis_prompt() + "\n\nHistory window:\n" + history_text

    command = [
        agent_bin,
        "--print",
        "--output-format",
        "text",
        "--mode",
        "ask",
        "--trust",
        "--workspace",
        str(workspace_root),
    ]

    model = _cursor_model()
    if model:
        command.extend(["--model", model])
    command.append(prompt)

    env = os.environ.copy()
    env[SENTINEL_ENV_KEY] = "1"

    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=ANALYZER_TIMEOUT_SEC,
            cwd=str(workspace_root),
            env=env,
        )
    except Exception:
        return None

    if completed.returncode != 0:
        return None

    parsed = _extract_assistant_json(completed.stdout)
    if parsed:
        return parsed
    return _extract_assistant_json(completed.stderr)


def _normalize_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).lower()


def _tokenize(value: str) -> set[str]:
    return set(re.findall(r"[a-z0-9_]{3,}", _normalize_text(value)))


def _coverage_ratio(base: str, candidate: str) -> float:
    base_tokens = _tokenize(base)
    candidate_tokens = _tokenize(candidate)
    if not base_tokens or not candidate_tokens:
        return 0.0
    intersection = base_tokens.intersection(candidate_tokens)
    return len(intersection) / max(1, len(candidate_tokens))


def _contains_or_similar(base: str, candidate: str) -> bool:
    base_norm = _normalize_text(base)
    candidate_norm = _normalize_text(candidate)
    if len(candidate_norm) >= 50 and candidate_norm in base_norm:
        return True
    return _coverage_ratio(base_norm, candidate_norm) >= 0.55


def _load_existing_recommendation_docs(out_dir: Path) -> list[str]:
    if not out_dir.exists() or not out_dir.is_dir():
        return []
    docs: list[str] = []
    files = sorted(out_dir.glob("*.md"), key=lambda item: item.stat().st_mtime)
    for item in files[-SCAN_LIMIT:]:
        try:
            docs.append(item.read_text(encoding="utf-8", errors="replace"))
        except Exception:
            continue
    return docs


def _read_kb_file(workspace_root: Path, path_text: str) -> str:
    """Read a KB file referenced by a recommendation/update path.

    Supports both project installs (`ai-kb/...`) and global installs (`~/ai-kb/...`).
    """

    relative = path_text.strip().replace("\\", "/")
    full: Path | None = None
    if relative.startswith("ai-kb/"):
        full = workspace_root / relative
    elif relative.startswith("~/ai-kb/"):
        full = Path.home() / relative[2:]
    else:
        return ""
    if not full.exists() or not full.is_file():
        return ""
    try:
        return full.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def _recommendation_already_covered(
    rec: dict[str, Any], workspace_root: Path, existing_docs: list[str]
) -> bool:
    target_path = str(rec.get("target_path") or "").strip()
    suggested = str(rec.get("suggested_content") or "").strip()
    reason = str(rec.get("reason") or "").strip()
    if not target_path and not suggested and not reason:
        return True

    target_doc = _read_kb_file(workspace_root, target_path)
    if target_doc:
        if suggested and _contains_or_similar(target_doc, suggested):
            return True
        if reason and _contains_or_similar(target_doc, reason):
            return True

    for doc in existing_docs:
        same_target = bool(target_path and f"`{target_path}`".lower() in doc.lower())
        if same_target:
            if suggested and _contains_or_similar(doc, suggested):
                return True
            if reason and _contains_or_similar(doc, reason):
                return True

        # Guard against model drift that suggests a new path for the same idea.
        if suggested and _contains_or_similar(doc, suggested):
            return True
        if reason and _contains_or_similar(doc, reason):
            return True
    return False


def _index_update_already_covered(
    update: dict[str, Any], workspace_root: Path, existing_docs: list[str]
) -> bool:
    index_path = str(update.get("index_path") or "~/ai-kb/rules/INDEX.md").strip()
    entry = str(update.get("entry") or "").strip()
    reason = str(update.get("reason") or "").strip()

    index_doc = _read_kb_file(workspace_root, index_path)
    if index_doc and entry and _contains_or_similar(index_doc, entry):
        return True

    for doc in existing_docs:
        same_index = bool(index_path and f"`{index_path}`".lower() in doc.lower())
        if same_index:
            if entry and _contains_or_similar(doc, entry):
                return True
            if reason and _contains_or_similar(doc, reason):
                return True

        if entry and _contains_or_similar(doc, entry):
            return True
        if reason and _contains_or_similar(doc, reason):
            return True
    return False


def _filter_novel_analysis(
    analysis: dict[str, Any], workspace_root: Path, out_dir: Path
) -> dict[str, Any]:
    existing_docs = _load_existing_recommendation_docs(out_dir)

    filtered_recommendations: list[dict[str, Any]] = []
    for rec in analysis.get("recommendations", []):
        if not isinstance(rec, dict):
            continue
        if not _recommendation_already_covered(rec, workspace_root, existing_docs):
            filtered_recommendations.append(rec)

    filtered_index_updates: list[dict[str, Any]] = []
    for update in analysis.get("index_updates", []):
        if not isinstance(update, dict):
            continue
        if not _index_update_already_covered(update, workspace_root, existing_docs):
            filtered_index_updates.append(update)

    out = dict(analysis)
    out["recommendations"] = filtered_recommendations
    out["index_updates"] = filtered_index_updates
    out["should_recommend"] = bool(filtered_recommendations or filtered_index_updates)
    return out


def _render_markdown(
    payload: dict[str, Any], analysis: dict[str, Any], history_chars: int
) -> str:
    timestamp = datetime.now(timezone.utc).isoformat()
    conversation_id = _slug(str(payload.get("conversation_id") or ""), "conversation")
    generation_id = _slug(str(payload.get("generation_id") or ""), "generation")
    summary = str(analysis.get("conversation_summary") or "").strip()
    confidence = str(analysis.get("confidence") or "unknown").strip()
    recommendations = analysis.get("recommendations")
    if not isinstance(recommendations, list):
        recommendations = []
    index_updates = analysis.get("index_updates")
    if not isinstance(index_updates, list):
        index_updates = []

    lines = [
        "# KB Enrichment Recommendation",
        "",
        f"- Generated: `{timestamp}`",
        f"- Source hook: `{payload.get('hook_event_name') or 'preCompact'}`",
        "- Analyzer: `cursor agent --print`",
        "- Scope: `history window pending compaction (since previous compaction, or full history for first compaction)`",
        f"- Conversation: `{conversation_id}`",
        f"- Generation: `{generation_id}`",
        f"- History size: `{history_chars}` chars",
        f"- Confidence: `{confidence}`",
    ]

    if summary:
        lines.extend(["", "## Conversation Summary", "", summary])

    lines.extend(["", "## Recommendations"])
    for rec in recommendations:
        if not isinstance(rec, dict):
            continue
        action = str(rec.get("action") or "update_existing")
        target = str(rec.get("target_path") or "").strip()
        reason = str(rec.get("reason") or "").strip()
        suggested = str(rec.get("suggested_content") or "").strip()
        links = rec.get("link_commands")
        if not isinstance(links, list):
            links = []

        lines.append(f"- **{action}** `{target}`")
        if reason:
            lines.append(f"  - Reason: {reason}")
        if suggested:
            lines.append(f"  - Suggested content: {suggested}")
        if links:
            lines.append("  - Link command docs:")
            for link in links:
                if isinstance(link, str) and link.strip():
                    lines.append(f"    - `{link.strip()}`")

    lines.extend(["", "## Index Updates"])
    for entry in index_updates:
        if not isinstance(entry, dict):
            continue
        index_path = str(entry.get("index_path") or "~/ai-kb/rules/INDEX.md")
        value = str(entry.get("entry") or "").strip()
        reason = str(entry.get("reason") or "").strip()
        lines.append(f"- `{index_path}`")
        if value:
            lines.append(f"  - Entry: {value}")
        if reason:
            lines.append(f"  - Reason: {reason}")

    lines.extend(
        [
            "",
            "## Next Action",
            "",
            "- Apply validated updates to KB docs, then update `~/ai-kb/rules/INDEX.md` and linked command docs.",
        ]
    )
    return "\n".join(lines) + "\n"


def _recommendations_dir(workspace_root: Path) -> Path:
    """Prefer repo-local queue when present; fallback to global queue."""

    if (workspace_root / ".cursor").exists():
        return workspace_root / ".cursor" / "kb-recommendations"
    return Path.home() / ".cursor" / "kb-recommendations"


def _write_recommendation(payload: dict[str, Any], analysis: dict[str, Any], history: str) -> None:
    workspace_root = _workspace_root(payload)
    out_dir = _recommendations_dir(workspace_root)
    out_dir.mkdir(parents=True, exist_ok=True)

    should_recommend = analysis.get("should_recommend")
    recommendations = analysis.get("recommendations")
    index_updates = analysis.get("index_updates")
    if not isinstance(should_recommend, bool) or not should_recommend:
        return
    if not isinstance(recommendations, list):
        recommendations = []
    if not isinstance(index_updates, list):
        index_updates = []
    if not recommendations and not index_updates:
        return

    conversation_id = _slug(str(payload.get("conversation_id") or ""), "conversation")
    generation_id = _slug(str(payload.get("generation_id") or ""), "generation")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out_file = out_dir / f"{stamp}-{conversation_id}-{generation_id}.md"
    body = _render_markdown(payload=payload, analysis=analysis, history_chars=len(history))
    out_file.write_text(body, encoding="utf-8")


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        _respond()
        return 0

    # When invoked from an internal analyzer run, do nothing (avoid hook recursion).
    if os.environ.get(SENTINEL_ENV_KEY, "").strip():
        _respond()
        return 0

    try:
        payload = json.loads(raw)
    except Exception:
        _respond()
        return 0
    if not isinstance(payload, dict):
        _respond()
        return 0

    try:
        workspace_root = _workspace_root(payload).resolve()
        raw_history = _read_transcript(payload)
        if len(raw_history) < MIN_HISTORY_CHARS:
            _respond()
            return 0

        history = _slice_since_last_compaction(raw_history)
        if len(history) < MIN_HISTORY_CHARS:
            _respond()
            return 0

        analysis = _run_ai_analyzer(history, workspace_root)
        if not analysis:
            _respond()
            return 0

        filtered = _filter_novel_analysis(
            analysis=analysis,
            workspace_root=workspace_root,
            out_dir=_recommendations_dir(workspace_root),
        )
        _write_recommendation(payload=payload, analysis=filtered, history=history)
    except Exception:
        # Fail-open: never block the Cursor workflow.
        pass

    _respond()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
