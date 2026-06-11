import { useEffect, useState } from "react";
import "./Loading.css";

const MESSAGES = [
  "Reading your course material…",
  "Asking the model for questions…",
  "Checking each one and writing explanations…",
];

export default function Loading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      2400
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading card card-pad fade-up">
      <div className="spinner" />
      <div className="loading-text">{MESSAGES[index]}</div>
      <div className="loading-steps">
        {MESSAGES.map((_, i) => (
          <span key={i} className={`loading-dot${i <= index ? " is-on" : ""}`} />
        ))}
      </div>
    </div>
  );
}
