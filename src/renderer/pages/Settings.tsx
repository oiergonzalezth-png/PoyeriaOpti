import React, { useState } from "react";
import { useSettings } from "../providers/SettingsProvider";
import { useUpdater } from "../hooks/useUpdater";
import type { AppLanguage, AppTheme } from "@shared/types/system";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";
import Switch from "../components/Switch";

type ToggleKey = "startWithWindows" | "minimizeToTray" | "notificationsEnabled";

export default function Settings(): React.JSX.Element {
  const { settings, updateSettings, t } = useSettings();
  const { state: updateState, check: checkUpdate, install: installUpdate, checking, installing } = useUpdater();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function apply(key: string, patch: Parameters<typeof updateSettings>[0]): Promise<void> {
    setBusyKey(key);
    setFeedback(null);
    try {
      await updateSettings(patch);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleTestNotification(): Promise<void> {
    setBusyKey("testNotification");
    try {
      const result = await window.settings.showTestNotification();
      setFeedback({ ok: result.success, text: result.message });
    } finally {
      setBusyKey(null);
    }
  }

  function toggleRow(key: ToggleKey, label: string, hint: string): React.JSX.Element {
    return (
      <div className="row">
        <div className="row__main">
          <div className="row__title">{label}</div>
          <p className="row__desc">{hint}</p>
        </div>
        <Switch
          checked={settings[key]}
          disabled={busyKey === key}
          label={label}
          onChange={(value) => apply(key, { [key]: value })}
        />
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <PageHeader title={t("settings.title")} description={t("settings.subtitle")} />

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.general")}</h2>
        <div className="rows">
          <div className="row">
            <div className="row__title">{t("settings.language")}</div>
            <Segmented<AppLanguage>
              ariaLabel={t("settings.language")}
              value={settings.language}
              disabled={busyKey === "language"}
              onChange={(language) => apply("language", { language })}
              options={[
                { value: "es", label: "Español" },
                { value: "en", label: "English" }
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.appearance")}</h2>
        <div className="rows">
          <div className="row">
            <div className="row__title">{t("settings.theme")}</div>
            <Segmented<AppTheme>
              ariaLabel={t("settings.theme")}
              value={settings.theme}
              disabled={busyKey === "theme"}
              onChange={(theme) => apply("theme", { theme })}
              options={[
                { value: "dark", label: t("settings.theme.dark") },
                { value: "light", label: t("settings.theme.light") }
              ]}
            />
          </div>
        </div>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.startup")}</h2>
        <div className="rows">
          {toggleRow("startWithWindows", t("settings.startWithWindows"), t("settings.startWithWindows.hint"))}
          {toggleRow("minimizeToTray", t("settings.minimizeToTray"), t("settings.minimizeToTray.hint"))}
        </div>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.notifications")}</h2>
        <div className="rows">
          {toggleRow("notificationsEnabled", t("settings.notificationsEnabled"), t("settings.notificationsEnabled.hint"))}
        </div>
        <div className="set-test">
          <button
            type="button"
            className="btn btn--sm"
            disabled={!settings.notificationsEnabled || busyKey === "testNotification"}
            onClick={handleTestNotification}
          >
            {t("settings.testNotification")}
          </button>
        </div>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.privacy")}</h2>
        <p className="hint">{t("settings.privacy.text")}</p>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("settings.section.advanced")}</h2>
        <p className="hint">{t("settings.advanced.viewLogs")}</p>
      </section>

      <section className="section set-section">
        <h2 className="section__title">{t("update.section.title")}</h2>

        <div className="rows" style={{ marginTop: "0.75rem" }}>
          <div className="row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.5rem" }}>

            {/* Versión instalada y disponible */}
            {updateState.info && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="hint">{t("update.current", { version: updateState.info.currentVersion })}</span>
                {updateState.info.updateAvailable && (
                  <span className="hint" style={{ color: "var(--color-accent)" }}>
                    {t("update.latest", { version: updateState.info.latestVersion })}
                  </span>
                )}
              </div>
            )}

            {/* Estado actual */}
            <span className="hint" style={{
              color: updateState.status === "update-available" ? "var(--color-accent)"
                   : updateState.status === "error"           ? "var(--color-danger)"
                   : updateState.status === "up-to-date"      ? "var(--color-ok)"
                   : undefined
            }}>
              {t(`update.status.${updateState.status}` as Parameters<typeof t>[0])}
            </span>

            {/* Barra de progreso de descarga */}
            {updateState.status === "downloading" && updateState.progress && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <span className="hint">{t("update.progress", { percent: String(updateState.progress.percent) })}</span>
                <div style={{ width: "100%", height: 4, background: "var(--color-surface-2)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: `${updateState.progress.percent}%`,
                    height: "100%",
                    background: "var(--color-accent)",
                    transition: "width 0.2s"
                  }} />
                </div>
              </div>
            )}

            {/* Notas del release */}
            {updateState.info?.updateAvailable && updateState.info.releaseNotes && (
              <details style={{ width: "100%", marginTop: "0.25rem" }}>
                <summary className="hint" style={{ cursor: "pointer" }}>{t("update.releaseNotes")}</summary>
                <p className="hint" style={{ marginTop: "0.4rem", whiteSpace: "pre-wrap" }}>
                  {updateState.info.releaseNotes}
                </p>
              </details>
            )}

            {/* Error */}
            {updateState.status === "error" && updateState.error && (
              <Notice tone="danger">{t("update.error", { message: updateState.error })}</Notice>
            )}

            {/* Botones */}
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <button
                type="button"
                className="btn btn--sm"
                disabled={checking || updateState.status === "downloading"}
                onClick={() => checkUpdate().catch(() => {})}
              >
                {t("update.btn.check")}
              </button>

              {updateState.info?.updateAvailable && updateState.status !== "downloading" && updateState.status !== "ready-to-install" && (
                <button
                  type="button"
                  className="btn btn--sm btn--accent"
                  disabled={installing || updateState.status === "downloading"}
                  onClick={() => installUpdate().catch(() => {})}
                >
                  {t("update.btn.install")}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
