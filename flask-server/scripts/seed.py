"""Run the full pipeline on the bundled sample file and print a quiz.

Usage:
    python scripts/seed.py [--num 5] [--difficulty medium]

Requires GEMINI_API_KEY to be set (see flask-server/.env.example).
Good for a quick smoke test and for the README.
"""
from __future__ import annotations

import argparse
import sys

import _common  # noqa: F401 - sets up sys.path

from providers import LLMError
from quiz.generator import QuizGenerator


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a demo quiz from the sample.")
    parser.add_argument("--num", type=int, default=5)
    parser.add_argument("--difficulty", default="medium", choices=["easy", "medium", "hard"])
    args = parser.parse_args()

    text = _common.load_sample_text()
    print(f"Sample: {_common.SAMPLE_MD.name} ({len(text)} chars)")
    print(f"Generating {args.num} {args.difficulty} questions...\n")

    try:
        quiz = QuizGenerator().generate(text, args.num, args.difficulty)
    except RuntimeError as exc:  # missing key / config
        print(f"Config error: {exc}", file=sys.stderr)
        return 2
    except LLMError as exc:
        print(f"LLM error: {exc}", file=sys.stderr)
        return 1

    for i, q in enumerate(quiz, 1):
        print(f"{i}. [{q['topic']}] {q['question']}")
        for opt in q["options"]:
            mark = "*" if opt == q["correct_answer"] else " "
            print(f"   ({mark}) {opt}")
        print(f"   -> {q['explanation']}\n")

    print(f"Generated {len(quiz)} questions.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
