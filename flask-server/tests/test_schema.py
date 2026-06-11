import pytest

from quiz.schema import QuizValidationError, validate_quiz


def _q(**overrides):
    base = {
        "question": "What is the time complexity of binary search?",
        "options": ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
        "correct_answer": "O(log n)",
        "explanation": "It halves the search space on each step.",
        "topic": "complexity",
    }
    base.update(overrides)
    return base


def test_valid_quiz_returns_questions():
    questions = validate_quiz({"quiz": [_q()]})
    assert len(questions) == 1
    assert questions[0]["topic"] == "complexity"


def test_correct_answer_must_be_in_options():
    with pytest.raises(QuizValidationError):
        validate_quiz({"quiz": [_q(correct_answer="O(definitely not)")]})


def test_explanation_and_topic_are_required():
    bad = _q()
    del bad["explanation"]
    with pytest.raises(QuizValidationError):
        validate_quiz({"quiz": [bad]})


def test_options_need_at_least_two():
    with pytest.raises(QuizValidationError):
        validate_quiz({"quiz": [_q(options=["only one"], correct_answer="only one")]})


def test_missing_quiz_key_rejected():
    with pytest.raises(QuizValidationError):
        validate_quiz({"questions": []})
