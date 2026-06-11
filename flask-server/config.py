"""Central configuration, sourced entirely from environment variables.

Nothing secret is hardcoded and nothing secret ever reaches the frontend.
Load order: real environment variables win over values in a local .env file.
"""
import os

from dotenv import load_dotenv

load_dotenv()  # no-op if there is no .env file


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


class Config:
    # LLM
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite").strip()
    LLM_TEMPERATURE = _float("LLM_TEMPERATURE", 0.4)
    LLM_MAX_RETRIES = _int("LLM_MAX_RETRIES", 1)

    # Notion (optional source)
    NOTION_TOKEN = os.getenv("NOTION_TOKEN", "").strip()

    # HTTP / CORS
    ALLOWED_ORIGINS = [
        o.strip()
        for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]
    PORT = _int("PORT", 5000)

    # Limits
    MAX_QUESTIONS = _int("MAX_QUESTIONS", 20)
    MAX_CONTENT_CHARS = _int("MAX_CONTENT_CHARS", 24000)

    @classmethod
    def require_gemini(cls) -> str:
        """Return the Gemini key or raise a clear, actionable error."""
        if not cls.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Copy flask-server/.env.example to "
                "flask-server/.env and add your key from "
                "https://aistudio.google.com/apikey"
            )
        return cls.GEMINI_API_KEY

    @classmethod
    def require_notion(cls) -> str:
        if not cls.NOTION_TOKEN:
            raise RuntimeError(
                "NOTION_TOKEN is not set. Add it to flask-server/.env to use the "
                "Notion source, or use the text/PDF source instead."
            )
        return cls.NOTION_TOKEN


config = Config()
