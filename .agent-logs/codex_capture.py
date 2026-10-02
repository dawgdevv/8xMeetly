#!/usr/bin/env python3
"""Append Codex prompt and final-response hook events to a session log."""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path.cwd()
LOG_DIR = ROOT / ".agent-logs"
SESSION_ID_RE = re.compile(r"[^A-Za-z0-9_-]")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def stamp(value: datetime) -> str:
    return value.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def safe_session_id(value: str) -> str:
    return SESSION_ID_RE.sub("", value) or "unknown-session"


def session_file(session_id: str, first_time: datetime) -> Path:
    safe_id = safe_session_id(session_id)
    for path in LOG_DIR.glob(f"*_{safe_id}.md"):
        return path
    return LOG_DIR / f"{first_time.strftime('%Y-%m-%d_%H-%M-%S')}_{safe_id}.md"


def read_stdin() -> dict:
    try:
        value = json.load(sys.stdin)
        return value if isinstance(value, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def metadata(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line == "---" and values:
            break
        if ": " in line:
            key, value = line.split(": ", 1)
            values[key] = value
    return values


def make_header(session_id: str, day: str, author: str, model: str, first_time: str) -> str:
    project = ROOT.name
    return (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {day}\n"
        f"author: {author}\n"
        f"model: {model}\n"
        "tool: codex-cli\n"
        f"project: {project}\n"
        "total_exchanges: 0\n"
        f"first_prompt_time: {first_time}\n"
        f"last_prompt_time: {first_time}\n"
        "---\n\n"
        f"# Session Log - {day}\n\n"
        f"Session: `{session_id[:8]}` | Project: `{project}` | Author: `{author}`\n\n"
        "---\n\n"
    )


def update_header(path: Path, changes: dict[str, str]) -> None:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        return
    closing = next((i for i in range(1, len(lines)) if lines[i].strip() == "---"), None)
    if closing is None:
        return
    values = {}
    for index in range(1, closing):
        if ": " in lines[index]:
            key, value = lines[index].rstrip("\n").split(": ", 1)
            values[key] = value
    values.update(changes)
    preferred = [
        "session_id", "date", "author", "model", "tool", "project",
        "total_exchanges", "first_prompt_time", "last_prompt_time",
    ]
    header = ["---\n"]
    header.extend(f"{key}: {values[key]}\n" for key in preferred if key in values)
    header.append("---\n")
    path.write_text("".join(header + lines[closing + 1 :]), encoding="utf-8")


def append_entry(path: Path, entry: str) -> None:
    with path.open("a", encoding="utf-8") as stream:
        stream.write(entry)
        if not entry.endswith("\n"):
            stream.write("\n")


def main() -> None:
    if len(sys.argv) != 2 or sys.argv[1] not in {"prompt", "response"}:
        return
    event = read_stdin()
    session_id = safe_session_id(str(event.get("session_id", "unknown-session")))
    model = str(event.get("model", "unknown"))
    event_time = now_utc()
    timestamp = stamp(event_time)
    turn_id = str(event.get("turn_id", "unknown"))
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    path = session_file(session_id, event_time)

    if sys.argv[1] == "prompt":
        prompt = event.get("prompt", "")
        if not isinstance(prompt, str):
            prompt = json.dumps(prompt, ensure_ascii=False)
        if not path.exists():
            author = os.environ.get("GITHUB_ACTOR", "dawgdevv")
            path.write_text(
                make_header(session_id, timestamp[:10], author, model, timestamp),
                encoding="utf-8",
            )
        contents = path.read_text(encoding="utf-8")
        if f"prompt_turn_id: {turn_id}\n" in contents:
            return
        current_meta = metadata(path)
        prompt_count = contents.count("[LOG_ENTRY type=PROMPT") + 1
        entry = (
            f"[LOG_ENTRY type=PROMPT num={prompt_count} session={session_id}]\n"
            f"timestamp: {timestamp}\n"
            f"model: {model}\n"
            f"prompt_turn_id: {turn_id}\n\n"
            f"{prompt}\n\n\n"
        )
        append_entry(path, entry)
        update_header(path, {"last_prompt_time": timestamp})
        return

    response = event.get("last_assistant_message", "")
    if not isinstance(response, str) or not response:
        return
    contents = path.read_text(encoding="utf-8") if path.exists() else ""
    if f"response_turn_id: {turn_id}\n" in contents:
        return
    prompt_count = contents.count("[LOG_ENTRY type=PROMPT")
    if not path.exists() or prompt_count == 0:
        return
    response_count = contents.count("[LOG_ENTRY type=RESPONSE") + 1
    entry = (
        f"[LOG_ENTRY type=RESPONSE num={response_count} session={session_id}]\n"
        f"timestamp: {timestamp}\n"
        f"model: {model}\n"
        f"response_turn_id: {turn_id}\n\n"
        f"{response}\n\n\n"
    )
    append_entry(path, entry)
    update_header(path, {"total_exchanges": str(response_count)})


if __name__ == "__main__":
    main()
