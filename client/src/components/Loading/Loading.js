import { useEffect, useState } from "react";
import "./Loading.css";

const MESSAGES = [
  "Reading your course material...",
  "Asking the model for questions...",
  "Checking each question and writing explanations...",
];

export default function Loading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      2500
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <div className="loading-text">{MESSAGES[index]}</div>
    </div>
  );
}
