import React, { useMemo } from "react";
import { ArrowRight, CircleCheck } from "lucide-react";
import { useHardwareSnapshot } from "../hooks/useHardwareSnapshot";
import { useMetricHistory } from "../hooks/useMetricHistory";
import { useProcesses } from "../hooks/useProcesses";
import { useStartupManager } from "../hooks/useStartupManager";
import { useOptimizer } from "../hooks/useOptimizer";
import { calculateHealthScore } from "../services/healthScore";
import { healthTone } from "../services/healthVerdict";
import { buildRecommendations } from "../services/recommendations";
import { useTranslation } from "../providers/SettingsProvider";
import type { SectionId } from "../navigation";
import LiveTrace from "../components/LiveTrace";
import ScoreBars from "../components/ScoreBars";
import Meter from "../components/Meter";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import "./Dashboard.css";

interface DashboardProps {
  onNavigate: (id: SectionId) => void;
}

function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export default function Dashboard({ onNavigate }: DashboardProps): React.JSX.Element {
  const { t } = useTranslation();
  const { data, loading, error } = useHardwareSnapshot(3000);
  const { processes } = useProcesses(6000);
  const { items: startupItems } = useStartupManager();
  const { tweaks } = useOptimizer();
  const history = useMetricHistory(data);

  const { score } = calculateHealthScore(data);
  const tone = healthTone(loading ? null : score);
  const mainDisk = data?.disks[0];

  const verdict = loading
    ? t("dashboard.verdict.measuring")
    : tone === "good"
      ? t("dashboard.verdict.good")
      : tone === "tight"
        ? t("dashboard.verdict.tight")
        : tone === "bad"
          ? t("dashboard.verdict.bad")
          : t("dashboard.verdict.unknown");

  const recommendations = useMemo(
    () => buildRecommendations({ snapshot: data, processes, startupItems, tweaks }),
    [data, processes, startupItems, tweaks]
  );

  const topProcesses = useMemo(() => [...processes].sort((a, b) => b.memoryMb - a.memoryMb).slice(0, 5), [processes]);
  const maxMemory = topProcesses[0]?.memoryMb ?? 1;

  const cpuNow = data?.cpu.currentLoadPercent ?? null;
  const ramNow = data?.ram.usedPercent ?? null;

  return (
    <div className="page">
      <PageHeader
        title={t("dashboard.title")}
        description={data?.nonWindowsEnvironment ? t("dashboard.subtitleNonWindows") : t("dashboard.subtitleWindows")}
      />

      {error && <Notice tone="danger">{t("dashboard.error", { message: error })}</Notice>}

      <section className="hero" aria-label={t("dashboard.score.caption")}>
        <div className="hero__score">
          <div className="hero__num" aria-label={score != null ? String(score) : undefined}>
            {loading || score == null ? "–" : score}
          </div>
          <div className="hero__verdict">{verdict}</div>
          <ScoreBars score={loading ? null : score} tone={tone} />
          <p className="hero__caption">{t("dashboard.score.caption")}</p>
        </div>

        <div className="hero__trace">
          <h2 className="section__title">{t("dashboard.trace.title")}</h2>
          <LiveTrace
            samples={history}
            cpuLabel={t("dashboard.trace.cpu")}
            ramLabel={t("dashboard.trace.ram")}
            ariaLabel={t("dashboard.trace.aria", {
              cpu: cpuNow != null ? Math.round(cpuNow) : t("common.na"),
              ram: ramNow != null ? Math.round(ramNow) : t("common.na")
            })}
            emptyText={t("dashboard.trace.collecting")}
          />
        </div>
      </section>

      <div className="dash-grid">
        <section aria-labelledby="dash-resources">
          <h2 id="dash-resources" className="section__title">
            {t("dashboard.resources.title")}
          </h2>
          <div className="res-list">
            <div className="res">
              <span className="res__label">{t("dashboard.resources.cpu")}</span>
              <Meter value={cpuNow ?? 0} label={t("dashboard.resources.cpu")} />
              <span className="res__value">{cpuNow != null ? `${cpuNow.toFixed(0)} %` : t("common.na")}</span>
              <span className="res__detail">
                {data?.cpu.brand ?? ""}
                {data?.cpu.logicalCores ? ` · ${t("dashboard.resources.cores", { count: data.cpu.logicalCores })}` : ""}
              </span>
            </div>

            <div className="res">
              <span className="res__label">{t("dashboard.resources.ram")}</span>
              <Meter value={ramNow ?? 0} label={t("dashboard.resources.ram")} />
              <span className="res__value">{ramNow != null ? `${ramNow.toFixed(0)} %` : t("common.na")}</span>
              <span className="res__detail">
                {data
                  ? t("dashboard.resources.ramDetail", {
                      used: (data.ram.usedMb / 1024).toFixed(1),
                      total: (data.ram.totalMb / 1024).toFixed(1)
                    })
                  : ""}
              </span>
            </div>

            {mainDisk && (
              <div className="res">
                <span className="res__label">{t("dashboard.resources.disk", { drive: mainDisk.device })}</span>
                <Meter value={mainDisk.usedPercent} label={t("dashboard.resources.disk", { drive: mainDisk.device })} />
                <span className="res__value">{`${mainDisk.usedPercent.toFixed(0)} %`}</span>
                <span className="res__detail">
                  {t("dashboard.resources.diskDetail", { free: mainDisk.freeGb, total: mainDisk.sizeGb })}
                </span>
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="dash-next">
          <h2 id="dash-next" className="section__title">
            {t("dashboard.next.title")}
          </h2>
          <div className="todo-list">
            {recommendations.length === 0 && (
              <div className="todo todo--good">
                <CircleCheck size={18} aria-hidden="true" />
                <p>{t("dashboard.next.allGood")}</p>
              </div>
            )}
            {recommendations.map((rec) => (
              <div key={rec.id} className="todo">
                <span className={`dot dot--${rec.tone === "info" ? "info" : rec.tone}`} aria-hidden="true" />
                <div className="todo__text">
                  <div className="todo__title">{t(rec.titleKey, rec.vars)}</div>
                  <p className="todo__desc">{t(rec.descKey, rec.vars)}</p>
                </div>
                <button type="button" className="btn btn--sm" onClick={() => onNavigate(rec.target)}>
                  {t(rec.actionKey)}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section" aria-labelledby="dash-top">
        <div className="section__head">
          <h2 id="dash-top" className="section__title">
            {t("dashboard.top.title")}
          </h2>
          <button type="button" className="btn btn--sm btn--quiet" onClick={() => onNavigate("processes")}>
            {t("dashboard.top.seeAll")}
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        {topProcesses.length === 0 ? (
          <p className="hint">{t("dashboard.top.empty")}</p>
        ) : (
          <div className="top-list">
            {topProcesses.map((p) => (
              <div key={p.pid} className="top">
                <span className="top__name truncate">{p.name}</span>
                <Meter value={(p.memoryMb / maxMemory) * 100} tone="accent" label={p.name} />
                <span className="top__value">{formatMemory(p.memoryMb)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
