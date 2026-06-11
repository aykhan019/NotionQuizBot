"""The single source of truth for what a quiz question looks like.

Two representations of the same shape live here:

* ``QUIZ_JSON_SCHEMA`` - a standard JSON Schema used to validate model output
  *server-side* (defense in depth, provider-agnostic).
* ``GEMINI_RESPONSE_SCHEMA`` - the same shape in Gemini's ``responseSchema``
  dialect, used to constrain the model *at generation time* so it (almost)
  always returns valid JSON.

Every question carries an ``explanation`` and a ``topic`` on purpose: that is
what turns this from a trivia toy into a study tool.
"""
from __future__ import annotations

from jsonschema import Draft7Validator

# ---- Server-side validation (standard JSON Schema) --------------------------

QUESTION_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["question", "options", "correct_answer", "explanation", "topic"],
    "properties": {
        "question": {"type": "string", "minLength": 1},
        "options": {
            "type": "array",
            "items": {"type": "string", "minLength": 1},
            "minItems": 2,
            "maxItems": 6,
        },
        "correct_answer": {"type": "string", "minLength": 1},
        "explanation": {"type": "string", "minLength": 1},
        "topic": {"type": "string", "minLength": 1},
    },
}

QUIZ_JSON_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["quiz"],
    "properties": {
        "quiz": {
            "type": "array",
            "items": QUESTION_JSON_SCHEMA,
            "minItems": 1,
        }
    },
}

_validator = Draft7Validator(QUIZ_JSON_SCHEMA)


class QuizValidationError(ValueError):
    """Raised when model output does not match the quiz schema."""


def validate_quiz(data: dict) -> list[dict]:
    """Validate ``data`` against the schema and return the list of questions.

    Beyond the structural schema, this enforces the cross-field rule that the
    ``correct_answer`` must be one of the listed ``options`` - the single most
    common way LLM quiz output is subtly wrong.
    """
    errors = sorted(_validator.iter_errors(data), key=lambda e: e.path)
    if errors:
        first = errors[0]
        path = "/".join(str(p) for p in first.path) or "<root>"
        raise QuizValidationError(f"{path}: {first.message}")

    questions = data["quiz"]
    for i, q in enumerate(questions):
        if q["correct_answer"] not in q["options"]:
            raise QuizValidationError(
                f"quiz/{i}: correct_answer is not one of the options"
            )
    return questions


# ---- Gemini structured-output schema (Gemini's own dialect) -----------------
# Uppercase types + propertyOrdering are what the Gemini API expects.

GEMINI_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "quiz": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "question": {"type": "STRING"},
                    "options": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "correct_answer": {"type": "STRING"},
                    "explanation": {"type": "STRING"},
                    "topic": {"type": "STRING"},
                },
                "required": [
                    "question",
                    "options",
                    "correct_answer",
                    "explanation",
                    "topic",
                ],
                "propertyOrdering": [
                    "question",
                    "options",
                    "correct_answer",
                    "explanation",
                    "topic",
                ],
            },
        }
    },
    "required": ["quiz"],
}
