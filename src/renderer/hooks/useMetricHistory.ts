import { useEffect, useState } from "react";
import type { HardwareSnapshot } from "@shared/types/system";
import { appendSample, type MetricSample } from "../services/metricHistory";

// El historial vive a nivel de módulo para que no se pierda al cambiar de
// sección y volver al Resumen.
let cachedHistory: MetricSample[] = [];

export function useMetricHistory(snapshot: HardwareSnapshot | null, maxSamples = 60): MetricSample[] {
  const [history, setHistory] = useState<MetricSample[]>(cachedHistory);

  useEffect(() => {
    if (!snapshot) return;
    const parsed = Date.parse(snapshot.timestamp);
    const sample: MetricSample = {
      t: Number.isNaN(parsed) ? Date.now() : parsed,
      cpu: snapshot.cpu.currentLoadPercent,
      ram: snapshot.ram.usedPercent
    };
    const next = appendSample(cachedHistory, sample, maxSamples);
    cachedHistory = next;
    setHistory(next);
  }, [snapshot, maxSamples]);

  return history;
}
