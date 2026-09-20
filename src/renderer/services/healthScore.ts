import type { HardwareSnapshot } from "@shared/types/system";

export interface HealthScoreResult {
  score: number | null;
  factors: { label: string; value: string; weightPercent: number }[];
}

/**
 * Calcula un porcentaje de "salud" del sistema a partir de factores REALES
 * disponibles en el snapshot. Si un factor no está disponible, se excluye
 * del cálculo (y se re-normalizan los pesos) en lugar de inventarlo.
 *
 * Fase 1: factores disponibles = RAM disponible, uso de CPU, espacio en disco.
 * El resto de factores del roadmap (programas de inicio, procesos en
 * segundo plano, configuración energética) se incorporan en fases
 * posteriores cuando esos módulos existan.
 */
export function calculateHealthScore(snapshot: HardwareSnapshot | null): HealthScoreResult {
  if (!snapshot) {
    return { score: null, factors: [] };
  }

  const factors: { label: string; weightPercent: number; score: number | null; display: string }[] = [];

  // Factor 1: RAM disponible (porcentaje libre). Más libre = mejor.
  if (snapshot.ram.totalMb > 0) {
    const freePercent = 100 - snapshot.ram.usedPercent;
    factors.push({
      label: "RAM disponible",
      weightPercent: 40,
      score: clamp01(freePercent / 40), // 40% libre o más => puntuación máxima
      display: `${freePercent.toFixed(1)}% libre`
    });
  }

  // Factor 2: uso de CPU actual. Menos uso = mejor.
  if (snapshot.cpu.currentLoadPercent != null) {
    const load = snapshot.cpu.currentLoadPercent;
    factors.push({
      label: "Uso de CPU",
      weightPercent: 30,
      score: clamp01(1 - load / 90),
      display: `${load.toFixed(1)}%`
    });
  }

  // Factor 3: espacio libre en el disco principal.
  const mainDisk = snapshot.disks[0];
  if (mainDisk) {
    const freePercent = 100 - mainDisk.usedPercent;
    factors.push({
      label: "Espacio en disco",
      weightPercent: 30,
      score: clamp01(freePercent / 25), // 25% libre o más => puntuación máxima
      display: `${freePercent.toFixed(1)}% libre`
    });
  }

  const usable = factors.filter((f) => f.score != null);
  if (usable.length === 0) {
    return { score: null, factors: [] };
  }

  const totalWeight = usable.reduce((sum, f) => sum + f.weightPercent, 0);
  const weighted = usable.reduce((sum, f) => sum + (f.score as number) * f.weightPercent, 0);
  const score = Math.round((weighted / totalWeight) * 100);

  return {
    score,
    factors: usable.map((f) => ({
      label: f.label,
      value: f.display,
      weightPercent: Math.round((f.weightPercent / totalWeight) * 100)
    }))
  };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
