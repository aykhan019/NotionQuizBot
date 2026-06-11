import "./QNA.css";

// Review screen: score summary plus a per-question breakdown that includes the
// explanation and topic, so a wrong answer becomes something you learn from.
export default function QNA({ results, onRetryWrong, onRestart }) {
  const correct = results.filter((r) => r.isCorrect).length;
  const total = results.length;
  const wrong = total - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;
  const passed = percent >= 50;

  return (
    <div className="qna fade-up">
      <div className="card card-pad qna-summary">
        <div className="qna-score">
          <div
            className="qna-ring"
            style={{
              background: `conic-gradient(${
                passed ? "var(--success)" : "var(--danger)"
              } ${percent * 3.6}deg, var(--bg-tint) 0deg)`,
            }}
          >
            <div className="qna-ring-inner">
              <span className="qna-percent">{percent}%</span>
              <span className="muted qna-ratio">
                {correct}/{total}
              </span>
            </div>
          </div>
          <div className="qna-head">
            <h2 className="qna-title">
              {passed ? "Nice work!" : "Keep at it"}
            </h2>
            <p className="muted">
              {correct} correct · {wrong} to review
            </p>
            <div className="qna-actions">
              {wrong > 0 && (
                <button className="btn btn-warning" onClick={onRetryWrong}>
                  ↻ Retry {wrong} wrong {wrong === 1 ? "one" : "ones"}
                </button>
              )}
              <button className="btn btn-primary" onClick={onRestart}>
                New quiz
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="qna-list">
        {results.map((item, i) => (
          <div
            key={i}
            className={`card qna-item ${item.isCorrect ? "is-correct" : "is-wrong"}`}
          >
            <div className="qna-item-head">
              <span className={`qna-flag ${item.isCorrect ? "ok" : "no"}`}>
                {item.isCorrect ? "✓" : "✕"}
              </span>
              <span className="qna-q">
                {i + 1}. {item.question}
              </span>
              {item.topic && <span className="chip qna-topic">{item.topic}</span>}
            </div>

            <div className="qna-answers">
              {!item.isCorrect && (
                <div className="qna-answer">
                  <span className="muted qna-answer-label">Your answer</span>
                  <span className="qna-answer-val wrong">{item.userResponse}</span>
                </div>
              )}
              <div className="qna-answer">
                <span className="muted qna-answer-label">
                  {item.isCorrect ? "Your answer" : "Correct"}
                </span>
                <span className="qna-answer-val ok">{item.correctAnswer}</span>
              </div>
            </div>

            {item.explanation && (
              <p className="qna-explain">{item.explanation}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
