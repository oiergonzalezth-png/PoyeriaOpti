import React, { useMemo, useState } from "react";
import { useOptimizer } from "../hooks/useOptimizer";
import { useCacheTargets } from "../hooks/useCacheTargets";
import { useTranslation } from "../providers/SettingsProvider";
import type { TranslationKey } from "../i18n/es";
import type { TweakDefinition } from "@shared/types/system";
import type { OptimizerTab } from "../App";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import Switch from "../components/Switch";
import CacheBar from "../components/CacheBar";

const RISK_DOT: Record<string, string> = { LOW: "ok", MEDIUM: "warn", HIGH: "danger" };

/** Reparte las categorías reales de los tweaks (backend) entre las 3 pestañas de la UI. */
function tabForTweak(category: string): OptimizerTab {
  if (category === "Red") return "red";
  return "general";
}

function TweakCard({
  tweak,
  busy,
  onToggle
}: {
  tweak: TweakDefinition;
  busy: boolean;
  onToggle: (id: string, apply: boolean) => void;
}): React.JSX.Element {
  const { t } = useTranslation();
  const applied = tweak.status === "APPLIED";
  const stateKey: TranslationKey =
    tweak.status === "APPLIED"
      ? "optimizer.status.applied"
      : tweak.status === "NOT_APPLIED"
        ? "optimizer.status.notApplied"
        : "optimizer.status.unknown";

  return (
    <div className={`tweak-card ${applied ? "tweak-card--applied" : ""}`}>
      <div className="tweak-card__header">
        <div className="tweak-card__title">{tweak.name}</div>
        <Switch
          checked={applied}
          disabled={busy || tweak.status === "UNKNOWN"}
          label={t("optimizer.switch", { name: tweak.name })}
          onChange={(next) => onToggle(tweak.id, next)}
        />
      </div>
      <p className="tweak-card__desc">{tweak.description}</p>
      <div className="tweak-card__footer">
        <span className="tweak-card__meta">
          <span className={`dot dot--${RISK_DOT[tweak.risk] ?? "ok"}`} aria-hidden="true" />
          {t(`optimizer.risk.${tweak.risk}` as TranslationKey)}
        </span>
        <span className="tweak-card__meta">{t(`optimizer.impact.${tweak.impact}` as TranslationKey)}</span>
        {tweak.requiresAdmin && (
          <span className="tweak-card__meta">
            <span className="dot dot--warn" aria-hidden="true" />
            {t("common.adminRequired")}
          </span>
        )}
        <span className={`tweak-card__state ${applied ? "tweak-card__state--on" : ""}`}>
          {busy ? t("common.working") : t(stateKey)}
        </span>
      </div>
    </div>
  );
}

interface OptimizerProps {
  activeTab: OptimizerTab;
  onTabChange: (tab: OptimizerTab) => void;
}

