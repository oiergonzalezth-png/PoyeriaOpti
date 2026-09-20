import React, { useState } from "react";
import { History, Undo2 } from "lucide-react";
import { useRestoreCenter } from "../hooks/useRestoreCenter";
import { useTranslation } from "../providers/SettingsProvider";
import type { TranslationKey } from "../i18n/es";
import EmptyState from "../components/EmptyState";
import Notice from "../components/Notice";
import PageHeader from "../components/PageHeader";

function moduleKey(tweakId: string): TranslationKey {
  const domain = tweakId.split(":")[0];
  if (domain === "startup") return "backup.module.startup";
  if (domain === "optimizer") return "backup.module.optimizer";
  return "backup.module.unknown";
}

export default function BackupRestore(): React.JSX.Element {
  const { t } = useTranslation();
  const { points, loading, error, refresh } = useRestoreCenter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleRestore(id: string): Promise<void> {
    setBusyId(id);
    setFeedback(null);
    try {
      const result = await window.backup.restore(id);
      setFeedback({ ok: result.success, text: result.message });
      if (result.success) await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <PageHeader title={t("backup.title")} description={t("backup.subtitle")} />

      {feedback && <Notice tone={feedback.ok ? "ok" : "warn"}>{feedback.text}</Notice>}
      {error && <Notice tone="danger">{error}</Notice>}

      {!loading && points.length === 0 ? (
        <EmptyState icon={History} title={t("backup.empty.title")} body={t("backup.empty.body")} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("backup.col.module")}</th>
                <th>{t("backup.col.change")}</th>
                <th>{t("backup.col.date")}</th>
                <th>{t("backup.col.status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.id}>
                  <td>{t(moduleKey(point.tweakId))}</td>
                  <td>{point.description}</td>
                  <td className="muted nowrap">{new Date(point.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`tag ${point.restored ? "tag--ok" : "tag--warn"}`}>
                      {point.restored ? t("backup.status.restored") : t("backup.status.applied")}
                    </span>
                  </td>
                  <td className="num">
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={point.restored || busyId === point.id}
                      onClick={() => handleRestore(point.id)}
                    >
                      {busyId === point.id ? (
                        t("common.working")
                      ) : (
                        <>
                          <Undo2 size={14} aria-hidden="true" />
                          {t("backup.undo")}
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
