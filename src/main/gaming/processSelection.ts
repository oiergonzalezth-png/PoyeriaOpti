import type { ProcessInfo } from "@shared/types/system";

export interface SelectionOptions {
  /** Nombre de proceso del propio juego (basename del executablePath), para nunca tocarlo. */
  gameProcessName: string | null;
  /** Nombres de proceso que el perfil marca como intocables (Discord, OBS, etc.). */
  allowedProcesses: string[];
  /** Máximo de procesos a tocar en una sola activación (acotar el alcance y el tiempo de la operación). */
  limit?: number;
}

/**
 * Selecciona qué procesos en segundo plano son candidatos a bajar de
 * prioridad al activar Gaming Mode: ni críticos del sistema, ni el propio
 * juego, ni los que el perfil proteja explícitamente. Entre los que
 * quedan, se priorizan los que más RAM consumen (más probable que sean
 * "innecesarios" en ese momento, ver regla del proyecto sobre detectar
 * procesos que consumen demasiados recursos).
 */
export function selectProcessesToDeprioritize(processes: ProcessInfo[], options: SelectionOptions): ProcessInfo[] {
  const limit = options.limit ?? 15;
  const allowedLower = new Set(options.allowedProcesses.map((n) => n.trim().toLowerCase()));
  const gameNameLower = options.gameProcessName?.trim().toLowerCase() ?? null;

  const candidates = processes.filter((p) => {
    if (p.critical) return false;
    const nameLower = p.name.trim().toLowerCase();
    if (gameNameLower && nameLower === gameNameLower) return false;
    if (allowedLower.has(nameLower)) return false;
    return true;
  });

  return candidates.sort((a, b) => b.memoryMb - a.memoryMb).slice(0, limit);
}

/** Encuentra el proceso del propio juego (por nombre de ejecutable) si está corriendo. */
export function findGameProcess(processes: ProcessInfo[], gameProcessName: string | null): ProcessInfo | null {
  if (!gameProcessName) return null;
  const nameLower = gameProcessName.trim().toLowerCase();
  return processes.find((p) => p.name.trim().toLowerCase() === nameLower) ?? null;
}

/** Extrae el nombre de archivo (p. ej. "valorant.exe") de una ruta de ejecutable dada por el usuario. */
export function executableBaseName(executablePath: string): string {
  const normalized = executablePath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || executablePath;
}
