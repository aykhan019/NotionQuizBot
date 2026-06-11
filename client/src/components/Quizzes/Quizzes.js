import { useState } from "react";
import "./Quizzes.css";
import getLetter from "../../utils/getLetter";
import checkResults from "../../utils/checkResults";

// Runs through the questions one at a time, revealing whether each answer was
// right (with its explanation) immediately after it's picked.
export default function Quizzes({ questions, onComplete, onAnswered, title }) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userResponses, setUserResponses] = useState(
    Array(questions.length).fill(null)
  );

  const current = questions[questionIndex];
  const selected = userResponses[questionIndex];
  const revealed = selected !== null; // feedback shows once an answer is chosen
  const isLast = questionIndex === questions.length - 1;
  const isCorrect = selected === current.correctAnswer;
  const progress = ((questionIndex + (revealed ? 1 : 0)) / questions.length) * 100;

  function selectAnswer(answer) {
    if (revealed) return; // lock the choice once made
    const updated = [...userResponses];
    updated[questionIndex] = answer;
    setUserResponses(updated);
    // Notify once, when the answer is first chosen (used by review mode).
    if (onAnswered) onAnswered(current, answer === current.correctAnswer);
  }

  function next() {
    if (isLast) {
      const { results } = checkResults(userResponses, questions);
      onComplete(results);
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  }

  function optionState(option) {
    if (!revealed) return selected === option ? "selected" : "";
    if (option === current.correctAnswer) return "correct";
    if (option === selected) return "wrong";
    return "dim";
  }

  return (
    <div className="quiz fade-up">
      <div className="quiz-top">
        <span className="muted quiz-counter">
          {title ? `${title} · ` : ""}Question {questionIndex + 1} of {questions.length}
        </span>
        {current.topic && <span className="chip">{current.topic}</span>}
      </div>
      <div className="progress">
        <span className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="card card-pad quiz-card" key={questionIndex}>
        <h2 className="quiz-question">{current.question}</h2>

        <div className="options">
          {current.answers.map((option, i) => {
            const state = optionState(option);
            return (
              <button
                key={i}
                className={`option ${state}`}
                onClick={() => selectAnswer(option)}
                disabled={revealed}
              >
                <span className="option-letter">{getLetter(i)}</span>
                <span className="option-text">{option}</span>
                {state === "correct" && <span className="option-mark">✓</span>}
                {state === "wrong" && <span className="option-mark">✕</span>}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div
            className={`banner ${isCorrect ? "banner-success" : "banner-danger"} quiz-feedback`}
          >
            <div className="banner-title">
              {isCorrect ? "✓ Correct" : "✕ Not quite"}
            </div>
            {!isCorrect && (
              <p className="quiz-feedback-line">
                Correct answer: <strong>{current.correctAnswer}</strong>
              </p>
            )}
            {current.explanation && (
              <p className="quiz-feedback-line">{current.explanation}</p>
            )}
          </div>
        )}
      </div>

      <div className="quiz-actions">
        <button
          className="btn btn-primary btn-lg"
          onClick={next}
          disabled={!revealed}
        >
          {isLast ? "See results →" : "Next →"}
        </button>
      </div>
    </div>
  );
}
