#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shutil
import stat
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

AGENTS_MARKER_START = "<!-- ai-transfer:bundle:start -->"
AGENTS_MARKER_END = "<!-- ai-transfer:bundle:end -->"
AGENTS_COMPAT_FILE = "AGENTS.ai-transfer.md"
HOOK_FILE_NAMES = [
    "kb-post-turn-analyzer.py",
]


@dataclass
class InstallState:
    planned_files: list[tuple[Path, Path]] = field(default_factory=list)
    missing_sources: list[Path] = field(default_factory=list)
    backups: list[tuple[Path, Path]] = field(default_factory=list)
    skipped_existing: list[Path] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    created_paths: set[Path] = field(default_factory=set)
    created_files: int = 0
    overwritten_files: int = 0
    scanned_text_files: int = 0
    rewritten_text_files: int = 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Install AI transfer bundle")
    parser.add_argument(
        "--target-home",
        default=None,
        help="Install to a home directory (global mode). Default: current HOME.",
    )
    parser.add_argument(
        "--project-dir",
        default=None,
        help="Install into a project directory (project mode).",
    )
    parser.add_argument(
        "--project-full",
        action="store_true",
        help=(
            "Project mode one-click install: include full machine-specific config "
            "with no extra flags."
        ),
    )
    parser.add_argument(
        "--include-machine-config",
        action="store_true",
        help=(
            "Project mode only: install full machine-specific config files "
            "(opencode.json, dcp, .cursor/cli.json)."
        ),
    )
    parser.add_argument(
        "--preserve-existing",
        action="store_true",
        help="Do not overwrite conflicting destination files.",
    )
    parser.add_argument(
        "--install-deps",
        action="store_true",
        help="Try to install missing dependencies with available package manager.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show planned actions without writing files.",
    )
    return parser.parse_args()


def is_text_file(path: Path, exts: set[str], basenames: set[str]) -> bool:
    if path.suffix.lower() in exts:
        return True
    if path.name in basenames:
        return True
    if path.name.endswith(".mdc"):
        return True

    try:
        data = path.read_bytes()
    except Exception:
        return False

    if b"\x00" in data:
        return False

    try:
        data.decode("utf-8")
    except UnicodeDecodeError:
        return False
    return True


def install_missing_deps(missing: list[str]) -> None:
    if not missing:
        return

    print("Missing tools:", ", ".join(missing))

    brew = shutil.which("brew")
    apt = shutil.which("apt-get")

    if brew:
        mapping = {
            "python3": "python",
            "node": "node",
            "git": "git",
            "bun": "bun",
            "uv": "uv",
        }
        pkgs = [mapping[m] for m in missing if m in mapping]
        if pkgs:
            print("Installing via brew:", " ".join(pkgs))
            subprocess.run(["brew", "install", *pkgs], check=False)
        return

    if apt:
        mapping = {
            "python3": "python3",
            "node": "nodejs",
            "git": "git",
        }
        pkgs = [mapping[m] for m in missing if m in mapping]
        if pkgs:
            print("Installing via apt-get:", " ".join(pkgs))
            subprocess.run(["sudo", "apt-get", "update"], check=False)
            subprocess.run(["sudo", "apt-get", "install", "-y", *pkgs], check=False)
        return

    print("No supported package manager found. Install missing tools manually.")


def unique_backup_path(path: Path, stamp: str) -> Path:
    candidate = path.with_name(f"{path.name}.bak.{stamp}")
    index = 1
    while candidate.exists() or candidate.is_symlink():
        candidate = path.with_name(f"{path.name}.bak.{stamp}.{index}")
        index += 1
    return candidate


def backup_existing_path(
    existing: Path, state: InstallState, stamp: str, dry_run: bool
) -> Path:
    backup = unique_backup_path(existing, stamp)
    print(f"Backup: {existing} -> {backup}")
    state.backups.append((existing, backup))
    if dry_run:
        return backup
    backup.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(existing), str(backup))
    return backup


