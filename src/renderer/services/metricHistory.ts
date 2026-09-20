export interface MetricSample {
  /** Marca de tiempo (ms) de la lectura. */
  t: number;
  cpu: number | null;
  ram: number | null;
}

/**
 * Añade una muestra al historial conservando solo las últimas `max`.
 * Si llega una muestra con la misma marca de tiempo que la última, se ignora
 * (React StrictMode y los re-renders podrían duplicarla).
 */
export function appendSample(history: MetricSample[], sample: MetricSample, max = 60): MetricSample[] {
  const last = history[history.length - 1];
  if (last && last.t === sample.t) return history;
  const next = [...history, sample];
  return next.length > max ? next.slice(next.length - max) : next;
}

/** Cuántos minutos abarca el historial (para el pie de la gráfica). */
export function historySpanMinutes(history: MetricSample[]): number {
  if (history.length < 2) return 0;
  return (history[history.length - 1].t - history[0].t) / 60000;
}
