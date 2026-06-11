import { useState } from "react";
import "./styles/theme.css";
import "./App.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";
import Setup from "./components/Setup/Setup";
import Quizzes from "./components/Quizzes/Quizzes";
import QNA from "./components/QNA/QNA";
import Loading from "./components/Loading/Loading";
import QuizData from "./classes/QuizData";
import shuffleArray from "./utils/shuffleArray";
import { generateQuiz, generateQuizFromPdf } from "./api/quiz";

// App phases: pick a source -> wait -> take the quiz -> review answers.
const PHASE = { SETUP: "setup", LOADING: "loading", QUIZ: "quiz", REVIEW: "review" };

function toQuizData(raw) {
  const quiz = raw.map(
    (q) => new QuizData(q.question, q.options, q.correct_answer, q.explanation, q.topic)
  );
  const shuffled = shuffleArray(quiz);
  shuffled.forEach((q) => {
    q.answers = shuffleArray([...q.answers]);
  });
  return shuffled;
}

export default function App() {
  const [phase, setPhase] = useState(PHASE.SETUP);
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function handleGenerate(params) {
    setError("");
    setPhase(PHASE.LOADING);
    try {
      const response =
        params.source === "pdf"
          ? await generateQuizFromPdf(params)
          : await generateQuiz(params);

      const quiz = toQuizData(response.quiz || []);
      if (quiz.length === 0) {
        setError("The model didn't return any questions. Try richer material.");
        setPhase(PHASE.SETUP);
        return;
      }
      setQuestions(quiz);
      setPhase(PHASE.QUIZ);
    } catch (err) {
      setError(err.message || "Something went wrong generating the quiz.");
      setPhase(PHASE.SETUP);
    }
  }

  function handleComplete(quizResults) {
    setResults(quizResults);
    setPhase(PHASE.REVIEW);
  }

  // Rebuild a quiz from only the questions answered incorrectly.
  function handleRetryWrong() {
    const wrong = results.filter((r) => !r.isCorrect);
    if (wrong.length === 0) return;
    const retry = wrong.map(
      (r) => new QuizData(r.question, r.answers, r.correctAnswer, r.explanation, r.topic)
    );
    setQuestions(retry);
    setPhase(PHASE.QUIZ);
  }

  function handleRestart() {
    setQuestions([]);
    setResults([]);
    setError("");
    setPhase(PHASE.SETUP);
  }

  const wide = phase === PHASE.REVIEW;

  return (
    <div className="app-container">
      <Header />
      <main className={`main-content container${wide ? " container-wide" : ""}`}>
        {error && phase === PHASE.SETUP && (
          <div className="banner banner-danger fade-up" style={{ marginBottom: 20 }}>
            <div className="banner-title">Couldn't generate a quiz</div>
            <div>{error}</div>
          </div>
        )}

        {phase === PHASE.SETUP && <Setup onGenerate={handleGenerate} />}
        {phase === PHASE.LOADING && <Loading />}
        {phase === PHASE.QUIZ && (
          <Quizzes questions={questions} onComplete={handleComplete} />
        )}
        {phase === PHASE.REVIEW && (
          <QNA
            results={results}
            onRetryWrong={handleRetryWrong}
            onRestart={handleRestart}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
