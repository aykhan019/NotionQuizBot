import pytest

import app as appmod
import db

CID = "test-client-123"


@pytest.fixture()
def client():
    # Fresh in-memory database per test.
    db.configure("sqlite:///:memory:")
    appmod.app.config.update(TESTING=True)
    return appmod.app.test_client()


def _attempt_body():
    return {
        "difficulty": "easy",
        "results": [
            {
                "question": "Which structure is LIFO?",
                "options": ["Queue", "Stack"],
                "correctAnswer": "Stack",
                "userResponse": "Queue",
                "explanation": "A stack is last-in, first-out.",
                "topic": "stacks",
                "isCorrect": False,
            },
            {
                "question": "Which structure is FIFO?",
                "options": ["Queue", "Stack"],
                "correctAnswer": "Queue",
                "userResponse": "Queue",
                "explanation": "A queue is first-in, first-out.",
                "topic": "queues",
                "isCorrect": True,
            },
        ],
    }


def test_share_quiz_roundtrip(client):
    quiz = [
        {
            "question": "Q",
            "options": ["a", "b"],
            "correct_answer": "a",
            "explanation": "e",
            "topic": "t",
        }
    ]
    rid = client.post("/api/quizzes", json={"quiz": quiz, "difficulty": "easy"}).get_json()
    assert "id" in rid

    got = client.get(f"/api/quizzes/{rid['id']}")
    assert got.status_code == 200
    assert got.get_json()["quiz"][0]["question"] == "Q"


def test_unknown_quiz_is_404(client):
    assert client.get("/api/quizzes/nope").status_code == 404


def test_attempt_requires_client_id(client):
    resp = client.post("/api/attempts", json=_attempt_body())
    assert resp.status_code == 400


def test_attempt_then_mastery_and_review(client):
    headers = {"X-Client-Id": CID}

    a = client.post("/api/attempts", json=_attempt_body(), headers=headers)
    assert a.status_code == 200
    assert a.get_json()["score"] == 1

    mastery = client.get("/api/mastery", headers=headers).get_json()["topics"]
    # Weakest topic first.
    assert mastery[0]["topic"] == "stacks"
    assert mastery[0]["pct"] == 0

    due = client.get("/api/review/due", headers=headers).get_json()
    assert due["counts"]["due"] == 1
    assert len(due["items"]) == 1

    item_id = due["items"][0]["id"]
    graded = client.post(
        "/api/review/grade", json={"id": item_id, "correct": True}, headers=headers
    ).get_json()
    assert graded["ok"] is True

    # No longer due after a correct grade.
    assert client.get("/api/review/due", headers=headers).get_json()["counts"]["due"] == 0


def test_attempt_history(client):
    headers = {"X-Client-Id": CID}
    client.post("/api/attempts", json=_attempt_body(), headers=headers)
    attempts = client.get("/api/attempts", headers=headers).get_json()["attempts"]
    assert len(attempts) == 1
    assert attempts[0]["total"] == 2
