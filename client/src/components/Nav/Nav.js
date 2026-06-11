import "./Nav.css";

const ITEMS = [
  { key: "practice", label: "Practice", icon: "✎" },
  { key: "progress", label: "Progress", icon: "📊" },
  { key: "calculators", label: "Calculators", icon: "🧮" },
];

export default function Nav({ view, onChange, reviewDue = 0 }) {
  return (
    <nav className="appnav">
      <div className="appnav-inner">
        {ITEMS.map((it) => (
          <button
            key={it.key}
            className={`appnav-item${view === it.key ? " is-active" : ""}`}
            onClick={() => onChange(it.key)}
          >
            <span aria-hidden="true">{it.icon}</span>
            {it.label}
            {it.key === "progress" && reviewDue > 0 && (
              <span className="appnav-badge">{reviewDue}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