export default function Optimizer({ activeTab }: OptimizerProps): React.JSX.Element {
  const { t } = useTranslation();
  const { tweaks, loading: tweaksLoading, error: tweaksError, refresh: refreshTweaks } = useOptimizer();
  const {
    targets,
    loading: cacheLoading,
    error: cacheError,
    busyId: cacheBusyId,
    clear: clearCache,
    flushDns
  } = useCacheTargets();

  const tab = activeTab;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [dnsFeedback, setDnsFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [dnsBusy, setDnsBusy] = useState(false);

  const loading = tweaksLoading || cacheLoading;
  const error = tweaksError || cacheError;
  const isNonWindows = !tweaksLoading && tweaks.length > 0 && tweaks.every((tw) => tw.status === "UNKNOWN");

  async function toggle(id: string, apply: boolean): Promise<void> {
    setBusyId(id);
    setFeedback(null);
    try {
      const result = apply
        ? await window.optimizer.applyTweak(id)
        : await window.optimizer.restoreTweak(id);
      setFeedback({ ok: result.success, text: result.message });
      if (result.success) await refreshTweaks();
    } finally {
      setBusyId(null);
    }
  }

  async function handleFlushDns(): Promise<void> {
    setDnsBusy(true);
    setDnsFeedback(null);
    try {
      const result = await flushDns();
      setDnsFeedback({ ok: result.success, text: result.message });
    } finally {
      setDnsBusy(false);
    }
  }

  const tweaksByTab = useMemo(() => {
    const groups: Record<OptimizerTab, TweakDefinition[]> = { red: [], sistema: [], general: [] };
    for (const tweak of tweaks) groups[tabForTweak(tweak.category)].push(tweak);
    return groups;
  }, [tweaks]);

  const networkCacheTargets = targets.filter((tg) => tg.scope === "network");
  const appCacheTargets     = targets.filter((tg) => tg.scope === "apps" && tg.detected);
  const windowsCacheTargets = targets.filter((tg) => tg.scope === "windows");

  return (
    <div className="page">
      <PageHeader title={t("optimizer.title")} description={t("optimizer.subtitle")} />

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}
      {error    && <Notice tone="danger">{error}</Notice>}
      {isNonWindows && <Notice tone="info">{t("optimizer.nonWindows")}</Notice>}

      {tab === "red" && (
        <>
          <section className="section">
            <h2 className="section__title">{t("optimizer.section.redTweaks")}</h2>
            <p className="section__hint">{t("optimizer.section.redTweaks.hint")}</p>
            <div className="tweak-grid">
              {tweaksByTab.red.map((tweak) => (
                <TweakCard key={tweak.id} tweak={tweak} busy={busyId === tweak.id} onToggle={toggle} />
              ))}
            </div>
            {!loading && tweaksByTab.red.length === 0 && <p className="hint">{t("optimizer.empty")}</p>}
          </section>

          <section className="section">
            <div className="section__head">
              <div>
                <h2 className="section__title">{t("optimizer.section.redCache")}</h2>
                <p className="section__hint">{t("optimizer.section.redCache.hint")}</p>
              </div>
              <button type="button" className="btn btn--sm" disabled={dnsBusy} onClick={handleFlushDns}>
                {dnsBusy ? t("cache.working") : t("cache.flushDns")}
              </button>
            </div>
            {dnsFeedback && <Notice tone={dnsFeedback.ok ? "ok" : "warn"}>{dnsFeedback.text}</Notice>}
            <div className="rows">
              {networkCacheTargets.map((tg) => (
                <CacheBar key={tg.id} target={tg} busy={cacheBusyId === tg.id} onClear={clearCache} />
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "sistema" && (
        <section className="section">
          <h2 className="section__title">{t("optimizer.section.sistemaCache")}</h2>
          <p className="section__hint">{t("optimizer.section.sistemaCache.hint")}</p>
          <div className="rows">
            {appCacheTargets.map((tg) => (
              <CacheBar key={tg.id} target={tg} busy={cacheBusyId === tg.id} onClear={clearCache} />
            ))}
          </div>
          {!cacheLoading && appCacheTargets.length === 0 && (
            <p className="hint">{t("optimizer.section.sistemaCache.empty")}</p>
          )}
        </section>
      )}

      {tab === "general" && (
        <>
          <section className="section">
            <h2 className="section__title">{t("optimizer.section.generalTweaks")}</h2>
            <p className="section__hint">{t("optimizer.section.generalTweaks.hint")}</p>
            <div className="tweak-grid">
              {tweaksByTab.general.map((tweak) => (
                <TweakCard key={tweak.id} tweak={tweak} busy={busyId === tweak.id} onToggle={toggle} />
              ))}
            </div>
            {!loading && tweaksByTab.general.length === 0 && <p className="hint">{t("optimizer.empty")}</p>}
          </section>

          <section className="section">
            <h2 className="section__title">{t("optimizer.section.generalCache")}</h2>
            <p className="section__hint">{t("optimizer.section.generalCache.hint")}</p>
            <div className="rows">
              {windowsCacheTargets.map((tg) => (
                <CacheBar key={tg.id} target={tg} busy={cacheBusyId === tg.id} onClear={clearCache} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
