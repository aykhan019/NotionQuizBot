import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-inner container container-wide">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            {/* spark / quiz glyph */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2.5l2.4 5.3 5.6.5-4.2 3.8 1.2 5.6-5-3-5 3 1.2-5.6L2 8.8l5.6-.5L12 2.5z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="brand-name">QuizBot</span>
        </a>

        <a className="header-by" href="https://aykhan.net" target="_blank" rel="noreferrer">
          by aykhan.net
        </a>
      </div>
    </header>
  );
}
