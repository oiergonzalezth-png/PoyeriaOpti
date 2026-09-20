import React, { useMemo, useState } from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { useProcesses } from "../hooks/useProcesses";
import { useTranslation } from "../providers/SettingsProvider";
import Meter from "../components/Meter";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";
import Segmented from "../components/Segmented";

type SortKey = "cpuPercent" | "memoryMb" | "name";

export default function Processes(): React.JSX.Element {
  const { t } = useTranslation();
  const { processes, loading, error, refresh } = useProcesses();
  const [sortKey, setSortKey] = useState<SortKey>("memoryMb");
  const [query, setQuery] = useState("");
  const [killingPid, setKillingPid] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? processes.filter((p) => p.name.toLowerCase().includes(q) || String(p.pid) === q) : [...processes];
    filtered.sort((a, b) => (sortKey === "name" ? a.name.localeCompare(b.name) : b[sortKey] - a[sortKey]));
    return filtered;
  }, [processes, sortKey, query]);

  const maxMemory = useMemo(() => Math.max(1, ...processes.map((p) => p.memoryMb)), [processes]);

  async function handleKill(pid: number): Promise<void> {
    setKillingPid(pid);
    setFeedback(null);
    try {
      const result = await window.system.killProcess(pid);
      setFeedback({ ok: result.success, text: result.message });
      if (result.success) await refresh();
    } finally {
      setKillingPid(null);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title={t("processes.title")}
        description={t("processes.subtitle")}
        actions={
          <button type="button" className="btn" onClick={() => refresh()}>
            <RefreshCw size={16} aria-hidden="true" />
            {t("common.refresh")}
          </button>
        }
      />

      <div className="toolbar">
        <div className="search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            value={query}
            placeholder={t("processes.search")}
            aria-label={t("processes.search")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Segmented<SortKey>
          ariaLabel={t("processes.sortBy")}
          value={sortKey}
          onChange={setSortKey}
          options={[
            { value: "memoryMb", label: t("processes.sort.ram") },
            { value: "cpuPercent", label: t("processes.sort.cpu") },
            { value: "name", label: t("processes.sort.name") }
          ]}
        />
      </div>

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>{t("processes.col.process")}</th>
              <th className="num">{t("processes.col.pid")}</th>
              <th className="num">{t("processes.col.cpu")}</th>
              <th style={{ width: "26%" }}>{t("processes.col.ram")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.pid}>
                <td>
                  <span className={p.critical ? "muted-name" : undefined}>{p.name}</span>
                  {p.critical && <span className="tag proc__tag">{t("processes.badge.system")}</span>}
                </td>
                <td className="num muted">{p.pid}</td>
                <td className="num">{p.cpuPercent.toFixed(1)} %</td>
                <td>
                  <div className="proc__mem">
                    <Meter value={(p.memoryMb / maxMemory) * 100} tone="accent" label={p.name} />
                    <span>{Math.round(p.memoryMb)} MB</span>
                  </div>
                </td>
                <td className="num">
                  <button
                    type="button"
                    className="btn btn--sm btn--ghost-danger"
                    disabled={p.critical || killingPid === p.pid}
                    title={p.critical ? t("processes.close.protected") : t("processes.close.title")}
                    onClick={() => handleKill(p.pid)}
                  >
                    {killingPid === p.pid ? (
                      t("common.working")
                    ) : (
                      <>
                        <X size={14} aria-hidden="true" />
                        {t("processes.close")}
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {t("processes.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
