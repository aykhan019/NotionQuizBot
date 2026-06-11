"""Repository functions — the only place that reads/writes the database."""
from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import insert, select, update

import db


def _new_id() -> str:
    return secrets.token_urlsafe(9)


def _qhash(question_text: str) -> str:
    return hashlib.sha1(question_text.strip().lower().encode("utf-8")).hexdigest()[:40]


# ---- Shareable quizzes ------------------------------------------------------

def save_quiz(quiz: list[dict], source: str, difficulty: str) -> str:
    quiz_id = _new_id()
    with db.engine().begin() as conn:
        conn.execute(
            insert(db.quizzes).values(
                id=quiz_id,
                created_at=datetime.utcnow(),
                source=source,
                difficulty=difficulty,
                questions=quiz,
            )
        )
    return quiz_id


def get_quiz(quiz_id: str) -> dict | None:
    with db.engine().connect() as conn:
        row = conn.execute(
            select(db.quizzes).where(db.quizzes.c.id == quiz_id)
        ).mappings().first()
    if not row:
        return None
    return {
        "id": row["id"],
        "difficulty": row["difficulty"],
        "quiz": row["questions"],
    }


# ---- Attempts (history + mastery) -------------------------------------------

def save_attempt(client_id: str, difficulty: str, results: list[dict]) -> dict:
    attempt_id = _new_id()
    score = sum(1 for r in results if r.get("isCorrect"))
    now = datetime.utcnow()

    with db.engine().begin() as conn:
        conn.execute(
            insert(db.attempts).values(
                id=attempt_id,
                client_id=client_id,
                created_at=now,
                difficulty=difficulty,
                score=score,
                total=len(results),
                results=results,
            )
        )
        # Queue every missed question for spaced review.
        for r in results:
            if not r.get("isCorrect"):
                _enqueue_review(conn, client_id, r, now)

    return {"id": attempt_id, "score": score, "total": len(results)}


def list_attempts(client_id: str, limit: int = 20) -> list[dict]:
    with db.engine().connect() as conn:
        rows = (
            conn.execute(
                select(
                    db.attempts.c.id,
                    db.attempts.c.created_at,
                    db.attempts.c.difficulty,
                    db.attempts.c.score,
                    db.attempts.c.total,
                )
                .where(db.attempts.c.client_id == client_id)
                .order_by(db.attempts.c.created_at.desc())
                .limit(limit)
            )
            .mappings()
            .all()
        )
    return [
        {
            "id": r["id"],
            "created_at": r["created_at"].isoformat() + "Z",
            "difficulty": r["difficulty"],
            "score": r["score"],
            "total": r["total"],
        }
        for r in rows
    ]


def topic_mastery(client_id: str) -> list[dict]:
    """Aggregate correct/total per topic across all of a client's attempts."""
    with db.engine().connect() as conn:
        rows = (
            conn.execute(
                select(db.attempts.c.results).where(
                    db.attempts.c.client_id == client_id
                )
            )
            .scalars()
            .all()
        )

    tally: dict[str, dict] = {}
    for results in rows:
        for r in results or []:
            topic = (r.get("topic") or "General").strip() or "General"
            t = tally.setdefault(topic, {"topic": topic, "correct": 0, "total": 0})
            t["total"] += 1
            if r.get("isCorrect"):
                t["correct"] += 1

    out = []
    for t in tally.values():
        t["pct"] = round(100 * t["correct"] / t["total"]) if t["total"] else 0
        out.append(t)
    # Weakest topics first (lowest %, then most-attempted).
    out.sort(key=lambda t: (t["pct"], -t["total"]))
    return out


# ---- Spaced review (SM-2-lite) ----------------------------------------------

def _review_question(r: dict) -> dict:
    return {
        "question": r.get("question"),
        "options": r.get("options") or r.get("answers"),
        "correct_answer": r.get("correctAnswer") or r.get("correct_answer"),
        "explanation": r.get("explanation"),
        "topic": r.get("topic"),
    }


def _enqueue_review(conn, client_id: str, result: dict, now: datetime) -> None:
    qhash = _qhash(result.get("question", ""))
    existing = conn.execute(
        select(db.review_items.c.id).where(
            db.review_items.c.client_id == client_id,
            db.review_items.c.qhash == qhash,
        )
    ).first()
    if existing:
        # Missed again — make it due now and reset the interval.
        conn.execute(
            update(db.review_items)
            .where(db.review_items.c.id == existing[0])
            .values(due_at=now, interval_days=1, updated_at=now)
        )
        return
    conn.execute(
        insert(db.review_items).values(
            id=_new_id(),
            client_id=client_id,
            qhash=qhash,
            question=_review_question(result),
            topic=result.get("topic"),
            due_at=now,
            interval_days=1,
            reps=0,
            created_at=now,
            updated_at=now,
        )
    )


def due_reviews(client_id: str, limit: int = 20) -> list[dict]:
    now = datetime.utcnow()
    with db.engine().connect() as conn:
        rows = (
            conn.execute(
                select(db.review_items.c.id, db.review_items.c.question)
                .where(
                    db.review_items.c.client_id == client_id,
                    db.review_items.c.due_at <= now,
                )
                .order_by(db.review_items.c.due_at.asc())
                .limit(limit)
            )
            .mappings()
            .all()
        )
    return [{"id": r["id"], **r["question"]} for r in rows]


def review_counts(client_id: str) -> dict:
    from sqlalchemy import func

    now = datetime.utcnow()
    base = select(func.count()).select_from(db.review_items).where(
        db.review_items.c.client_id == client_id
    )
    with db.engine().connect() as conn:
        total = conn.execute(base).scalar() or 0
        due = (
            conn.execute(base.where(db.review_items.c.due_at <= now)).scalar() or 0
        )
    return {"due": due, "total": total}


def grade_review(item_id: str, correct: bool) -> dict:
    """Reschedule a reviewed item. Correct stretches the interval; wrong resets."""
    now = datetime.utcnow()
    with db.engine().begin() as conn:
        row = conn.execute(
            select(db.review_items).where(db.review_items.c.id == item_id)
        ).mappings().first()
        if not row:
            return {"ok": False}

        if correct:
            reps = row["reps"] + 1
            interval = max(1, round(row["interval_days"] * 2.2))
        else:
            reps = 0
            interval = 1
        due = now + timedelta(days=interval)

        conn.execute(
            update(db.review_items)
            .where(db.review_items.c.id == item_id)
            .values(reps=reps, interval_days=interval, due_at=due, updated_at=now)
        )
    return {"ok": True, "interval_days": interval, "due_at": due.isoformat() + "Z"}
