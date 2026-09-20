import type { BenchmarkSnapshot } from "@shared/types/system";

export interface BenchmarkDiffField {
  before: number | null;
  after: number | null;
  /** after - before. `null` si alguno de los dos lados falta. */
  diff: number | null;
}

export interface BenchmarkDiff {
  cpuUsagePercent: BenchmarkDiffField;
  ramUsagePercent: BenchmarkDiffField;
  processCount: BenchmarkDiffField;
  diskUsagePercent: BenchmarkDiffField;
}

function diffField(before: number | null, after: number | null): BenchmarkDiffField {
  return {
    before,
    after,
    diff: before != null && after != null ? Math.round((after - before) * 10) / 10 : null
  };
}

/**
 * Calcula la diferencia Before/After para cada métrica. Nunca inventa un
 * "diff" cuando falta alguno de los dos lados (regla del proyecto: no
 * inventar datos).
 */
export function computeBenchmarkDiff(before: BenchmarkSnapshot | null, after: BenchmarkSnapshot | null): BenchmarkDiff {
  return {
    cpuUsagePercent: diffField(before?.cpuUsagePercent ?? null, after?.cpuUsagePercent ?? null),
    ramUsagePercent: diffField(before?.ramUsagePercent ?? null, after?.ramUsagePercent ?? null),
    processCount: diffField(before?.processCount ?? null, after?.processCount ?? null),
    diskUsagePercent: diffField(before?.diskUsagePercent ?? null, after?.diskUsagePercent ?? null)
  };
}
