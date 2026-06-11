"""Flask API: course material in, validated practice quiz out.

Endpoints
    GET  /api/health
    POST /api/quiz/generate       JSON: text or Notion source
    POST /api/quiz/generate-pdf   multipart: an uploaded PDF

Secrets (Gemini key, Notion token) live only here, in the environment.
The frontend never holds an API key.
"""
import logging

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import config
from providers import LLMError
from quiz.generator import DIFFICULTIES, QuizGenerator
from quiz.schema import QuizValidationError
from sources.pdf import PDFParseError, extract_text_from_pdf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("quizbot")

app = Flask(__name__)
CORS(app, origins=config.ALLOWED_ORIGINS)

# 10 MB cap on uploads — generous for lecture PDFs, a guard against abuse.
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

_generator = QuizGenerator()


class ApiError(Exception):
    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def _coerce_count(value, default: int = 10) -> int:
    try:
        n = int(value if value is not None else default)
    except (TypeError, ValueError):
        raise ApiError("number_of_questions must be an integer.")
    if n < 1:
        raise ApiError("number_of_questions must be at least 1.")
    return min(n, config.MAX_QUESTIONS)


def _coerce_difficulty(value) -> str:
    difficulty = (value or "medium").lower()
    if difficulty not in DIFFICULTIES:
        raise ApiError(f"difficulty must be one of {', '.join(DIFFICULTIES)}.")
    return difficulty


def _build_and_respond(text: str, count: int, difficulty: str):
    if not text or not text.strip():
        raise ApiError("No usable text found in the provided content.")
    quiz = _generator.generate(text, count, difficulty)
    return jsonify({"quiz": quiz, "count": len(quiz), "difficulty": difficulty})


@app.errorhandler(ApiError)
def _handle_api_error(exc: ApiError):
    return jsonify({"error": str(exc)}), exc.status


@app.errorhandler(413)
def _handle_too_large(_exc):
    return jsonify({"error": "Uploaded file is too large (max 10 MB)."}), 413


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "model": config.GEMINI_MODEL,
            "gemini_configured": bool(config.GEMINI_API_KEY),
            "notion_configured": bool(config.NOTION_TOKEN),
        }
    )


@app.post("/api/quiz/generate")
def generate_quiz():
    data = request.get_json(silent=True) or {}
    source = (data.get("source") or "text").lower()
    count = _coerce_count(data.get("number_of_questions"))
    difficulty = _coerce_difficulty(data.get("difficulty"))

    if source == "text":
        text = data.get("content", "")
        if not isinstance(text, str) or not text.strip():
            raise ApiError("Provide course material in 'content'.")
        return _build_and_respond(text, count, difficulty)

    if source == "notion":
        page_ids = data.get("notion_page_ids")
        if not isinstance(page_ids, list) or not page_ids:
            raise ApiError("Provide 'notion_page_ids' as a non-empty list.")
        from sources.notion import NotionDataFetcher, NotionSourceError

        try:
            text = NotionDataFetcher(page_ids).fetch_text()
        except (NotionSourceError, RuntimeError) as exc:
            raise ApiError(str(exc), status=502)
        return _build_and_respond(text, count, difficulty)

    raise ApiError("source must be 'text' or 'notion'.")


@app.post("/api/quiz/generate-pdf")
def generate_quiz_pdf():
    if "file" not in request.files:
        raise ApiError("Attach a PDF in the 'file' field.")
    upload = request.files["file"]
    if not upload.filename:
        raise ApiError("No file selected.")

    count = _coerce_count(request.form.get("number_of_questions"))
    difficulty = _coerce_difficulty(request.form.get("difficulty"))

    try:
        text = extract_text_from_pdf(upload.read())
    except PDFParseError as exc:
        raise ApiError(str(exc))
    return _build_and_respond(text, count, difficulty)


# Translate the deeper layers' errors into clean HTTP responses.
@app.errorhandler(QuizValidationError)
def _handle_validation(exc: QuizValidationError):
    logger.warning("Quiz validation failed: %s", exc)
    return jsonify({"error": f"The model returned an unusable quiz: {exc}"}), 502


@app.errorhandler(LLMError)
def _handle_llm(exc: LLMError):
    logger.warning("LLM error: %s", exc)
    return jsonify({"error": str(exc)}), 502


@app.errorhandler(ValueError)
def _handle_value(exc: ValueError):
    return jsonify({"error": str(exc)}), 400


@app.errorhandler(RuntimeError)
def _handle_runtime(exc: RuntimeError):
    # e.g. a missing GEMINI_API_KEY surfaced from config.require_*(): a server
    # misconfiguration, reported clearly instead of a bare 500 traceback.
    logger.error("Server configuration error: %s", exc)
    return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)
