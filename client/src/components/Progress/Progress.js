import { useEffect, useState } from "react";
import "./Progress.css";
import Loading from "../Loading/Loading";
import { getAttempts, getMastery, getReviewCounts } from "../../api/study";

function barColor(pct) {
  if (pct >= 75) return "var(--success)";
  if (pct >= 50) return "var(--warning)";
  return "var(--danger)";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function Progress({ onStartReview, onStartQuiz }) {
  const [state, setState] = useState({ loading: true, error: "" });
  const [topics, setTopics] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [due, setDue] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, a, c] = await Promise.all([
          getMastery(),
          getAttempts(),
          getReviewCounts(),
        ]);
        if (!alive) return;
        setTopics(m.topics || []);
        setAttempts(a.attempts || []);
        setDue(c.due || 0);
        setState({ loading: false, error: "" });
      } catch (err) {
        if (alive) setState({ loading: false, error: err.message });
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state.loading) return <Loading />;
  if (state.error)
    return (
      <div className="banner banner-danger">
        <div className="banner-title">Couldn't load your progress</div>
        <div>{state.error}</div>
      </div>
    );

  const noData = attempts.length === 0;

  return (
    <div className="progress-view fade-up">
      <div className="progress-head">
        <span className="eyebrow">Your progress</span>
        <h1 className="progress-h1">Study dashboard</h1>
      </div>

      {noData ? (
        <div className="card card-pad progress-empty">
          <div className="progress-empty-icon">📊</div>
          <h3>No attempts yet</h3>
          <p className="muted">
            Take a quiz and your topic mastery and history will show up here.
          </p>
          <button className="btn btn-primary" onClick={onStartQuiz}>
            Make a quiz
          </button>
        </div>
      ) : (
        <>
          {due > 0 && (
            <div className="card card-pad review-cta">
              <div>
                <div className="review-cta-title">
                  {due} question{due === 1 ? "" : "s"} due for review
                </div>
                <div className="muted">
                  Questions you missed, resurfaced on a spaced schedule.
                </div>
              </div>
              <button className="btn btn-primary" onClick={onStartReview}>
                ↻ Review now
              </button>
            </div>
          )}

          <div className="card card-pad">
            <h3 className="section-title">Topic mastery</h3>
            <p className="muted section-sub">Weakest topics first — focus here.</p>
            <div className="mastery-list">
              {topics.map((t) => (
                <div className="mastery-row" key={t.topic}>
                  <span className="mastery-topic">{t.topic}</span>
                  <div className="mastery-track">
                    <span
                      className="mastery-fill"
                      style={{ width: `${t.pct}%`, background: barColor(t.pct) }}
                    />
                  </div>
                  <span className="mastery-pct">
                    {t.pct}% <span className="muted">({t.correct}/{t.total})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="section-title">Recent quizzes</h3>
            <div className="history-list">
              {attempts.map((a) => {
                const pct = a.total ? Math.round((a.score / a.total) * 100) : 0;
                return (
                  <div className="history-row" key={a.id}>
                    <span className="muted history-date">
                      {formatDate(a.created_at)}
                    </span>
                    <span className="chip history-diff">{a.difficulty}</span>
                    <span className="history-score">
                      {a.score}/{a.total}
                    </span>
                    <span
                      className="history-pct"
                      style={{ color: barColor(pct) }}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
