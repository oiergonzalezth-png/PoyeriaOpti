import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { BenchmarkStore } from "../src/main/benchmark/benchmarkStore";
import type { BenchmarkSnapshot } from "../src/shared/types/system";

let tmpDir: string;

function snap(overrides: Partial<BenchmarkSnapshot> = {}): BenchmarkSnapshot {
  return {
    timestamp: new Date().toISOString(),
    cpuUsagePercent: 50,
    ramUsagePercent: 60,
    processCount: 100,
    diskUsagePercent: 70,
    ...overrides
  };
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "leo-benchmark-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("BenchmarkStore", () => {
  it("empieza con before/after en null", () => {
    const store = new BenchmarkStore(tmpDir);
    expect(store.read()).toEqual({ before: null, after: null });
  });

  it("guarda 'before' y lo recupera", () => {
    const store = new BenchmarkStore(tmpDir);
    store.setBefore(snap({ cpuUsagePercent: 42 }));
    expect(store.read().before?.cpuUsagePercent).toBe(42);
    expect(store.read().after).toBeNull();
  });

  it("guarda 'after' sin perder 'before'", () => {
    const store = new BenchmarkStore(tmpDir);
    store.setBefore(snap({ cpuUsagePercent: 42 }));
    store.setAfter(snap({ cpuUsagePercent: 20 }));

    const state = store.read();
    expect(state.before?.cpuUsagePercent).toBe(42);
    expect(state.after?.cpuUsagePercent).toBe(20);
  });

  it("capturar un nuevo 'before' descarta el 'after' anterior (nueva comparación)", () => {
    const store = new BenchmarkStore(tmpDir);
    store.setBefore(snap());
    store.setAfter(snap());
    expect(store.read().after).not.toBeNull();

    store.setBefore(snap({ cpuUsagePercent: 99 }));
    expect(store.read().after).toBeNull();
    expect(store.read().before?.cpuUsagePercent).toBe(99);
  });

  it("reset() vuelve a dejar todo en null", () => {
    const store = new BenchmarkStore(tmpDir);
    store.setBefore(snap());
    store.setAfter(snap());
    store.reset();
    expect(store.read()).toEqual({ before: null, after: null });
  });
});
