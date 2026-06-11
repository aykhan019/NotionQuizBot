import json

import pytest

import app as appmod
from quiz.generator import QuizGenerator


class StubProvider:
    """Returns a fixed, valid quiz so the API can be tested without a network."""

    def generate_json(self, prompt, *, temperature, response_schema):
        return json.dumps(
            {
                "quiz": [
                    {
                        "question": "Which structure is LIFO?",
                        "options": ["Queue", "Stack", "Tree", "Graph"],
                        "correct_answer": "Stack",
                        "explanation": "A stack is last-in, first-out.",
                        "topic": "stacks",
                    }
                ]
            }
        )


@pytest.fixture()
def client():
    appmod._generator = QuizGenerator(provider=StubProvider())
    appmod.app.config.update(TESTING=True)
    return appmod.app.test_client()


def test_health(client):
    body = client.get("/api/health").get_json()
    assert body["status"] == "ok"
    assert "model" in body


def test_generate_from_text(client):
    resp = client.post(
        "/api/quiz/generate",
        json={
            "source": "text",
            "content": "A stack is a LIFO structure. A queue is FIFO.",
            "number_of_questions": 3,
            "difficulty": "easy",
        },
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["count"] == 1
    q = body["quiz"][0]
    assert {"question", "options", "correct_answer", "explanation", "topic"} <= q.keys()


def test_empty_content_is_400(client):
    resp = client.post("/api/quiz/generate", json={"source": "text", "content": "  "})
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_bad_difficulty_is_400(client):
    resp = client.post(
        "/api/quiz/generate",
        json={"source": "text", "content": "x", "difficulty": "impossible"},
    )
    assert resp.status_code == 400


def test_unknown_source_is_400(client):
    resp = client.post("/api/quiz/generate", json={"source": "telepathy"})
    assert resp.status_code == 400


def test_notion_requires_page_ids(client):
    resp = client.post("/api/quiz/generate", json={"source": "notion", "notion_page_ids": []})
    assert resp.status_code == 400


def test_pdf_without_file_is_400(client):
    resp = client.post("/api/quiz/generate-pdf", data={})
    assert resp.status_code == 400
