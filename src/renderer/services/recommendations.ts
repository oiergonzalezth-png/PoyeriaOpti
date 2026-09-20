import type { HardwareSnapshot, ProcessInfo, StartupItemInfo, TweakDefinition } from "@shared/types/system";
import type { TranslationKey } from "../i18n/es";
import type { SectionId } from "../navigation";

export type RecommendationTone = "danger" | "warn" | "info";

export interface DashboardRecommendation {
  id: string;
  tone: RecommendationTone;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  vars: Record<string, string | number>;
  actionKey: TranslationKey;
  target: SectionId;
}

export interface RecommendationInput {
  snapshot: HardwareSnapshot | null;
  processes: ProcessInfo[];
  startupItems: StartupItemInfo[];
  tweaks: TweakDefinition[];
}

const TONE_ORDER: Record<RecommendationTone, number> = { danger: 0, warn: 1, info: 2 };
const MAX_RECOMMENDATIONS = 4;

/**
 * Convierte datos REALES del sistema en sugerencias concretas. No inventa
 * nada: si un dato falta, esa sugerencia simplemente no aparece.
 */
export function buildRecommendations(input: RecommendationInput): DashboardRecommendation[] {
  const { snapshot, processes, startupItems, tweaks } = input;
  const out: DashboardRecommendation[] = [];

  const closable = processes.filter((p) => !p.critical);

  if (snapshot && snapshot.ram.totalMb > 0 && snapshot.ram.usedPercent >= 80) {
    const heaviest = [...closable].sort((a, b) => b.memoryMb - a.memoryMb)[0];
    out.push({
      id: "ram-high",
      tone: snapshot.ram.usedPercent >= 90 ? "danger" : "warn",
      titleKey: "rec.ram.title",
      descKey: heaviest ? "rec.ram.desc" : "rec.ram.descNoProcess",
      vars: heaviest ? { name: heaviest.name, mb: Math.round(heaviest.memoryMb) } : {},
      actionKey: "rec.ram.action",
      target: "processes"
    });
  }

  const cpuLoad = snapshot?.cpu.currentLoadPercent;
  if (cpuLoad != null && cpuLoad >= 85) {
    const busiest = [...closable].sort((a, b) => b.cpuPercent - a.cpuPercent)[0];
    out.push({
      id: "cpu-high",
      tone: cpuLoad >= 95 ? "danger" : "warn",
      titleKey: "rec.cpu.title",
      descKey: busiest && busiest.cpuPercent > 0 ? "rec.cpu.desc" : "rec.cpu.descNoProcess",
      vars: busiest ? { name: busiest.name, percent: Math.round(busiest.cpuPercent) } : {},
      actionKey: "rec.cpu.action",
      target: "processes"
    });
  }

  const mainDisk = snapshot?.disks[0];
  if (mainDisk && mainDisk.sizeGb > 0) {
    const freePercent = 100 - mainDisk.usedPercent;
    if (freePercent <= 15) {
      out.push({
        id: "disk-low",
        tone: freePercent <= 8 ? "danger" : "warn",
        titleKey: "rec.disk.title",
        descKey: "rec.disk.desc",
        vars: { drive: mainDisk.device, free: Math.round(mainDisk.freeGb) },
        actionKey: "rec.disk.action",
        target: "scan"
      });
    }
  }

  const startupEnabled = startupItems.filter((i) => i.enabled).length;
  if (startupEnabled >= 6) {
    out.push({
      id: "startup-many",
      tone: "info",
      titleKey: "rec.startup.title",
      descKey: "rec.startup.desc",
      vars: { count: startupEnabled },
      actionKey: "rec.startup.action",
      target: "startup"
    });
  }

  const pendingTweaks = tweaks.filter((t) => t.status === "NOT_APPLIED").length;
  if (pendingTweaks > 0) {
    out.push({
      id: "optimizer-pending",
      tone: "info",
      titleKey: "rec.optimizer.title",
      descKey: "rec.optimizer.desc",
      vars: { count: pendingTweaks },
      actionKey: "rec.optimizer.action",
      target: "optimizer"
    });
  }

  return out.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]).slice(0, MAX_RECOMMENDATIONS);
}
