import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container container-wide footer-inner">
        <span>
          © {new Date().getFullYear()} Aykhan Ahmadzada
        </span>
        <a href="https://aykhan.net" target="_blank" rel="noreferrer">
          aykhan.net
        </a>
      </div>
    </footer>
  );
}
