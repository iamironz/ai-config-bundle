#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

for tool in python3 node git; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required tool: $tool" >&2
    exit 1
  fi
done

echo "Syntax check Python files (no bytecode written)"
python3 - <<'PY'
from __future__ import annotations

from pathlib import Path
import tokenize

root = Path.cwd()
paths: list[Path] = [root / "install_bundle.py"]

hooks_dir = root / "payload" / ".cursor" / "hooks"
paths.extend(sorted(hooks_dir.glob("*.py")))

missing = [str(p) for p in paths if not p.exists()]
if missing:
    raise SystemExit("Missing expected Python files:\n" + "\n".join(missing))

for p in paths:
    source = tokenize.open(p).read()
    compile(source, str(p), "exec")

print(f"Checked {len(paths)} Python files")
PY

echo "Assert payload has no Python bytecode artifacts"
python3 - <<'PY'
from __future__ import annotations

from pathlib import Path

payload_root = Path.cwd() / "payload"
bad: list[str] = []

for p in payload_root.rglob("*.pyc"):
    bad.append(str(p))
for p in payload_root.rglob("__pycache__"):
    if p.is_dir():
        bad.append(str(p) + "/")

if bad:
    preview = "\n".join(f"- {p}" for p in bad[:50])
    raise SystemExit(
        "Found Python bytecode artifacts under payload/. Remove them before shipping:\n"
        + preview
    )

print("OK: payload is source-only")
PY

echo "Smoke test installer (dry-run)"
tmp_root="$(mktemp -d 2>/dev/null || mktemp -d -t ai-config-bundle)"
trap 'rm -rf "$tmp_root"' EXIT

mkdir -p "$tmp_root/project"
python3 install_bundle.py --project-dir "$tmp_root/project" --dry-run
python3 install_bundle.py --target-home "$tmp_root/home" --dry-run
python3 install_bundle.py --project-dir "$tmp_root/project" --uninstall --dry-run
python3 install_bundle.py --target-home "$tmp_root/home" --uninstall --dry-run
python3 install_bundle.py --project-dir "$tmp_root/project" --uninstall --uninstall-all --dry-run
python3 install_bundle.py --target-home "$tmp_root/home" --uninstall --uninstall-all --dry-run

echo "OK"
