"""Database layer (SQLAlchemy Core).

Same code runs on SQLite (local/dev/CI) and Postgres/Neon (production) — only
the DATABASE_URL changes. We use Core (not the ORM) to keep it small and explicit.
"""
from __future__ import annotations

from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Integer,
    MetaData,
    String,
    Table,
    create_engine,
)
from sqlalchemy.engine import Engine
from sqlalchemy.pool import StaticPool

from config import config

metadata = MetaData()

# Shareable quizzes: a generated quiz saved so it can be opened by a link.
quizzes = Table(
    "quizzes",
    metadata,
    Column("id", String(24), primary_key=True),
    Column("created_at", DateTime, nullable=False),
    Column("source", String(20)),
    Column("difficulty", String(10)),
    Column("questions", JSON, nullable=False),
)

# One row per completed quiz, used for history + topic mastery.
attempts = Table(
    "attempts",
    metadata,
    Column("id", String(24), primary_key=True),
    Column("client_id", String(64), index=True, nullable=False),
    Column("created_at", DateTime, nullable=False),
    Column("difficulty", String(10)),
    Column("score", Integer, nullable=False),
    Column("total", Integer, nullable=False),
    Column("results", JSON, nullable=False),
)

# Spaced-repetition queue of missed questions (SM-2-lite).
review_items = Table(
    "review_items",
    metadata,
    Column("id", String(24), primary_key=True),
    Column("client_id", String(64), index=True, nullable=False),
    Column("qhash", String(40), index=True, nullable=False),
    Column("question", JSON, nullable=False),
    Column("topic", String(120)),
    Column("due_at", DateTime, nullable=False),
    Column("interval_days", Integer, nullable=False, default=1),
    Column("reps", Integer, nullable=False, default=0),
    Column("created_at", DateTime, nullable=False),
    Column("updated_at", DateTime, nullable=False),
)

_engine: Engine | None = None


def configure(url: str | None = None) -> Engine:
    """(Re)create the engine and ensure tables exist. Returns the engine."""
    global _engine
    target = url or config.DATABASE_URL

    if target.startswith("sqlite") and ":memory:" in target:
        # Keep a single shared in-memory DB across connections/threads (tests).
        _engine = create_engine(
            target,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            future=True,
        )
    else:
        connect_args = {}
        if target.startswith("sqlite"):
            connect_args = {"check_same_thread": False}
        _engine = create_engine(
            target, connect_args=connect_args, pool_pre_ping=True, future=True
        )

    metadata.create_all(_engine)
    return _engine


def engine() -> Engine:
    """Return the engine, creating it (and the schema) on first use."""
    if _engine is None:
        return configure()
    return _engine
