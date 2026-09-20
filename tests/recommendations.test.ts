import { describe, it, expect } from "vitest";
import { buildRecommendations } from "../src/renderer/services/recommendations";
import { appendSample, historySpanMinutes } from "../src/renderer/services/metricHistory";
import { healthTone } from "../src/renderer/services/healthVerdict";
import { placeLabels, smoothPath } from "../src/renderer/components/LiveTrace";
import type { HardwareSnapshot, ProcessInfo, StartupItemInfo, TweakDefinition } from "../src/shared/types/system";

function snapshot(overrides: { ramPercent?: number; cpu?: number | null; diskPercent?: number } = {}): HardwareSnapshot {
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      manufacturer: "Intel",
      brand: "Core i3",
      physicalCores: 2,
      logicalCores: 4,
      speedGhz: 2.4,
      currentLoadPercent: overrides.cpu === undefined ? 20 : overrides.cpu,
      temperatureC: null
    },
    gpu: [],
    ram: { totalMb: 8192, usedMb: 4000, availableMb: 4192, usedPercent: overrides.ramPercent ?? 40 },
    disks: [{ device: "C:", type: "NTFS", sizeGb: 256, freeGb: 100, usedPercent: overrides.diskPercent ?? 50 }],
    physicalDisks: [],
    os: { platform: "win32", distro: "Windows 10", release: "10", build: "19045", arch: "x64", servicePack: null, uefi: true },
    nonWindowsEnvironment: false
  };
}

const proc = (name: string, memoryMb: number, cpuPercent: number, critical = false): ProcessInfo => ({
  pid: Math.floor(Math.random() * 1e5) + 1,
  name,
  memoryMb,
  cpuPercent,
  status: "running",
  critical
});

const startup = (name: string, enabled = true): StartupItemInfo => ({
  id: `HKCU::${name}`,
  name,
  command: null,
  location: "HKCU",
  hive: "HKCU",
  requiresAdmin: false,
  enabled,
  impact: null
});

const tweak = (id: string, status: TweakDefinition["status"]): TweakDefinition => ({
  id,
  name: id,
  description: "",
  category: "x",
  risk: "LOW",
  impact: "LOW",
  status,
  requiresAdmin: false
});

describe("buildRecommendations", () => {
  it("no sugiere nada cuando todo está en orden", () => {
    const recs = buildRecommendations({ snapshot: snapshot(), processes: [], startupItems: [], tweaks: [] });
    expect(recs).toEqual([]);
  });

  it("no sugiere nada si no hay datos", () => {
    expect(buildRecommendations({ snapshot: null, processes: [], startupItems: [], tweaks: [] })).toEqual([]);
  });

  it("avisa de RAM alta y nombra el proceso no crítico que más memoria usa", () => {
    const recs = buildRecommendations({
      snapshot: snapshot({ ramPercent: 86 }),
      processes: [proc("system-core", 3000, 1, true), proc("chrome.exe", 1200, 5), proc("notepad.exe", 40, 0)],
      startupItems: [],
      tweaks: []
    });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ id: "ram-high", tone: "warn", target: "processes", descKey: "rec.ram.desc" });
    expect(recs[0].vars).toEqual({ name: "chrome.exe", mb: 1200 });
  });

  it("la RAM por encima del 90 % es urgente", () => {
    const recs = buildRecommendations({ snapshot: snapshot({ ramPercent: 93 }), processes: [], startupItems: [], tweaks: [] });
    expect(recs[0].tone).toBe("danger");
    expect(recs[0].descKey).toBe("rec.ram.descNoProcess");
  });

  it("avisa de CPU alta y de disco casi lleno", () => {
    const recs = buildRecommendations({
      snapshot: snapshot({ cpu: 91, diskPercent: 88 }),
      processes: [proc("encoder.exe", 200, 80)],
      startupItems: [],
      tweaks: []
    });
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("cpu-high");
    expect(ids).toContain("disk-low");
    expect(recs.find((r) => r.id === "disk-low")?.tone).toBe("warn");
    expect(recs.find((r) => r.id === "cpu-high")?.vars).toEqual({ name: "encoder.exe", percent: 80 });
  });

  it("solo cuenta los programas de inicio ACTIVADOS", () => {
    const few = Array.from({ length: 8 }, (_, i) => startup(`app${i}`, i < 4));
    expect(buildRecommendations({ snapshot: null, processes: [], startupItems: few, tweaks: [] })).toEqual([]);

    const many = Array.from({ length: 7 }, (_, i) => startup(`app${i}`));
    const recs = buildRecommendations({ snapshot: null, processes: [], startupItems: many, tweaks: [] });
    expect(recs[0]).toMatchObject({ id: "startup-many", target: "startup", vars: { count: 7 } });
  });

  it("sugiere las optimizaciones sin aplicar pero no las desconocidas", () => {
    const recs = buildRecommendations({
      snapshot: null,
      processes: [],
      startupItems: [],
      tweaks: [tweak("a", "NOT_APPLIED"), tweak("b", "APPLIED"), tweak("c", "UNKNOWN"), tweak("d", "NOT_APPLIED")]
    });
    expect(recs[0]).toMatchObject({ id: "optimizer-pending", vars: { count: 2 } });
  });

  it("ordena por urgencia y limita a 4", () => {
    const recs = buildRecommendations({
      snapshot: snapshot({ ramPercent: 95, cpu: 97, diskPercent: 96 }),
      processes: [proc("a.exe", 500, 50)],
      startupItems: Array.from({ length: 9 }, (_, i) => startup(`s${i}`)),
      tweaks: [tweak("t", "NOT_APPLIED")]
    });
    expect(recs).toHaveLength(4);
    expect(recs.slice(0, 3).every((r) => r.tone === "danger")).toBe(true);
    expect(recs[3].tone).toBe("info");
  });
});

