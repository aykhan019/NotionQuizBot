import { useState } from "react";
import "./Setup.css";

const TABS = [
  { key: "text", label: "Paste text", icon: "✎" },
  { key: "pdf", label: "Upload PDF", icon: "⬆" },
  { key: "notion", label: "Notion", icon: "◆" },
];

// Course material in, practice questions out. Three ways to provide the material.
export default function Setup({ onGenerate }) {
  const [tab, setTab] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [notionIds, setNotionIds] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);
  const [localError, setLocalError] = useState("");

  function submit() {
    setLocalError("");
    const numberOfQuestions = Math.max(1, Math.min(Number(count) || 1, 20));

    if (tab === "text") {
      if (text.trim().length < 40) {
        setLocalError("Paste a bit more material (at least a paragraph).");
        return;
      }
      onGenerate({ source: "text", content: text, numberOfQuestions, difficulty });
    } else if (tab === "pdf") {
      if (!file) {
        setLocalError("Choose a PDF file first.");
        return;
      }
      onGenerate({ source: "pdf", file, numberOfQuestions, difficulty });
    } else {
      const ids = notionIds
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length === 0) {
        setLocalError("Enter at least one Notion page ID.");
        return;
      }
      onGenerate({ source: "notion", notionPageIds: ids, numberOfQuestions, difficulty });
    }
  }

  return (
    <div className="setup fade-up">
      <div className="setup-hero">
        <span className="eyebrow">Course material → practice quiz</span>
        <h1 className="setup-title">
          Turn your notes into a quiz that <span className="grad">teaches</span>.
        </h1>
        <p className="setup-sub muted">
          Paste text, upload a PDF, or pull from Notion. Every question comes with
          an explanation and a topic tag.
        </p>
      </div>

      <div className="card card-pad setup-card">
        <div className="tabs setup-tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className="tab"
              onClick={() => setTab(t.key)}
            >
              <span aria-hidden="true">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="setup-panel">
          {tab === "text" && (
            <textarea
              className="textarea"
              placeholder="Paste your lecture notes or course material here…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {tab === "pdf" && (
            <label className="dropzone" htmlFor="pdf-upload">
              <div className="dropzone-icon">⬆</div>
              <div className="dropzone-text">
                {file ? (
                  <strong>{file.name}</strong>
                ) : (
                  <>
                    <strong>Choose a PDF</strong>
                    <span className="muted"> — a lecture or chapter</span>
                  </>
                )}
              </div>
              <span className="muted dropzone-hint">
                We extract the text and build questions from it.
              </span>
              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
          )}

          {tab === "notion" && (
            <div className="field">
              <input
                className="input"
                placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                value={notionIds}
                onChange={(e) => setNotionIds(e.target.value)}
              />
              <span className="muted setup-note">
                One or more page IDs (space- or comma-separated). The integration
                token lives on the server — never here.
              </span>
            </div>
          )}
        </div>

        <div className="setup-controls">
          <div className="field">
            <span className="label">Difficulty</span>
            <div className="seg">
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  className={`seg-item${difficulty === d ? " is-active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d[0].toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="field count-field">
            <span className="label">Questions</span>
            <div className="stepper">
              <button
                className="stepper-btn"
                onClick={() => setCount((c) => Math.max(1, Number(c) - 1))}
                aria-label="Fewer questions"
              >
                −
              </button>
              <input
                className="input stepper-input"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <button
                className="stepper-btn"
                onClick={() => setCount((c) => Math.min(20, Number(c) + 1))}
                aria-label="More questions"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {localError && (
          <div className="banner banner-danger setup-localerror">{localError}</div>
        )}

        <button className="btn btn-primary btn-lg btn-block setup-submit" onClick={submit}>
          ✨ Generate quiz
        </button>
      </div>
    </div>
  );
}
