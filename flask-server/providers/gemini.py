"""Gemini Flash-Lite provider, talking to the REST API directly.

We use plain ``requests`` (no heavy SDK) and Gemini's structured-output feature
(``responseMimeType: application/json`` + ``responseSchema``) so the model is
constrained to valid JSON at the source.
"""
from __future__ import annotations

import requests

from config import config

from .base import LLMError, QuizProvider

_API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"
_TIMEOUT_SECONDS = 60


class GeminiProvider(QuizProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or config.require_gemini()
        self.model = model or config.GEMINI_MODEL

    def generate_json(
        self, prompt: str, *, temperature: float, response_schema: dict
    ) -> str:
        url = f"{_API_ROOT}/{self.model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
                "responseSchema": response_schema,
            },
        }

        try:
            resp = requests.post(
                url,
                params={"key": self.api_key},
                json=payload,
                timeout=_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            raise LLMError(f"Could not reach Gemini: {exc}") from exc

        if resp.status_code == 401 or resp.status_code == 403:
            raise LLMError("Gemini rejected the API key (check GEMINI_API_KEY).")
        if resp.status_code == 429:
            raise LLMError("Gemini rate limit / quota exceeded. Try again shortly.")
        if not resp.ok:
            raise LLMError(f"Gemini error {resp.status_code}: {resp.text[:300]}")

        return self._extract_text(resp.json())

    @staticmethod
    def _extract_text(body: dict) -> str:
        candidates = body.get("candidates") or []
        if not candidates:
            blocked = body.get("promptFeedback", {}).get("blockReason")
            if blocked:
                raise LLMError(f"Gemini blocked the prompt ({blocked}).")
            raise LLMError("Gemini returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts") or []
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            raise LLMError("Gemini returned an empty response.")
        return text