describe("appendSample", () => {
  it("añade y conserva solo las últimas muestras", () => {
    let h = [] as ReturnType<typeof appendSample>;
    for (let i = 0; i < 10; i++) h = appendSample(h, { t: i * 1000, cpu: i, ram: i }, 5);
    expect(h).toHaveLength(5);
    expect(h[0].cpu).toBe(5);
    expect(h[4].cpu).toBe(9);
  });

  it("ignora una muestra repetida con la misma marca de tiempo", () => {
    const h1 = appendSample([], { t: 1, cpu: 1, ram: 1 });
    const h2 = appendSample(h1, { t: 1, cpu: 2, ram: 2 });
    expect(h2).toBe(h1);
  });

  it("calcula los minutos que abarca el historial", () => {
    expect(historySpanMinutes([])).toBe(0);
    expect(historySpanMinutes([{ t: 0, cpu: 1, ram: 1 }, { t: 120000, cpu: 1, ram: 1 }])).toBe(2);
  });
});

describe("healthTone", () => {
  it("usa los mismos umbrales que el cálculo de salud", () => {
    expect(healthTone(null)).toBe("none");
    expect(healthTone(90)).toBe("good");
    expect(healthTone(75)).toBe("good");
    expect(healthTone(74)).toBe("tight");
    expect(healthTone(45)).toBe("tight");
    expect(healthTone(44)).toBe("bad");
  });
});


describe("placeLabels (etiquetas de la gráfica)", () => {
  it("no toca etiquetas que ya están separadas y dentro del área", () => {
    expect(placeLabels(50, 120, 20, 190, 36)).toEqual({ cpu: 50, ram: 120 });
  });

  it("las mantiene dentro del área visible aunque el valor esté en el borde", () => {
    expect(placeLabels(400, null, 20, 190, 36)).toEqual({ cpu: 190, ram: null });
    expect(placeLabels(null, -30, 20, 190, 36)).toEqual({ cpu: null, ram: 20 });
  });

  it("separa etiquetas que se pisan, sin salirse por abajo", () => {
    const r = placeLabels(185, 188, 20, 190, 36);
    expect(r.cpu).not.toBeNull();
    expect(Math.abs((r.cpu as number) - (r.ram as number))).toBeGreaterThanOrEqual(36);
    expect(Math.max(r.cpu as number, r.ram as number)).toBeLessThanOrEqual(190);
    // conserva el orden: la de arriba sigue arriba
    expect((r.cpu as number) < (r.ram as number)).toBe(true);
  });
});

describe("smoothPath", () => {
  it("devuelve cadena vacía sin puntos y un punto suelto con uno", () => {
    expect(smoothPath([])).toBe("");
    expect(smoothPath([{ x: 1, y: 2 }])).toBe("M1,2");
  });

  it("empieza y termina exactamente en el primer y último punto", () => {
    const d = smoothPath([{ x: 0, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 5 }]);
    expect(d.startsWith("M0,10")).toBe(true);
    expect(d.endsWith("L20,5")).toBe(true);
  });
});
