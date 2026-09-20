import React, { useState } from "react";
import type { CacheTargetInfo, OperationResult } from "@shared/types/system";
import Meter from "./Meter";
import { useTranslation } from "../providers/SettingsProvider";

/** Por debajo de esto la caché se considera "limpia" (restos mínimos inevitables). */
const CLEAN_THRESHOLD_BYTES = 2 * 1024 * 1024; // 2 MB

/** Tamaño que se pinta como barra llena al 100% para que el relleno tenga sentido visual. */
const BAR_FULL_AT_MB: Record<string, number> = {
  network: 300,
  apps:    150,
  windows: 800
};

function formatSize(bytes: number): string {
  if (bytes === 0)                    return "0 B";
  if (bytes < 1024 * 1024)           return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface CacheBarProps {
  target: CacheTargetInfo;
  busy:   boolean;
  onClear: (id: string) => Promise<OperationResult>;
}

export default function CacheBar({ target, busy, onClear }: CacheBarProps): React.JSX.Element {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<OperationResult | null>(null);

  const sizeBytes     = target.sizeBytes ?? 0;
  const alreadyClean  = sizeBytes <= CLEAN_THRESHOLD_BYTES;
  const isCleanAfter  = feedback?.success === true && sizeBytes <= CLEAN_THRESHOLD_BYTES;

  const fullAtBytes = (BAR_FULL_AT_MB[target.scope] ?? 200) * 1024 * 1024;
  const percent     = Math.min(100, (sizeBytes / fullAtBytes) * 100);

  async function handleClear(): Promise<void> {
    setFeedback(null);
    const result = await onClear(target.id);
    setFeedback(result);
  }

  return (
    <div className="row row--top">
      <div className="row__main">
        <div className="row__title">{target.name}</div>
        <p className="row__desc">{target.description}</p>
        <div className="cache-bar__meter">
          <Meter value={percent} label={t("cache.meterLabel", { name: target.name })} />
          <span className="cache-bar__size" style={{ color: alreadyClean ? "var(--ok)" : undefined }}>
            {alreadyClean ? (
              <>
                <span style={{ marginRight: 4 }}>✓</span>
                {t("cache.done")} · 0 B
              </>
            ) : (
              formatSize(sizeBytes)
            )}
          </span>
        </div>
        {target.requiresAdmin && (
          <div className="row__meta">
            <span>
              <span className="dot dot--warn" aria-hidden="true" />
              {t("common.adminRequired")}
            </span>
          </div>
        )}
        {feedback && !isCleanAfter && (
          <p
            className={`cache-bar__feedback ${
              feedback.success ? "cache-bar__feedback--ok" : "cache-bar__feedback--warn"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>

      {/* Solo mostramos el botón si realmente hay algo que limpiar */}
      {!alreadyClean && (
        <div className="row__side">
          <button type="button" className="btn btn--sm" disabled={busy} onClick={handleClear}>
            {busy
              ? t("cache.working")
              : feedback
                ? t("cache.clearAgain")
                : t("cache.clearAction")}
          </button>
        </div>
      )}
    </div>
  );
}