def files_equal(src: Path, dst: Path) -> bool:
    try:
        return src.read_bytes() == dst.read_bytes()
    except Exception:
        return False


def render_text_with_replacements(
    src: Path,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
    state: InstallState,
) -> str | None:
    """Render src as text with replacements applied, or return None for binary files.

    We apply replacements at copy-time so repeated installs are idempotent: the destination
    file bytes match what we'd render from the payload, avoiding endless `.bak.*` churn.
    """
    if not replacements:
        return None
    if not is_text_file(src, exts, basenames):
        return None

    state.scanned_text_files += 1
    try:
        original = src.read_text(encoding="utf-8")
    except Exception:
        return None

    updated = apply_replacements(original, replacements)
    if updated != original:
        state.rewritten_text_files += 1
    return updated


def copy_file(
    src: Path,
    dst: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    if dst.exists() and dst.is_dir():
        state.notes.append(f"Skip file copy; destination is a directory: {dst}")
        return

    rendered_text = render_text_with_replacements(
        src=src,
        replacements=replacements,
        exts=exts,
        basenames=basenames,
        state=state,
    )

    if dst.exists() or dst.is_symlink():
        if dst.exists():
            if rendered_text is not None:
                try:
                    if dst.read_text(encoding="utf-8") == rendered_text:
                        return
                except Exception:
                    pass
            else:
                if files_equal(src, dst):
                    return
        if args.preserve_existing:
            print(f"Preserve existing: {dst}")
            state.skipped_existing.append(dst)
            return
        backup_existing_path(dst, state, stamp, args.dry_run)
        state.overwritten_files += 1
    else:
        state.created_files += 1
        state.created_paths.add(dst)

    print(f"Install file: {src} -> {dst}")
    state.planned_files.append((src, dst))
    if args.dry_run:
        return

    dst.parent.mkdir(parents=True, exist_ok=True)
    if rendered_text is not None:
        dst.write_text(rendered_text, encoding="utf-8")
        # Keep permission bits consistent with the payload file.
        try:
            shutil.copymode(src, dst)
        except Exception:
            pass
        return

    shutil.copy2(src, dst)


def copy_tree(
    src_dir: Path,
    dst_dir: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    if dst_dir.exists() and not dst_dir.is_dir():
        if args.preserve_existing:
            print(f"Preserve existing non-directory: {dst_dir}")
            state.skipped_existing.append(dst_dir)
            return
        backup_existing_path(dst_dir, state, stamp, args.dry_run)

    if not args.dry_run:
        dst_dir.mkdir(parents=True, exist_ok=True)

    for src_file in sorted(src_dir.rglob("*")):
        if not src_file.is_file():
            continue
        if src_file.name in {".DS_Store"}:
            continue
        rel = src_file.relative_to(src_dir)
        copy_file(
            src_file,
            dst_dir / rel,
            args,
            state,
            stamp,
            replacements,
            exts,
            basenames,
        )


def copy_entry(
    src: Path,
    dst: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    if not src.exists():
        print(f"Missing source: {src}")
        state.missing_sources.append(src)
        return
    if src.is_dir():
        print(f"Install dir: {src} -> {dst}")
        copy_tree(src, dst, args, state, stamp, replacements, exts, basenames)
        return
    copy_file(src, dst, args, state, stamp, replacements, exts, basenames)


def dedupe_replacements(replacements: list[tuple[str, str]]) -> list[tuple[str, str]]:
    unique: list[tuple[str, str]] = []
    seen = set()
    for old, new in replacements:
        if not old:
            continue
        key = (old, new)
        if key in seen:
            continue
        seen.add(key)
        unique.append(key)
    unique.sort(key=lambda pair: len(pair[0]), reverse=True)
    return unique


def apply_replacements(text: str, replacements: list[tuple[str, str]]) -> str:
    updated = text
    for old, new in replacements:
        updated = updated.replace(old, new)
    return updated


def has_backup_for(path: Path, state: InstallState) -> bool:
    return any(original == path for original, _ in state.backups)


def write_json_file_with_backup(
    path: Path,
    data: dict,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    source_for_plan: Path | None = None,
) -> None:
    is_existing = path.exists() or path.is_symlink()
    was_created_this_run = path in state.created_paths
    if is_existing and args.preserve_existing:
        state.skipped_existing.append(path)
        print(f"Preserve existing: {path}")
        return

    if is_existing:
        if not was_created_this_run:
            state.overwritten_files += 1
        if (
            not args.dry_run
            and not has_backup_for(path, state)
            and not was_created_this_run
        ):
            backup_existing_path(path, state, stamp, args.dry_run)
    else:
        if not was_created_this_run:
            state.created_files += 1
            state.created_paths.add(path)

    if source_for_plan is not None:
        state.planned_files.append((source_for_plan, path))

    print(f"Write JSON: {path}")
    if args.dry_run:
        return

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def normalize_project_cursor_hook_command(command: str) -> str:
    normalized = command.replace("./hooks/", ".cursor/hooks/")
    if normalized.startswith("hooks/"):
        normalized = f".cursor/{normalized}"
    return normalized


def normalize_project_cursor_hooks_config(raw: dict) -> dict:
    hooks = raw.get("hooks")
    if not isinstance(hooks, dict):
        return raw

    normalized_config = dict(raw)
    normalized_hooks: dict[str, object] = {}
    for event, entries in hooks.items():
        if not isinstance(entries, list):
            normalized_hooks[event] = entries
            continue

        updated_entries: list[object] = []
        for entry in entries:
            if not isinstance(entry, dict):
                updated_entries.append(entry)
                continue
            rewritten = dict(entry)
            command = rewritten.get("command")
            if isinstance(command, str):
                rewritten["command"] = normalize_project_cursor_hook_command(command)
            updated_entries.append(rewritten)
        normalized_hooks[event] = updated_entries

    normalized_config["hooks"] = normalized_hooks
    return normalized_config


def merge_cursor_hooks_file(
    src: Path,
    dst: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    try:
        src_data = json.loads(src.read_text(encoding="utf-8"))
    except Exception:
        state.notes.append(
            f"Could not parse hooks JSON for merge; fallback to regular copy: {dst}"
        )
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    if not isinstance(src_data, dict):
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return
    src_data = normalize_project_cursor_hooks_config(src_data)

    if not dst.exists():
        write_json_file_with_backup(
            path=dst,
            data=src_data,
            args=args,
            state=state,
            stamp=stamp,
            source_for_plan=src,
        )
        return

    try:
        dst_data = json.loads(dst.read_text(encoding="utf-8"))
    except Exception:
        state.notes.append(
            f"Could not parse hooks JSON for merge; fallback to regular copy: {dst}"
        )
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    if not isinstance(dst_data, dict):
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    merged = dst_data
    src_hooks = src_data.get("hooks")
    merged_hooks = merged.setdefault("hooks", {})
    if not isinstance(src_hooks, dict) or not isinstance(merged_hooks, dict):
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    changed = False
    for event, entries in src_hooks.items():
        if not isinstance(entries, list):
            continue
        existing_entries = merged_hooks.setdefault(event, [])
        if not isinstance(existing_entries, list):
            merged_hooks[event] = []
            existing_entries = merged_hooks[event]
        for entry in entries:
            if entry not in existing_entries:
                existing_entries.append(entry)
                changed = True

    if not changed:
        return

    if args.preserve_existing:
        print(f"Preserve existing hooks file: {dst}")
        state.skipped_existing.append(dst)
        return

    if not args.dry_run:
        backup_existing_path(dst, state, stamp, args.dry_run)
        dst.write_text(json.dumps(merged, indent=2) + "\n", encoding="utf-8")
    else:
        print(f"Merge hooks file: {src} + {dst}")

    state.overwritten_files += 1
    state.planned_files.append((src, dst))


def copy_project_cursor_cli_permissions_file(
    src: Path,
    dst: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    """Write a project-scoped `cli.json` containing only `permissions`.

    Cursor docs: only `permissions` is supported at the project level (`.cursor/cli.json`).
    The payload includes a full `cli-config.json` (global settings + permissions); when
    installing machine config into a project we down-scope it to avoid unsupported keys.
    """

    try:
        src_data = json.loads(src.read_text(encoding="utf-8"))
    except Exception:
        state.notes.append(
            f"Could not parse cli-config JSON for project install; fallback to regular copy: {dst}"
        )
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    if not isinstance(src_data, dict) or not isinstance(src_data.get("permissions"), dict):
        copy_file(src, dst, args, state, stamp, replacements, exts, basenames)
        return

    permissions = src_data.get("permissions", {})
    allow_raw = permissions.get("allow", [])
    deny_raw = permissions.get("deny", [])

    def _rewrite_tokens(value: object) -> list[str]:
        if not isinstance(value, list):
            return []
        out: list[str] = []
        for item in value:
            if not isinstance(item, str):
                continue
            out.append(apply_replacements(item, replacements))
        return out

    rendered_permissions: dict[str, object] = {}
    allow = _rewrite_tokens(allow_raw)
    deny = _rewrite_tokens(deny_raw)
    if allow:
        rendered_permissions["allow"] = allow
    if deny:
        rendered_permissions["deny"] = deny

    rendered_text = json.dumps({"permissions": rendered_permissions}, indent=2) + "\n"

    # Match `copy_file` behavior (idempotent compare; backup only if changed).
    if dst.exists() and dst.is_dir():
        state.notes.append(f"Skip file copy; destination is a directory: {dst}")
        return

    if dst.exists() or dst.is_symlink():
        if dst.exists():
            try:
                if dst.read_text(encoding="utf-8") == rendered_text:
                    return
            except Exception:
                pass
        if args.preserve_existing:
            print(f"Preserve existing: {dst}")
            state.skipped_existing.append(dst)
            return
        backup_existing_path(dst, state, stamp, args.dry_run)
        state.overwritten_files += 1
    else:
        state.created_files += 1
        state.created_paths.add(dst)

    print(f"Install file: {src} -> {dst}")
    state.planned_files.append((src, dst))
    if args.dry_run:
        return

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(rendered_text, encoding="utf-8")
    try:
        shutil.copymode(src, dst)
    except Exception:
        pass


def ensure_hook_executable_bits(cursor_hooks_root: Path, dry_run: bool) -> None:
    for hook_name in HOOK_FILE_NAMES:
        hook_path = cursor_hooks_root / hook_name
        if not hook_path.exists():
            continue
        if dry_run:
            print(f"Set executable bit: {hook_path}")
            continue
        mode = hook_path.stat().st_mode
        hook_path.chmod(mode | stat.S_IXUSR)


def ensure_project_agents_compat(
    payload: Path,
    project_root: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    payload_agents = payload / "AGENTS.md"
    if not payload_agents.exists():
        state.notes.append("payload/AGENTS.md missing; AGENTS compatibility skipped")
        return

    project_agents = project_root / "AGENTS.md"
    if not project_agents.exists():
        copy_file(
            payload_agents,
            project_agents,
            args,
            state,
            stamp,
            replacements,
            exts,
            basenames,
        )
        return

    compat_agents = project_root / AGENTS_COMPAT_FILE
    copy_file(
        payload_agents,
        compat_agents,
        args,
        state,
        stamp,
        replacements,
        exts,
        basenames,
    )

    if args.preserve_existing:
        state.notes.append(
            "AGENTS.md exists and preserve-existing is set; skipped auto-include block."
        )
        return

    try:
        current = project_agents.read_text(encoding="utf-8")
    except Exception as exc:
        state.notes.append(f"Could not read existing AGENTS.md for merge: {exc}")
        return

    if AGENTS_MARKER_START in current and AGENTS_MARKER_END in current:
        return

    include_block = (
        f"{AGENTS_MARKER_START}\n"
        "## AI Transfer Bundle Compatibility\n"
        f"Read and apply `@{AGENTS_COMPAT_FILE}` for shared KB/rules/commands installed by this bundle.\n"
        "Keep all existing project-specific instructions in this file.\n"
        f"{AGENTS_MARKER_END}\n"
    )

    print(f"Update AGENTS include block: {project_agents}")
    if args.dry_run:
        return
    project_agents.write_text(current.rstrip() + "\n\n" + include_block, encoding="utf-8")


def default_project_opencode_instructions() -> list[str]:
    return [
        "AGENTS.md",
        "ai-kb/AGENTS.md",
        ".cursor/rules/*.md",
        ".cursor/rules/*.mdc",
        "ai-kb/rules/**/*.md",
    ]


def default_project_opencode_config() -> dict[str, object]:
    return {
        "$schema": "https://opencode.ai/config.json",
        "instructions": default_project_opencode_instructions(),
    }


def ensure_project_opencode_json(
    project_root: Path,
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
) -> None:
    config_path = project_root / "opencode.json"
    required_instructions = default_project_opencode_instructions()

    planned_config_copy = any(dst == config_path for _, dst in state.planned_files)
    if not config_path.exists():
        if args.dry_run and planned_config_copy:
            state.notes.append(
                "opencode.json is part of this dry-run install plan; "
                "instruction merge runs after real file copy."
            )
            return
        generated = default_project_opencode_config()
        print(f"Create project opencode.json: {config_path}")
        if not args.dry_run:
            config_path.write_text(json.dumps(generated, indent=2) + "\n", encoding="utf-8")
        state.created_files += 1
        state.created_paths.add(config_path)
        return

    try:
        parsed = json.loads(config_path.read_text(encoding="utf-8"))
    except Exception:
        if args.preserve_existing:
            state.notes.append(
                "Skipped opencode.json merge because file is not strict JSON "
                "(likely JSONC) and preserve-existing is set."
            )
            return

        replacement = default_project_opencode_config()
        state.notes.append(
            "Existing opencode.json was not strict JSON; backed it up and replaced "
            "with a project-compatible config."
        )
        write_json_file_with_backup(
            path=config_path,
            data=replacement,
            args=args,
            state=state,
            stamp=stamp,
        )
        return

    if not isinstance(parsed, dict):
        if args.preserve_existing:
            state.notes.append(
                "Skipped opencode.json merge because root is not a JSON object "
                "and preserve-existing is set."
            )
            return

        replacement = default_project_opencode_config()
        state.notes.append(
            "Existing opencode.json root was not an object; backed it up and replaced "
            "with a project-compatible config."
        )
        write_json_file_with_backup(
            path=config_path,
            data=replacement,
            args=args,
            state=state,
            stamp=stamp,
        )
        return

    existing = parsed.get("instructions")
    changed = False
    if existing is None:
        parsed["instructions"] = list(required_instructions)
        changed = True
    elif isinstance(existing, list):
        # Older bundle versions installed `.opencode/rules/**`. We now load rules directly
        # from `ai-kb/rules/**`, so drop the stale glob if the directory isn't present.
        stale_rules_glob = ".opencode/rules/**/*.md"
        if stale_rules_glob in existing:
            rules_dir = project_root / ".opencode" / "rules"
            if not rules_dir.exists():
                existing[:] = [item for item in existing if item != stale_rules_glob]
                changed = True
        for item in required_instructions:
            if item not in existing:
                existing.append(item)
                changed = True
    else:
        state.notes.append("Skipped opencode.json merge; `instructions` is not an array.")
        return

    if not changed:
        return
    if args.preserve_existing:
        state.notes.append("Skipped opencode.json merge because preserve-existing is set.")
        return

    print(f"Merge instructions into: {config_path}")
    if args.dry_run:
        return
    backup_existing_path(config_path, state, stamp, args.dry_run)
    config_path.write_text(json.dumps(parsed, indent=2) + "\n", encoding="utf-8")
    state.overwritten_files += 1


def global_copy_plan(copied_items: list[str]) -> list[tuple[str, str]]:
    return [(rel, rel) for rel in copied_items]


def project_copy_plan(include_machine_config: bool) -> list[tuple[str, str]]:
    plan = [
        ("ai-kb", "ai-kb"),
        (".cursor/commands", ".cursor/commands"),
        (".cursor/rules", ".cursor/rules"),
        (".cursor/hooks", ".cursor/hooks"),
        (".cursor/hooks.json", ".cursor/hooks.json"),
        (".config/opencode/AGENTS.md", ".opencode/AGENTS.md"),
        (".config/opencode/agent", ".opencode/agents"),
        (".config/opencode/agent", ".opencode/agent"),
        (".config/opencode/command", ".opencode/commands"),
        (".config/opencode/command", ".opencode/command"),
        (".config/opencode/plugins", ".opencode/plugins"),
        (".config/opencode/plugins", ".opencode/plugin"),
    ]
    if include_machine_config:
        plan.extend(
            [
                (".cursor/cli-config.json", ".cursor/cli.json"),
                (".config/opencode/opencode.json", "opencode.json"),
                (".config/opencode/dcp.jsonc", ".opencode/dcp.jsonc"),
            ]
        )
    return plan


def global_replacements(source_home: str, target_home: str) -> list[tuple[str, str]]:
    return [
        ("__HOME__/ai-kb", f"{target_home}/ai-kb"),
        ("__HOME__", target_home),
        (source_home, target_home),
    ]


def project_replacements(
    source_home: str, project_root: Path, current_home: Path
) -> list[tuple[str, str]]:
    # Keep project installs portable across developer machines:
    # use repo-relative paths instead of baking absolute `/Users/...` paths into files.
    project_kb = "ai-kb"
    project_opencode = ".opencode"
    project_cursor = ".cursor"
    return [
        ("__HOME__/ai-kb", project_kb),
        ("__HOME__", str(current_home)),
        (f"{source_home}/ai-kb", project_kb),
        ("~/ai-kb", project_kb),
        (f"{source_home}/.config/opencode", project_opencode),
        ("~/.config/opencode", project_opencode),
        (f"{source_home}/.cursor", project_cursor),
        ("~/.cursor", project_cursor),
        (source_home, str(current_home)),
    ]


def install_entries(
    payload: Path,
    destination_root: Path,
    plan: list[tuple[str, str]],
    args: argparse.Namespace,
    state: InstallState,
    stamp: str,
    project_mode: bool,
    replacements: list[tuple[str, str]],
    exts: set[str],
    basenames: set[str],
) -> None:
    for src_rel, dst_rel in plan:
        src = payload / src_rel
        dst = destination_root / dst_rel
        if project_mode and src_rel == ".cursor/hooks.json":
            if not src.exists():
                state.missing_sources.append(src)
                print(f"Missing source: {src}")
                continue
            merge_cursor_hooks_file(
                src, dst, args, state, stamp, replacements, exts, basenames
            )
            continue
        if project_mode and src_rel == ".cursor/cli-config.json" and dst_rel == ".cursor/cli.json":
            if not src.exists():
                state.missing_sources.append(src)
                print(f"Missing source: {src}")
                continue
            copy_project_cursor_cli_permissions_file(
                src, dst, args, state, stamp, replacements, exts, basenames
            )
            continue
        copy_entry(src, dst, args, state, stamp, replacements, exts, basenames)


def print_summary(
    state: InstallState,
    mode: str,
    target: Path,
    dry_run: bool,
    missing_optional: list[str],
) -> None:
    print("Done")
    print("Mode:", mode)
    print("Target:", target)
    print("Dry run:", "yes" if dry_run else "no")
    print("Created files:", state.created_files)
    print("Overwritten files:", state.overwritten_files)
    print("Backups created:", len(state.backups))
    print("Skipped existing:", len(state.skipped_existing))
    print("Text files scanned:", state.scanned_text_files)
    print("Files rewritten:", state.rewritten_text_files)
    if state.missing_sources:
        print("Missing sources:", len(state.missing_sources))
        for src in state.missing_sources[:10]:
            print(" -", src)
    if state.notes:
        print("Notes:")
        for note in state.notes:
            print(" -", note)
    if missing_optional:
        print("Optional tools missing:", ", ".join(missing_optional))


def main() -> int:
    args = parse_args()

    if args.project_full and not args.project_dir:
        print("--project-full requires --project-dir", file=sys.stderr)
        return 2

    if args.project_dir and args.target_home:
        print(
            "Use either --project-dir or --target-home (not both).",
            file=sys.stderr,
        )
        return 2

    if args.project_full:
        args.include_machine_config = True
        if args.preserve_existing:
            print(
                "Note: --project-full disables --preserve-existing for one-click setup.",
                file=sys.stderr,
            )
            args.preserve_existing = False

    bundle_dir = Path(__file__).resolve().parent
    payload = bundle_dir / "payload"
    manifest_path = bundle_dir / "manifest.json"

    if not payload.exists() or not manifest_path.exists():
        print("Bundle is missing payload or manifest", file=sys.stderr)
        return 2

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    source_home = manifest["source_home"]
    copied_items = manifest.get("copied_items", [])
    exts = set(manifest.get("text_extensions", []))
    basenames = set(manifest.get("text_basenames", []))

    required_tools = ["python3", "node", "git"]
    optional_tools = ["bun", "uv"]
    missing_required = [tool for tool in required_tools if shutil.which(tool) is None]
    missing_optional = [tool for tool in optional_tools if shutil.which(tool) is None]

    if args.install_deps:
        install_missing_deps(missing_required + missing_optional)
    if missing_required:
        print("Warning: missing required tools:", ", ".join(missing_required))

    state = InstallState()
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    if args.project_dir:
        mode = "project"
        project_root = Path(args.project_dir).expanduser().resolve()
        if not project_root.exists() or not project_root.is_dir():
            print(f"Project directory does not exist: {project_root}", file=sys.stderr)
            return 2

        if args.project_full:
            state.notes.append(
                "Project full mode enabled: installing full machine config in project "
                "for one-click setup."
            )

        project_rewrite_rules = dedupe_replacements(
            project_replacements(source_home, project_root, Path.home())
        )
        plan = project_copy_plan(args.include_machine_config)
        install_entries(
            payload=payload,
            destination_root=project_root,
            plan=plan,
            args=args,
            state=state,
            stamp=stamp,
            project_mode=True,
            replacements=project_rewrite_rules,
            exts=exts,
            basenames=basenames,
        )

        ensure_project_agents_compat(
            payload,
            project_root,
            args,
            state,
            stamp,
            project_rewrite_rules,
            exts,
            basenames,
        )
        ensure_project_opencode_json(project_root, args, state, stamp)
        ensure_hook_executable_bits(project_root / ".cursor" / "hooks", args.dry_run)
        print_summary(state, mode, project_root, args.dry_run, missing_optional)
        return 0

    mode = "home"
    target_home = Path(args.target_home or Path.home()).expanduser().resolve()
    plan = global_copy_plan(copied_items)
    home_rewrite_rules = dedupe_replacements(global_replacements(source_home, str(target_home)))
    install_entries(
        payload=payload,
        destination_root=target_home,
        plan=plan,
        args=args,
        state=state,
        stamp=stamp,
        project_mode=False,
        replacements=home_rewrite_rules,
        exts=exts,
        basenames=basenames,
    )

    ensure_hook_executable_bits(target_home / ".cursor" / "hooks", args.dry_run)
    print_summary(state, mode, target_home, args.dry_run, missing_optional)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
