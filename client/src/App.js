import { useCallback, useEffect, useState } from "react";
import "./styles/theme.css";
import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Nav from "./components/Nav/Nav";
import Setup from "./components/Setup/Setup";
import Quizzes from "./components/Quizzes/Quizzes";
import QNA from "./components/QNA/QNA";
import Loading from "./components/Loading/Loading";
import Progress from "./components/Progress/Progress";
import Calculators from "./components/Calculators/Calculators";
import QuizData from "./classes/QuizData";
import shuffleArray from "./utils/shuffleArray";
import { generateQuiz, generateQuizFromPdf } from "./api/quiz";
import {
  saveSharedQuiz,
  getSharedQuiz,
  saveAttempt,
  getReviewDue,
  getReviewCounts,
  gradeReview,
} from "./api/study";

const VIEW = { PRACTICE: "practice", PROGRESS: "progress", CALC: "calculators" };
const PHASE = { SETUP: "setup", LOADING: "loading", QUIZ: "quiz", REVIEW: "review" };

// raw items use {question, options, correct_answer, explanation, topic, id?}
function toQuizData(raw) {
  const quiz = raw.map(
    (q) =>
      new QuizData(
        q.question,
        q.options,
        q.correct_answer,
        q.explanation,
        q.topic,
        q.id || null
      )
  );
  const shuffled = shuffleArray(quiz);
  shuffled.forEach((q) => {
    q.answers = shuffleArray([...q.answers]);
  });
  return shuffled;
}

export default function App() {
  const [view, setView] = useState(VIEW.PRACTICE);
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [shareUrl, setShareUrl] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewDue, setReviewDue] = useState(0);

  const refreshReviewCount = useCallback(async () => {
    try {
      const c = await getReviewCounts();
      setReviewDue(c.due || 0);
    } catch {
      /* non-fatal */
    }
  }, []);

  // On load: pick up a shared quiz (?quiz=ID) and the review-due badge count.
  useEffect(() => {
    refreshReviewCount();
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("quiz");
    if (sharedId) {
      (async () => {
        setView(VIEW.PRACTICE);
        setPhase(PHASE.LOADING);
        try {
          const data = await getSharedQuiz(sharedId);
          setDifficulty(data.difficulty || "medium");
          setQuestions(toQuizData(data.quiz || []));
          setReviewMode(false);
          setShareUrl(window.location.origin + window.location.pathname + "?quiz=" + sharedId);
          setPhase(PHASE.QUIZ);
        } catch (err) {
          setError(err.message || "That shared quiz couldn't be loaded.");
          setPhase(PHASE.SETUP);
        }
        window.history.replaceState({}, "", window.location.pathname);
      })();
    }
  }, [refreshReviewCount]);

  async function handleGenerate(params) {
    setError("");
    setReviewMode(false);
    setShareUrl("");
    setDifficulty(params.difficulty);
    setPhase(PHASE.LOADING);
    try {
      const response =
        params.source === "pdf"
          ? await generateQuizFromPdf(params)
          : await generateQuiz(params);

      const rawQuiz = response.quiz || [];
      if (rawQuiz.length === 0) {
        setError("The model didn't return any questions. Try richer material.");
        setPhase(PHASE.SETUP);
        return;
      }
      setQuestions(toQuizData(rawQuiz));
      setPhase(PHASE.QUIZ);

      // Best-effort: persist for a shareable link (doesn't block the quiz).
      saveSharedQuiz(rawQuiz, params.difficulty, params.source)
        .then(({ id }) =>
          setShareUrl(
            window.location.origin + window.location.pathname + "?quiz=" + id
          )
        )
        .catch(() => {});
    } catch (err) {
      setError(err.message || "Something went wrong generating the quiz.");
      setPhase(PHASE.SETUP);
    }
  }

  async function handleComplete(quizResults) {
    if (reviewMode) {
      // Each answer was already graded; just refresh and return to Progress.
      setReviewMode(false);
      await refreshReviewCount();
      setView(VIEW.PROGRESS);
      setPhase(PHASE.SETUP);
      return;
    }
    setResults(quizResults);
    setPhase(PHASE.REVIEW);
    saveAttempt(quizResults, difficulty)
      .then(refreshReviewCount)
      .catch(() => {});
  }

  // In review mode, grade each question the moment it's answered.
  function handleAnswered(question, isCorrect) {
    if (reviewMode && question.reviewId) {
      gradeReview(question.reviewId, isCorrect).catch(() => {});
    }
  }

  async function handleStartReview() {
    setError("");
    setView(VIEW.PRACTICE);
    setPhase(PHASE.LOADING);
    try {
      const data = await getReviewDue();
      const items = data.items || [];
      if (items.length === 0) {
        setReviewMode(false);
        setPhase(PHASE.SETUP);
        setView(VIEW.PROGRESS);
        return;
      }
      setReviewMode(true);
      setShareUrl("");
      setQuestions(toQuizData(items));
      setPhase(PHASE.QUIZ);
    } catch (err) {
      setError(err.message || "Couldn't start your review.");
      setPhase(PHASE.SETUP);
    }
  }

  function handleRetryWrong() {
    const wrong = results.filter((r) => !r.isCorrect);
    if (wrong.length === 0) return;
    const retry = wrong.map(
      (r) => new QuizData(r.question, r.answers, r.correctAnswer, r.explanation, r.topic)
    );
    setReviewMode(false);
    setQuestions(shuffleArray(retry));
    setPhase(PHASE.QUIZ);
  }

  function handleRestart() {
    setQuestions([]);
    setResults([]);
    setError("");
    setShareUrl("");
    setReviewMode(false);
    setPhase(PHASE.SETUP);
  }

  function changeView(next) {
    setView(next);
    if (next !== VIEW.PRACTICE && phase === PHASE.LOADING) setPhase(PHASE.SETUP);
  }

  const wide = view !== VIEW.PRACTICE || phase === PHASE.REVIEW;

  return (
    <div className="app-container">
      <Header />
      <main className={`main-content container${wide ? " container-wide" : ""}`}>
        <Nav view={view} onChange={changeView} reviewDue={reviewDue} />

        {view === VIEW.PRACTICE && (
          <>
            {error && phase === PHASE.SETUP && (
              <div className="banner banner-danger fade-up" style={{ marginBottom: 20 }}>
                <div className="banner-title">Couldn't generate a quiz</div>
                <div>{error}</div>
              </div>
            )}
            {phase === PHASE.SETUP && <Setup onGenerate={handleGenerate} />}
            {phase === PHASE.LOADING && <Loading />}
            {phase === PHASE.QUIZ && (
              <Quizzes
                questions={questions}
                onComplete={handleComplete}
                onAnswered={handleAnswered}
                title={reviewMode ? "Review" : undefined}
              />
            )}
            {phase === PHASE.REVIEW && (
              <QNA
                results={results}
                onRetryWrong={handleRetryWrong}
                onRestart={handleRestart}
                shareUrl={shareUrl}
              />
            )}
          </>
        )}

        {view === VIEW.PROGRESS && (
          <Progress
            onStartReview={handleStartReview}
            onStartQuiz={() => {
              handleRestart();
              setView(VIEW.PRACTICE);
            }}
          />
        )}

        {view === VIEW.CALC && <Calculators />}
      </main>
      <Footer />
    </div>
  );
}
