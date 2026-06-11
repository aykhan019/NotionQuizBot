"""Pluggable LLM providers.

The rest of the app talks to ``QuizProvider`` only, so swapping Gemini for a
local model (Ollama) or another hosted API is a one-file change here - no
changes to the generator, routes, or schema.
"""
from .base import LLMError, QuizProvider
from .gemini import GeminiProvider


def get_provider() -> QuizProvider:
    """Return the configured provider. Today: Gemini Flash-Lite."""
    return GeminiProvider()


__all__ = ["QuizProvider", "GeminiProvider", "LLMError", "get_provider"]
