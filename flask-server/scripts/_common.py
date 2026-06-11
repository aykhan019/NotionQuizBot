"""Shared helpers for the standalone scripts (seed, eval)."""
from __future__ import annotations

import sys
from pathlib import Path

# Make the flask-server package importable when run as `python scripts/foo.py`.
SERVER_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVER_DIR.parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

SAMPLE_MD = REPO_ROOT / "sample" / "data-structures-basics.md"


def load_sample_text() -> str:
    return SAMPLE_MD.read_text(encoding="utf-8")
