import React from "react";
import { TriangleAlert } from "lucide-react";
import { SettingsContextConsumer } from "../providers/SettingsProvider";

interface State {
  error: Error | null;
}

/**
 * Evita que un fallo de render en una pantalla deje la app en blanco: se
 * muestra un mensaje claro y el resto de la app (la barra lateral) sigue
 * funcionando. `resetKey` reinicia el límite al cambiar de sección.
 */
export default class ErrorBoundary extends React.Component<{ resetKey: string; children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: string }): void {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render(): React.ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <SettingsContextConsumer>
        {({ t }) => (
          <div className="page">
            <div className="empty">
              <div className="empty__icon">
                <TriangleAlert size={22} aria-hidden="true" />
              </div>
              <h1 className="empty__title">{t("guard.boundary.title")}</h1>
              <p className="empty__body">{t("guard.boundary.body")}</p>
              <p className="hint">{error.message}</p>
              <button type="button" className="btn" onClick={() => this.setState({ error: null })}>
                {t("guard.boundary.retry")}
              </button>
            </div>
          </div>
        )}
      </SettingsContextConsumer>
    );
  }
}
