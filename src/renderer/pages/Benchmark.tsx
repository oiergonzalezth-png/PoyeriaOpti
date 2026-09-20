import React from "react";
import { useBenchmark } from "../hooks/useBenchmark";
import { computeBenchmarkDiff } from "../services/benchmarkDiff";
import { useTranslation } from "../providers/SettingsProvider";
import type { TranslationKey } from "../i18n/es";
import PageHeader from "../components/PageHeader";

type MetricKey = "cpuUsagePercent" | "ramUsagePercent" | "processCount" | "diskUsagePercent";

const ROWS: { key: MetricKey; labelKey: TranslationKey; unit: string }[] = [
  { key: "cpuUsagePercent", labelKey: "benchmark.metric.cpu", unit: " %" },
  { key: "ramUsagePercent", labelKey: "benchmark.metric.ram", unit: " %" },
  { key: "processCount", labelKey: "benchmark.metric.processes", unit: "" },
  { key: "diskUsagePercent", labelKey: "benchmark.metric.disk", unit: " %" }
];

export default function Benchmark(): React.JSX.Element {
  const { t } = useTranslation();
  const { benchmark, loading, capturing, captureBefore, captureAfter, reset } = useBenchmark();
  const diff = computeBenchmarkDiff(benchmark.before, benchmark.after);
  const na = t("common.na");

  const fmt = (v: number | null, unit: string): string => (v != null ? `${v}${unit}` : na);
  const fmtDiff = (v: number | null, unit: string): string => {
    if (v == null) return na;
    return `${v > 0 ? "+" : ""}${v}${unit}`;
  };

  return (
    <div className="page">
      <PageHeader
        title={t("benchmark.title")}
        description={t("benchmark.subtitle")}
        actions={
          <>
            <button type="button" className="btn btn--quiet" disabled={capturing !== null || (!benchmark.before && !benchmark.after)} onClick={reset}>
              {t("benchmark.reset")}
            </button>
            <button type="button" className="btn" disabled={capturing !== null} onClick={captureBefore}>
              {capturing === "before" ? t("benchmark.measuring") : t("benchmark.captureBefore")}
            </button>
            <button type="button" className="btn btn--primary" disabled={capturing !== null || !benchmark.before} onClick={captureAfter}>
              {capturing === "after" ? t("benchmark.measuring") : t("benchmark.captureAfter")}
            </button>
          </>
        }
      />

      {!loading && !benchmark.before && <p className="hint">{t("benchmark.hint")}</p>}

      {benchmark.before && (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("benchmark.col.metric")}</th>
                  <th className="num">{t("benchmark.col.before")}</th>
                  <th className="num">{t("benchmark.col.after")}</th>
                  <th className="num">{t("benchmark.col.diff")}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => {
                  const field = diff[row.key];
                  // Menos uso / menos procesos = mejor.
                  const tone = field.diff == null || field.diff === 0 ? "" : field.diff < 0 ? "bench__diff--better" : "bench__diff--worse";
                  return (
                    <tr key={row.key}>
                      <td>{t(row.labelKey)}</td>
                      <td className="num">{fmt(field.before, row.unit)}</td>
                      <td className="num">{fmt(field.after, row.unit)}</td>
                      <td className={`num bench__diff ${tone}`}>{fmtDiff(field.diff, row.unit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!benchmark.after && <p className="hint bench__waiting">{t("benchmark.waitingAfter")}</p>}
        </>
      )}
    </div>
  );
}
