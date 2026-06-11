import { useState } from "react";
import "./Calculators.css";

// 4.0-scale grade points (common US/most-universities mapping).
const GRADE_POINTS = {
  "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0,
  "F": 0.0,
};
const LETTERS = Object.keys(GRADE_POINTS);

function FinalGradeCalculator() {
  const [current, setCurrent] = useState(78);
  const [weight, setWeight] = useState(40);
  const [target, setTarget] = useState(85);

  const w = Math.min(Math.max(Number(weight) || 0, 0), 100) / 100;
  const cur = Number(current) || 0;
  const tgt = Number(target) || 0;
  const needed = w > 0 ? (tgt - (1 - w) * cur) / w : NaN;

  let verdict;
  if (w <= 0) {
    verdict = { tone: "muted", text: "Set the final's weight above 0%." };
  } else if (needed <= 0) {
    verdict = {
      tone: "ok",
      text: "You've already secured your target — even a 0% keeps you there.",
    };
  } else if (needed > 100) {
    verdict = {
      tone: "no",
      text: `You'd need ${needed.toFixed(1)}% — not reachable without extra credit.`,
    };
  } else {
    verdict = {
      tone: "ok",
      text: `You need ${needed.toFixed(1)}% on the final to reach ${tgt}%.`,
    };
  }

  return (
    <div className="card card-pad calc-card">
      <h3 className="calc-title">Final grade calculator</h3>
      <p className="muted calc-sub">
        “What do I need on the final to hit my target?”
      </p>
      <div className="calc-grid">
        <label className="field">
          <span className="label">Current grade (%)</span>
          <input className="input" type="number" value={current}
            onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">Final exam weight (%)</span>
          <input className="input" type="number" value={weight}
            onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">Target grade (%)</span>
          <input className="input" type="number" value={target}
            onChange={(e) => setTarget(e.target.value)} />
        </label>
      </div>
      <div className={`calc-result calc-${verdict.tone}`}>{verdict.text}</div>
    </div>
  );
}

let rowKey = 0;
function GpaCalculator() {
  const [rows, setRows] = useState([
    { id: ++rowKey, name: "Calculus", credits: 4, grade: "A" },
    { id: ++rowKey, name: "Economics", credits: 3, grade: "B+" },
    { id: ++rowKey, name: "History", credits: 3, grade: "A-" },
  ]);

  function update(id, field, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { id: ++rowKey, name: "", credits: 3, grade: "A" }]);
  }
  function removeRow(id) {
    setRows((rs) => rs.filter((r) => r.id !== id));
  }

  const totalCredits = rows.reduce((s, r) => s + (Number(r.credits) || 0), 0);
  const points = rows.reduce(
    (s, r) => s + (Number(r.credits) || 0) * GRADE_POINTS[r.grade],
    0
  );
  const gpa = totalCredits > 0 ? points / totalCredits : 0;

  return (
    <div className="card card-pad calc-card">
      <h3 className="calc-title">GPA calculator</h3>
      <p className="muted calc-sub">Add your courses, credits, and grades.</p>

      <div className="gpa-rows">
        <div className="gpa-row gpa-head">
          <span>Course</span>
          <span>Credits</span>
          <span>Grade</span>
          <span />
        </div>
        {rows.map((r) => (
          <div className="gpa-row" key={r.id}>
            <input className="input" placeholder="Course name" value={r.name}
              onChange={(e) => update(r.id, "name", e.target.value)} />
            <input className="input" type="number" min="0" value={r.credits}
              onChange={(e) => update(r.id, "credits", e.target.value)} />
            <select className="select" value={r.grade}
              onChange={(e) => update(r.id, "grade", e.target.value)}>
              {LETTERS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button className="gpa-remove" onClick={() => removeRow(r.id)}
              aria-label="Remove course">×</button>
          </div>
        ))}
      </div>

      <button className="btn btn-ghost gpa-add" onClick={addRow}>+ Add course</button>

      <div className="gpa-result">
        <div>
          <span className="muted">Total credits</span>
          <strong>{totalCredits}</strong>
        </div>
        <div className="gpa-big">
          <span className="muted">GPA</span>
          <strong>{gpa.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

export default function Calculators() {
  return (
    <div className="calculators fade-up">
      <div className="calc-hero">
        <span className="eyebrow">Plan your semester</span>
        <h1 className="calc-h1">Grade & GPA calculators</h1>
        <p className="muted">
          Know exactly where you stand — and what you need next.
        </p>
      </div>
      <FinalGradeCalculator />
      <GpaCalculator />
    </div>
  );
}
