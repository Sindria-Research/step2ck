"""Parse Anki .apkg files and extract decks and cards."""
from __future__ import annotations

import json
import os
import sqlite3
import tempfile
import zipfile
from io import BytesIO

# Anki stores note fields separated by character 0x1f (ASCII unit separator)
FLD_SEP = "\x1f"


def parse_apkg(data: bytes) -> list[tuple[str, list[tuple[str, str]]]]:
    """
    Parse .apkg bytes and return a list of (deck_name, [(front, back), ...]).
    Each deck gets its own entry. Cards with unknown decks go to "Default".
    """
    result: list[tuple[str, list[tuple[str, str]]]] = []
    deck_cards: dict[int, list[tuple[str, str]]] = {}

    with zipfile.ZipFile(BytesIO(data), "r") as zf:
        db_name = None
        for name in zf.namelist():
            if "collection.anki2" in name or "collection.anki21" in name:
                db_name = name
                break
        if not db_name:
            raise ValueError("No collection.anki2 or collection.anki21 found in .apkg")

        with zf.open(db_name) as f:
            db_bytes = f.read()

    # SQLite needs a file path; write to a temp file
    with tempfile.NamedTemporaryFile(suffix=".anki2", delete=False) as tmp:
        tmp.write(db_bytes)
        tmp_path = tmp.name
    try:
        src = sqlite3.connect(tmp_path)
    except Exception as e:
        os.unlink(tmp_path)
        raise ValueError(f"Invalid Anki database: {e}") from e

    try:
        row = src.execute("SELECT decks, models FROM col LIMIT 1").fetchone()
    except sqlite3.OperationalError:
        src.close()
        os.unlink(tmp_path)
        raise ValueError("Invalid Anki database: col table not found or wrong schema")

    if not row:
        src.close()
        os.unlink(tmp_path)
        raise ValueError("Empty Anki collection")

    decks_json, models_json = row[0], row[1]
    try:
        decks = json.loads(decks_json) if isinstance(decks_json, str) else decks_json
    except (json.JSONDecodeError, TypeError):
        decks = {}
    if not isinstance(decks, dict):
        decks = {}

    # decks: { "1": { "name": "Default", ... }, "1234567890": { "name": "My Deck", ... } }
    deck_names: dict[int, str] = {}
    for did_str, info in decks.items():
        if isinstance(info, dict) and "name" in info:
            try:
                did = int(did_str)
                deck_names[did] = str(info["name"]).strip() or "Default"
            except (ValueError, TypeError):
                pass

    # Notes: id -> (front, back) from flds split by 0x1f
    notes: dict[int, tuple[str, str]] = {}
    for row in src.execute("SELECT id, flds FROM notes"):
        nid, flds = row[0], (row[1] or "")
        parts = flds.split(FLD_SEP)
        front = (parts[0] if len(parts) > 0 else "").strip()
        back = (parts[1] if len(parts) > 1 else "").strip()
        if not front and not back:
            continue
        notes[nid] = (front or "(empty)", back or "(empty)")

    # Cards: did -> list of (front, back)
    for row in src.execute("SELECT nid, did FROM cards"):
        nid, did = row[0], row[1]
        if nid not in notes:
            continue
        front, back = notes[nid]
        deck_name = deck_names.get(did, "Default")
        if did not in deck_cards:
            deck_cards[did] = []
        deck_cards[did].append((front, back))

    src.close()
    try:
        os.unlink(tmp_path)
    except OSError:
        pass

    # Build result: list of (deck_name, cards). Use deck id to preserve order (default deck often 1).
    seen_names: set[str] = set()
    for did in sorted(deck_cards.keys()):
        name = deck_names.get(did, "Default")
        cards = deck_cards[did]
        if not cards:
            continue
        # Dedupe deck name if multiple dids map to same name
        if name in seen_names:
            name = f"{name} ({did})"
        seen_names.add(name)
        result.append((name, cards))

    if not result:
        raise ValueError("No cards found in .apkg")
    return result
