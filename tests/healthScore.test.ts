import { describe, it, expect } from "vitest";
import { calculateHealthScore } from "../src/renderer/services/healthScore";
import type { HardwareSnapshot } from "../src/shared/types/system";

function makeSnapshot(overrides: Partial<HardwareSnapshot> = {}): HardwareSnapshot {
  return {
    timestamp: new Date().toISOString(),
    cpu: { manufacturer: "Intel", brand: "Core i5", physicalCores: 4, logicalCores: 8, speedGhz: 2.5, currentLoadPercent: 20, temperatureC: 55 },
    gpu: [],
    ram: { totalMb: 8192, usedMb: 4096, availableMb: 4096, usedPercent: 50 },
    disks: [{ device: "C:", type: "NTFS", sizeGb: 256, freeGb: 100, usedPercent: 60.9 }],
    physicalDisks: [{ name: "Samsung SSD 970", type: "NVMe", sizeGb: 256, interfaceType: "PCIe" }],
    os: {
      platform: "win32",
      distro: "Windows 11 Pro",
      release: "11",
      build: "22631",
      arch: "x64",
      servicePack: null,
      uefi: true
    },
    nonWindowsEnvironment: false,
    ...overrides
  };
}

describe("calculateHealthScore", () => {
  it("devuelve null si no hay snapshot", () => {
    expect(calculateHealthScore(null).score).toBeNull();
  });

  it("calcula un score entre 0 y 100 con datos completos", () => {
    const result = calculateHealthScore(makeSnapshot());
    expect(result.score).not.toBeNull();
    expect(result.score as number).toBeGreaterThanOrEqual(0);
    expect(result.score as number).toBeLessThanOrEqual(100);
  });

  it("puntúa peor un sistema con RAM y CPU muy cargadas", () => {
    const healthy = calculateHealthScore(makeSnapshot());
    const stressed = calculateHealthScore(
      makeSnapshot({
        ram: { totalMb: 8192, usedMb: 7800, availableMb: 392, usedPercent: 95.2 },
        cpu: { manufacturer: "Intel", brand: "Core i5", physicalCores: 4, logicalCores: 8, speedGhz: 2.5, currentLoadPercent: 92, temperatureC: 85 }
      })
    );
    expect(stressed.score as number).toBeLessThan(healthy.score as number);
  });

  it("excluye el factor de CPU si currentLoadPercent es null, sin inventar el dato", () => {
    const snapshot = makeSnapshot({
      cpu: { manufacturer: "Intel", brand: "Core i5", physicalCores: 4, logicalCores: 8, speedGhz: 2.5, currentLoadPercent: null, temperatureC: null }
    });
    const result = calculateHealthScore(snapshot);
    expect(result.factors.find((f) => f.label === "Uso de CPU")).toBeUndefined();
    expect(result.score).not.toBeNull();
  });
});
