import { describe, it, expect } from "vitest";
import { computeMbps } from "../src/main/network/speedTest";

describe("computeMbps", () => {
  it("calcula Mbps a partir de bytes y milisegundos", () => {
    // 10,000,000 bytes en 1000ms = 80 Mbps (10MB * 8 bits / 1s / 1e6)
    expect(computeMbps(10_000_000, 1000)).toBe(80);
  });

  it("redondea a un decimal", () => {
    expect(computeMbps(1_250_000, 1000)).toBe(10);
  });

  it("devuelve null si el tiempo o los bytes son cero o negativos, en vez de dividir por cero", () => {
    expect(computeMbps(1000, 0)).toBeNull();
    expect(computeMbps(0, 1000)).toBeNull();
    expect(computeMbps(-1, 1000)).toBeNull();
  });

  it("agrega correctamente 8 streams paralelos — 900 Mbps", () => {
    // Simulación: 8 streams × 25 MB cada uno en 2222 ms ≈ 900 Mbps
    // 8 * 25_000_000 bytes * 8 bits / 2.222 s / 1e6 ≈ 720 Mbps (ventana compartida)
    // La ventana elapsed es la del más lento; si todos tardan igual = 2222 ms
    const totalBytes = 8 * 25_000_000;
    const elapsedMs = 2222;
    const result = computeMbps(totalBytes, elapsedMs);
    // ~720 Mbps (los streams comparten ancho de banda, no lo multiplican)
    expect(result).toBeGreaterThan(700);
    expect(result).toBeLessThan(730);
  });

  it("calcula correctamente para líneas lentas (<150 Mbps) con un solo stream", () => {
    // 25 MB en 2105 ms ≈ 95 Mbps
    const result = computeMbps(25_000_000, 2105);
    expect(result).toBeCloseTo(95.0, 0);
  });
});
