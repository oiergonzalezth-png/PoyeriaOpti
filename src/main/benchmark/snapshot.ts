import type { BenchmarkSnapshot } from "@shared/types/system";
import { getHardwareSnapshot } from "../system/hardwareInfo";
import { getProcessList } from "../system/processes";

/**
 * Captura un snapshot de benchmark reutilizando la detección de hardware
 * (Fase 2) y el listado de procesos (Fase 1/3) que ya existen. Nunca mide
 * ni muestra FPS (regla #15: "No inventar FPS") — solo métricas del propio
 * sistema, que sí se pueden medir honestamente sin instrumentar el juego.
 */
export async function captureBenchmarkSnapshot(): Promise<BenchmarkSnapshot> {
  const [hardware, processes] = await Promise.all([
    getHardwareSnapshot().catch(() => null),
    getProcessList().catch(() => null)
  ]);

  const mainDisk = hardware?.disks?.[0] ?? null;

  return {
    timestamp: new Date().toISOString(),
    cpuUsagePercent: hardware?.cpu.currentLoadPercent ?? null,
    ramUsagePercent: hardware?.ram.usedPercent ?? null,
    processCount: processes != null ? processes.length : null,
    diskUsagePercent: mainDisk?.usedPercent ?? null
  };
}
