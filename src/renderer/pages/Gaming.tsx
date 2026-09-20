import React, { useState } from "react";
import { Play, Plus, RefreshCw, Square, Trash2, Zap } from "lucide-react";
import { useGamingMode } from "../hooks/useGamingMode";
import { useTranslation } from "../providers/SettingsProvider";
import type { TranslationKey } from "../i18n/es";
import type { SafeProcessPriority, DetectedGameInfo } from "@shared/types/system";
import type { GamingTab } from "../App";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";

const EMPTY_FORM = {
  name: "",
  executablePath: "",
  priority: "HIGH" as SafeProcessPriority,
  allowedProcesses: "",
  selectedTweakIds: [] as string[]
};

/** Tarjeta de juego detectado */
function DetectedGameCard({
  detected,
  tweakIds,
  onQuickCreate,
  busy
}: {
  detected: DetectedGameInfo;
  tweakIds: string[];
  onQuickCreate: (game: DetectedGameInfo, tweakIds: string[]) => Promise<void>;
  busy: boolean;
}): React.JSX.Element {
  const validTweaks = detected.recommendedTweakIds.filter((id) => tweakIds.includes(id));
  const detectionLabel = detected.running
    ? "en ejecución"
    : detected.installPath
      ? "instalado"
      : "detectado";

  return (
    <div className={`detected-game-card ${detected.running ? "detected-game-card--running" : ""}`}>
      <div className="detected-game-card__info">
        <div className="detected-game-card__name">
          {detected.name}
          <span className={`tag ${detected.running ? "tag--ok" : "tag--neutral"} detected-game-card__badge`}>
            {detectionLabel}
          </span>
        </div>
        <div className="detected-game-card__desc">{detected.description}</div>
        {detected.installPath && (
          <div className="detected-game-card__path mono-text">{detected.installPath}</div>
        )}
        {validTweaks.length > 0 && (
          <div className="detected-game-card__tweaks">
            <span className="dot dot--ok" aria-hidden="true" />
            {validTweaks.length} optimización{validTweaks.length !== 1 ? "es" : ""} recomendada{validTweaks.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
      <button
        type="button"
        className="btn btn--sm btn--primary"
        disabled={busy}
        onClick={() => onQuickCreate(detected, validTweaks)}
        title={`Crear perfil optimizado para ${detected.name}`}
      >
        <Zap size={13} aria-hidden="true" />
        Añadir
      </button>
    </div>
  );
}

interface GamingProps {
  activeTab: GamingTab;
  onTabChange: (tab: GamingTab) => void;
}

export default function Gaming({ activeTab }: GamingProps): React.JSX.Element {
  const { t } = useTranslation();
  const { status, profiles, tweaks, detectedGames, scanning, loading, error, refresh, scanGames } =
    useGamingMode();
  const [busy, setBusy]             = useState(false);
  const [feedback, setFeedback]     = useState<{ ok: boolean; text: string } | null>(null);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formError, setFormError]   = useState(false);

  const tweakIds     = tweaks.map((tw) => tw.id);

  // IDs de ejecutables que ya tienen perfil creado
  const profiledExes = new Set(
    profiles.map((p) => p.executablePath.split("\\").pop()?.toLowerCase())
  );

  // Todos los juegos detectados (instalados o en ejecución) sin perfil aún
  const newDetected = detectedGames.filter(
    (d) => !profiledExes.has(d.mainExe.toLowerCase())
  );

  // Running aparecen primero
  const sortedDetected = [...newDetected].sort((a, b) =>
    a.running === b.running ? 0 : a.running ? -1 : 1
  );

  async function run(action: () => Promise<{ success: boolean; message: string }>): Promise<void> {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await action();
      setFeedback({ ok: result.success, text: result.message });
      if (result.success) await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateProfile(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormError(false);
    setBusy(true);
    try {
      await window.gaming.createProfile({
        name: form.name.trim(),
        executablePath: form.executablePath.trim(),
        priority: form.priority,
        allowedProcesses: form.allowedProcesses
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        selectedTweakIds: form.selectedTweakIds
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await refresh();
    } catch {
      setFormError(true);
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickCreate(game: DetectedGameInfo, validTweakIds: string[]): Promise<void> {
    setBusy(true);
    setFeedback(null);
    try {
      await window.gaming.createProfile({
        name: game.name,
        executablePath: game.mainExe,
        priority: "HIGH",
        allowedProcesses: game.protectedProcesses,
        selectedTweakIds: validTweakIds
      });
      setFeedback({ ok: true, text: `Perfil de ${game.name} creado con optimizaciones recomendadas.` });
      await refresh();
    } catch {
      setFeedback({ ok: false, text: "No se pudo crear el perfil automáticamente." });
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteProfile(id: string): Promise<void> {
    setBusy(true);
    try {
      await window.gaming.deleteProfile(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function toggleTweak(id: string): void {
    setForm((prev) => ({
      ...prev,
      selectedTweakIds: prev.selectedTweakIds.includes(id)
        ? prev.selectedTweakIds.filter((x) => x !== id)
        : [...prev.selectedTweakIds, id]
    }));
  }

  const active = status?.active === true;

  return (
    <div className="page">
      <PageHeader title={t("gaming.title")} description={t("gaming.subtitle")} />

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}
      {error    && <Notice tone="danger">{error}</Notice>}

      {/* Estado del modo juego — siempre visible */}
      <section className={`gm-status ${active ? "gm-status--on" : ""}`}>
        <div className="gm-status__text">
          <div className="gm-status__title">
            <span className={`dot ${active ? "dot--ok" : ""}`} aria-hidden="true" />
            {active ? t("gaming.status.active") : t("gaming.status.inactive")}
          </div>
          <p className="gm-status__detail">
            {active
              ? `${
                  status?.profileName
                    ? t("gaming.status.profile", { name: status.profileName })
                    : t("gaming.status.noProfile")
                } · ${t("gaming.status.since", {
                  time: status?.activatedAt
                    ? new Date(status.activatedAt).toLocaleTimeString()
                    : t("common.na")
                })}`
              : t("gaming.status.hint")}
          </p>
        </div>
        {active ? (
          <button
            type="button"
            className="btn btn--danger"
            disabled={busy}
            onClick={() => run(() => window.gaming.deactivate())}
          >
            <Square size={15} aria-hidden="true" />
            {busy ? t("common.working") : t("gaming.deactivate")}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => run(() => window.gaming.activate(null))}
          >
            <Play size={15} aria-hidden="true" />
            {busy ? t("common.working") : t("gaming.activateNoProfile")}
          </button>
        )}
      </section>

      {/* ── TAB: DETECTADOS ── */}
      {activeTab === "detectados" && (
        <section className="section">
          <div className="section__head">
            <div>
              <h2 className="section__title">
                {t("gaming.detected.title")}
                {scanning && <span className="gm-scanning-badge">detectando procesos…</span>}
              </h2>
              <p className="section__hint" style={{ marginBottom: 0 }}>
                {t("gaming.detected.hint")}
              </p>
            </div>
            <button
              type="button"
              className="btn btn--sm btn--quiet"
              disabled={scanning}
              onClick={scanGames}
              title="Detectar juegos en ejecución"
            >
              <RefreshCw size={13} aria-hidden="true" />
              {scanning ? "Detectando…" : "Actualizar"}
            </button>
          </div>

          {sortedDetected.length > 0 ? (
            <div className="detected-games-list" style={{ marginTop: "0.75rem" }}>
              {sortedDetected.map((d) => (
                <DetectedGameCard
                  key={d.id}
                  detected={d}
                  tweakIds={tweakIds}
                  onQuickCreate={handleQuickCreate}
                  busy={busy}
                />
              ))}
            </div>
          ) : (
            !scanning && (
              <p className="hint" style={{ marginTop: "0.75rem" }}>
                {t("gaming.detected.empty")}
              </p>
            )
          )}
        </section>
      )}

      {/* ── TAB: PERFILES ── */}
      {activeTab === "perfiles" && (
        <section className="section">
          <div className="section__head">
            <h2 className="section__title">{t("gaming.profiles.title")}</h2>
            <button type="button" className="btn btn--sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? (
                t("common.cancel")
              ) : (
                <>
                  <Plus size={15} aria-hidden="true" />
                  {t("gaming.profiles.add")}
                </>
              )}
            </button>
          </div>

          {showForm && (
            <form className="gm-form" onSubmit={handleCreateProfile}>
              <div className="gm-form__grid">
                <label className="field">
                  <span className="field__label">{t("gaming.form.name")}</span>
                  <input
                    className="input"
                    value={form.name}
                    maxLength={80}
                    required
                    placeholder={t("gaming.form.namePlaceholder")}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </label>
                <label className="field">
                  <span className="field__label">{t("gaming.form.path")}</span>
                  <input
                    className="input"
                    value={form.executablePath}
                    maxLength={260}
                    required
                    placeholder={t("gaming.form.pathPlaceholder")}
                    onChange={(e) => setForm((f) => ({ ...f, executablePath: e.target.value }))}
                  />
                </label>
                <div className="field">
                  <span className="field__label">{t("gaming.form.priority")}</span>
                  <div>
                    <Segmented<SafeProcessPriority>
                      ariaLabel={t("gaming.form.priority")}
                      value={form.priority}
                      onChange={(priority) => setForm((f) => ({ ...f, priority }))}
                      options={[
                        { value: "HIGH",   label: t("gaming.form.priority.HIGH") },
                        { value: "NORMAL", label: t("gaming.form.priority.NORMAL") }
                      ]}
                    />
                  </div>
                </div>
                <label className="field">
                  <span className="field__label">{t("gaming.form.protected")}</span>
                  <input
                    className="input"
                    value={form.allowedProcesses}
                    placeholder="discord.exe, obs64.exe"
                    onChange={(e) => setForm((f) => ({ ...f, allowedProcesses: e.target.value }))}
                  />
                  <span className="field__hint">{t("gaming.form.protectedHint")}</span>
                </label>
              </div>

              {tweaks.length > 0 && (
                <fieldset className="gm-form__tweaks">
                  <legend className="field__label">{t("gaming.form.tweaks")}</legend>
                  {tweaks.map((tw) => (
                    <label key={tw.id} className="check">
                      <input
                        type="checkbox"
                        checked={form.selectedTweakIds.includes(tw.id)}
                        onChange={() => toggleTweak(tw.id)}
                      />
                      {tw.name}
                    </label>
                  ))}
                </fieldset>
              )}

              {formError && <Notice tone="warn">{t("gaming.form.invalid")}</Notice>}
              <div>
                <button type="submit" className="btn btn--primary" disabled={busy}>
                  {t("gaming.form.save")}
                </button>
              </div>
            </form>
          )}

          <div className="rows">
            {profiles.map((profile) => {
              const knownGame = detectedGames.find(
                (d) =>
                  d.mainExe.toLowerCase() ===
                  profile.executablePath.split("\\").pop()?.toLowerCase()
              );
              return (
                <div key={profile.id} className="row">
                  <div
                    className="row__main"
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
                  >
                    <div style={{ flex: 1 }}>
                      <div className="row__title">{profile.name}</div>
                      <div className="mono-text row__command truncate">{profile.executablePath}</div>
                      <div className="row__meta">
                        <span>
                          {t("gaming.profile.priority", {
                            value: t(
                              `gaming.profile.priority.${profile.priority}` as TranslationKey
                            ).toLowerCase()
                          })}
                        </span>
                        {profile.allowedProcesses.length > 0 && (
                          <span>
                            {t("gaming.profile.protected", {
                              list: profile.allowedProcesses.join(", ")
                            })}
                          </span>
                        )}
                        {profile.selectedTweakIds.length > 0 && (
                          <span>
                            {t("gaming.profile.tweaks", { count: profile.selectedTweakIds.length })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="row__side">
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={busy || active}
                      onClick={() => run(() => window.gaming.activate(profile.id))}
                    >
                      <Play size={14} aria-hidden="true" />
                      {t("gaming.profile.activate")}
                    </button>
                    <button
                      type="button"
                      className="btn btn--sm btn--quiet"
                      disabled={busy}
                      onClick={() => handleDeleteProfile(profile.id)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      {t("gaming.profile.delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {!loading && profiles.length === 0 && !showForm && (
            <p className="hint gm-empty">{t("gaming.profiles.empty")}</p>
          )}
        </section>
      )}
    </div>
  );
}
