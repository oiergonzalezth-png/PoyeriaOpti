import { describe, it, expect } from "vitest";
import { computeBenchmarkDiff } from "../src/renderer/services/benchmarkDiff";
import type { BenchmarkSnapshot } from "../src/shared/types/system";

function snap(overrides: Partial<BenchmarkSnapshot> = {}): BenchmarkSnapshot {
  return {
    timestamp: new Date().toISOString(),
    cpuUsagePercent: 50,
    ramUsagePercent: 60,
    processCount: 120,
    diskUsagePercent: 70,
    ...overrides
  };
}

describe("computeBenchmarkDiff", () => {
  it("calcula la diferencia after - before para cada métrica", () => {
    const before = snap({ cpuUsagePercent: 50, ramUsagePercent: 60, processCount: 120, diskUsagePercent: 70 });
    const after = snap({ cpuUsagePercent: 30, ramUsagePercent: 55, processCount: 100, diskUsagePercent: 70 });

    const diff = computeBenchmarkDiff(before, after);
    expect(diff.cpuUsagePercent.diff).toBe(-20);
    expect(diff.ramUsagePercent.diff).toBe(-5);
    expect(diff.processCount.diff).toBe(-20);
    expect(diff.diskUsagePercent.diff).toBe(0);
  });

  it("devuelve diff null si falta 'before' o 'after', sin inventar un número", () => {
    const onlyBefore = computeBenchmarkDiff(snap(), null);
    expect(onlyBefore.cpuUsagePercent.diff).toBeNull();

    const onlyAfter = computeBenchmarkDiff(null, snap());
    expect(onlyAfter.cpuUsagePercent.diff).toBeNull();

    const neither = computeBenchmarkDiff(null, null);
    expect(neither.cpuUsagePercent.before).toBeNull();
    expect(neither.cpuUsagePercent.after).toBeNull();
  });

  it("devuelve diff null para un campo concreto si ese campo era null en el snapshot original (dato no disponible)", () => {
    const before = snap({ cpuUsagePercent: null });
    const after = snap({ cpuUsagePercent: 40 });
    const diff = computeBenchmarkDiff(before, after);
    expect(diff.cpuUsagePercent.diff).toBeNull();
  });
});
