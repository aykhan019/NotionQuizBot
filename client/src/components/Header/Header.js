import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-content-left">
        <a href="https://aykhan.net" target="blank" className="my-padding">
          <img
            src="https://media.aykhan.net/assets/logos/aykhannet-transparent-bg-dark.svg"
            alt="logo"
            className="logo"
          ></img>
          <span className="logo-text">AYKHAN.NET</span>
        </a>
      </div>
    </header>
  );
}       