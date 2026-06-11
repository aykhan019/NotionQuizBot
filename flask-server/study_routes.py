"""Study features: shareable quizzes, attempt history, topic mastery, and a
spaced-repetition review queue. All backed by the database in store.py.

There is no login. Each browser generates an anonymous client id (stored in
localStorage) and sends it as the `X-Client-Id` header; data is scoped to it.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

import store

study = Blueprint("study", __name__, url_prefix="/api")


def _client_id() -> str:
    cid = request.headers.get("X-Client-Id") or request.args.get("clientId")
    if not cid:
        body = request.get_json(silent=True) or {}
        cid = body.get("clientId")
    if not cid or not isinstance(cid, str) or len(cid) > 64:
        raise ValueError("Missing or invalid client id.")
    return cid


@study.errorhandler(ValueError)
def _bad_request(exc):
    return jsonify({"error": str(exc)}), 400


# ---- Shareable quizzes ------------------------------------------------------

@study.post("/quizzes")
def create_shared_quiz():
    data = request.get_json(silent=True) or {}
    quiz = data.get("quiz")
    if not isinstance(quiz, list) or not quiz:
        raise ValueError("Provide a non-empty 'quiz'.")
    quiz_id = store.save_quiz(
        quiz, source=data.get("source", "text"), difficulty=data.get("difficulty", "medium")
    )
    return jsonify({"id": quiz_id})


@study.get("/quizzes/<quiz_id>")
def fetch_shared_quiz(quiz_id):
    quiz = store.get_quiz(quiz_id)
    if not quiz:
        return jsonify({"error": "Quiz not found."}), 404
    return jsonify(quiz)


# ---- Attempts: history + mastery --------------------------------------------

@study.post("/attempts")
def create_attempt():
    data = request.get_json(silent=True) or {}
    cid = _client_id()
    results = data.get("results")
    if not isinstance(results, list) or not results:
        raise ValueError("Provide a non-empty 'results' list.")
    out = store.save_attempt(cid, data.get("difficulty", "medium"), results)
    return jsonify(out)


@study.get("/attempts")
def list_attempts():
    return jsonify({"attempts": store.list_attempts(_client_id())})


@study.get("/mastery")
def mastery():
    return jsonify({"topics": store.topic_mastery(_client_id())})


# ---- Spaced review ----------------------------------------------------------

@study.get("/review/due")
def review_due():
    cid = _client_id()
    return jsonify(
        {"items": store.due_reviews(cid), "counts": store.review_counts(cid)}
    )


@study.get("/review/counts")
def review_counts():
    return jsonify(store.review_counts(_client_id()))


@study.post("/review/grade")
def review_grade():
    data = request.get_json(silent=True) or {}
    item_id = data.get("id")
    if not item_id:
        raise ValueError("Provide the review item 'id'.")
    return jsonify(store.grade_review(item_id, bool(data.get("correct"))))
