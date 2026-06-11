"""Turn a block of course material into a validated, de-duplicated quiz."""
from __future__ import annotations

import json
import re
from difflib import SequenceMatcher

from config import config
from providers import LLMError, QuizProvider, get_provider

from .schema import GEMINI_RESPONSE_SCHEMA, QuizValidationError, validate_quiz

DIFFICULTIES = ("easy", "medium", "hard")

_DIFFICULTY_GUIDANCE = {
    "easy": "Focus on definitions and recall of key terms. Keep wording simple.",
    "medium": "Mix recall with understanding: comparisons, 'why', and applying a concept.",
    "hard": "Emphasize application, analysis, and edge cases. Avoid trick questions.",
}


def _build_prompt(text: str, n: int, difficulty: str) -> str:
    guidance = _DIFFICULTY_GUIDANCE[difficulty]
    return f"""You are a study assistant that writes multiple-choice quizzes from \
course material.

Write exactly {n} multiple-choice questions based ONLY on the material below.
Difficulty: {difficulty}. {guidance}

Rules for every question:
- 3 to 5 answer options; exactly one is correct.
- "correct_answer" must be copied verbatim from "options".
- "explanation": one or two sentences saying why the correct answer is right.
- "topic": a short (1-4 word) tag naming the concept the question tests.
- Cover different parts of the material; do not repeat or near-repeat questions.
- Use only information present in the material. Do not invent facts.
- Write everything in the same language as the material.

Course material:
\"\"\"
{text}
\"\"\"
"""


def _normalize(s: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", s.lower()).strip()


def _dedupe(questions: list[dict], threshold: float = 0.9) -> list[dict]:
    """Drop exact and near-identical questions (by normalized question text)."""
    kept: list[dict] = []
    seen_norm: list[str] = []
    for q in questions:
        norm = _normalize(q["question"])
        if not norm:
            continue
        if any(
            norm == s or SequenceMatcher(None, norm, s).ratio() >= threshold
            for s in seen_norm
        ):
            continue
        seen_norm.append(norm)
        kept.append(q)
    return kept


def _parse(raw: str) -> dict:
    """Parse model text into JSON, tolerating ```json fences if present."""
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


class QuizGenerator:
    def __init__(self, provider: QuizProvider | None = None):
        # Provider is created lazily on first use so the app (and /api/health)
        # can import without a Gemini key present.
        self._provider = provider

    @property
    def provider(self) -> QuizProvider:
        if self._provider is None:
            self._provider = get_provider()
        return self._provider

    def generate(self, text: str, number_of_questions: int, difficulty: str) -> list[dict]:
        text = (text or "").strip()
        if not text:
            raise ValueError("No content to generate a quiz from.")
        if difficulty not in DIFFICULTIES:
            raise ValueError(f"difficulty must be one of {DIFFICULTIES}")

        n = max(1, min(int(number_of_questions), config.MAX_QUESTIONS))
        text = text[: config.MAX_CONTENT_CHARS]

        # Ask for a few extra so dedupe/trim still leaves us with enough.
        ask_for = min(n + 3, config.MAX_QUESTIONS + 3)
        prompt = _build_prompt(text, ask_for, difficulty)

        last_error: Exception | None = None
        for attempt in range(config.LLM_MAX_RETRIES + 1):
            try:
                raw = self.provider.generate_json(
                    prompt,
                    temperature=config.LLM_TEMPERATURE,
                    response_schema=GEMINI_RESPONSE_SCHEMA,
                )
                questions = validate_quiz(_parse(raw))
                questions = _dedupe(questions)
                if not questions:
                    raise QuizValidationError("No usable questions after de-duplication.")
                return questions[:n]
            except (json.JSONDecodeError, QuizValidationError) as exc:
                last_error = exc  # malformed output -> retry once
            except LLMError:
                raise  # transport/auth/quota errors are not worth retrying blindly

        raise QuizValidationError(
            f"Model did not return a valid quiz after "
            f"{config.LLM_MAX_RETRIES + 1} attempt(s): {last_error}"
        )
