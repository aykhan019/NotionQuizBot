"""A cheap quality gate: generate questions from the sample and check them.

Usage:
    python scripts/eval_quiz.py [--num 8]

Exits non-zero if the model can't produce enough schema-valid, de-duplicated
questions. Handy to run by hand after changing the prompt. Requires GEMINI_API_KEY.
"""
from __future__ import annotations

import argparse
import sys

import _common  # noqa: F401 - sets up sys.path

from providers import LLMError
from quiz.generator import QuizGenerator
from quiz.schema import validate_quiz


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate quiz generation quality.")
    parser.add_argument("--num", type=int, default=8)
    args = parser.parse_args()

    text = _common.load_sample_text()
    try:
        quiz = QuizGenerator().generate(text, args.num, "medium")
    except RuntimeError as exc:
        print(f"Config error: {exc}", file=sys.stderr)
        return 2
    except LLMError as exc:
        print(f"LLM error: {exc}", file=sys.stderr)
        return 1

    checks = []

    # 1. Re-validate against the schema (defense in depth).
    try:
        validate_quiz({"quiz": quiz})
        checks.append(("schema valid", True))
    except Exception as exc:  # noqa: BLE001
        checks.append((f"schema valid ({exc})", False))

    # 2. Got a reasonable number of questions.
    enough = len(quiz) >= max(1, args.num - 2)
    checks.append((f"question count {len(quiz)}/{args.num}", enough))

    # 3. No duplicate question text.
    unique = len({q["question"].strip().lower() for q in quiz}) == len(quiz)
    checks.append(("no duplicate questions", unique))

    print(f"Eval on sample ({len(quiz)} questions):")
    for label, ok in checks:
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}")

    passed = all(ok for _, ok in checks)
    print("\nRESULT:", "PASS" if passed else "FAIL")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
