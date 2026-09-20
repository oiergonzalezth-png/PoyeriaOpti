import React, { useState } from "react";
import { useStartupManager } from "../hooks/useStartupManager";
import { useTranslation } from "../providers/SettingsProvider";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import Switch from "../components/Switch";

export default function Startup(): React.JSX.Element {
  const { t } = useTranslation();
  const { items, restorePoints, loading, error, refresh } = useStartupManager();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const isNonWindows = !loading && items.length === 0 && !error;

  async function run(id: string, action: () => Promise<{ success: boolean; message: string }>): Promise<void> {
    setBusyId(id);
    setFeedback(null);
    try {
      const result = await action();
      setFeedback({ ok: result.success, text: result.message });
      if (result.success) await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader title={t("startup.title")} description={t("startup.subtitle")} />

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}
      {isNonWindows && <Notice tone="info">{t("startup.nonWindows")}</Notice>}

      <div className="rows">
        {items.map((item) => (
          <div key={item.id} className="row">
            <div className="row__main">
              <div className="row__title">{item.name}</div>
              {item.command && <div className="mono-text row__command truncate">{item.command}</div>}
              <div className="row__meta">
                <span>{item.hive === "HKCU" ? t("startup.where.user") : t("startup.where.machine")}</span>
                {item.requiresAdmin && (
                  <span>
                    <span className="dot dot--warn" aria-hidden="true" />
                    {t("common.adminRequired")}
                  </span>
                )}
              </div>
            </div>
            <div className="row__side">
              <span className={`row__state ${item.enabled ? "row__state--on" : ""}`}>
                {busyId === item.id ? t("common.working") : item.enabled ? t("common.yes") : t("common.no")}
              </span>
              <Switch
                checked={item.enabled}
                disabled={busyId === item.id}
                label={t("startup.switch", { name: item.name })}
                onChange={(next) => run(item.id, () => window.system.setStartupItemEnabled(item.id, next))}
              />
            </div>
          </div>
        ))}
      </div>

      <section className="section">
        <h2 className="section__title">{t("startup.recent.title")}</h2>
        {restorePoints.length === 0 ? (
          <p className="hint">{t("startup.recent.empty")}</p>
        ) : (
          <div className="rows">
            {restorePoints.slice(0, 8).map((point) => (
              <div key={point.id} className="row row--compact">
                <div className="row__main">
                  <div>{point.description}</div>
                  <div className="row__meta">
                    <span>{new Date(point.timestamp).toLocaleString()}</span>
                    {point.restored && <span className="tag tag--ok">{t("startup.recent.restored")}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled={point.restored || busyId === point.id}
                  onClick={() => run(point.id, () => window.system.restoreStartupItem(point.id))}
                >
                  {busyId === point.id ? t("common.working") : t("startup.recent.undo")}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
