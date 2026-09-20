import React, { useEffect, useState } from "react";
import BrandMark from "./BrandMark";
import "./TitleBar.css";

export default function TitleBar(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.windowControls?.isMaximized().then(setMaximized).catch(() => {});
  }, []);

  function handleMinimize(): void {
    window.windowControls?.minimize().catch(() => {});
  }

  function handleMaximize(): void {
    window.windowControls?.maximize().then((isMax) => setMaximized(isMax)).catch(() => {});
  }

  function handleClose(): void {
    window.windowControls?.close().catch(() => {});
  }

  return (
    <div className="titlebar">
      <div className="titlebar__drag" />

      <div className="titlebar__brand">
        <BrandMark size={22} />
        <span className="titlebar__name">PoyeriaOpti</span>
      </div>

      <div className="titlebar__drag titlebar__drag--fill" />

      <div className="titlebar__controls">
        {/* Minimizar */}
        <button
          className="titlebar__btn"
          onClick={handleMinimize}
          title="Minimizar"
          type="button"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>

        {/* Maximizar / Restaurar */}
        <button
          className="titlebar__btn"
          onClick={handleMaximize}
          title={maximized ? "Restaurar" : "Maximizar"}
          type="button"
        >
          {maximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="2" y="0" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
              <rect x="0" y="2" width="8" height="8" rx="1" fill="var(--surface)" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="0.5" y="0.5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.1" />
            </svg>
          )}
        </button>

        {/* Cerrar */}
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          title="Cerrar"
          type="button"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
