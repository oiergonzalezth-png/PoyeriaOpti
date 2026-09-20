import type { SafeProcessPriority } from "@shared/types/system";

/**
 * Prioridades válidas para `[System.Diagnostics.Process]::PriorityClass`.
 * Deliberadamente NO incluye "RealTime" (puede congelar el sistema) ni
 * "Idle" (dejaría un proceso prácticamente parado) — Gaming Mode solo
 * necesita subir/bajar un escalón razonable, no extremos peligrosos.
 */
export type PsPriority = "High" | "Normal" | "BelowNormal";

export function toPsPriority(priority: SafeProcessPriority): PsPriority {
  return priority === "HIGH" ? "High" : "Normal";
}

const VALID_PS_PRIORITIES: ReadonlySet<string> = new Set(["High", "Normal", "BelowNormal"]);

export function isValidPsPriority(value: string): value is PsPriority {
  return VALID_PS_PRIORITIES.has(value);
}

/**
 * Los PIDs se interpolan en un script de PowerShell, así que SOLO se aceptan
 * enteros positivos: cualquier otra cosa (texto, decimales, NaN) haría
 * posible inyectar código en el script.
 */
function assertValidPid(pid: number): void {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    throw new Error(`PID no válido: ${String(pid)}`);
  }
}

/** Construye el script para LEER la prioridad actual de una lista de PIDs. */
export function buildGetPrioritiesScript(pids: number[]): string {
  pids.forEach(assertValidPid);
  const idsList = pids.join(",");
  return `Get-Process -Id ${idsList} -ErrorAction SilentlyContinue | Select-Object Id,PriorityClass | ConvertTo-Json -Compress`;
}

/**
 * Parsea la salida de `buildGetPrioritiesScript`. `ConvertTo-Json` en
 * PowerShell devuelve un objeto suelto (no array) cuando solo hay UN
 * resultado, así que hay que contemplar ambos casos.
 */
export function parsePrioritiesJson(stdout: string): Map<number, PsPriority> {
  const result = new Map<number, PsPriority>();
  const trimmed = stdout.trim();
  if (!trimmed) return result;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return result;
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of items) {
    if (
      item &&
      typeof item === "object" &&
      "Id" in item &&
      "PriorityClass" in item &&
      typeof (item as any).Id === "number" &&
      typeof (item as any).PriorityClass === "string" &&
      isValidPsPriority((item as any).PriorityClass)
    ) {
      result.set((item as any).Id, (item as any).PriorityClass as PsPriority);
    }
  }
  return result;
}

export interface PrioritySetEntry {
  pid: number;
  priority: PsPriority;
}

/** Construye el script para ESCRIBIR la prioridad de varios PIDs de una vez (una sola llamada a powershell.exe). */
export function buildSetPrioritiesScript(entries: PrioritySetEntry[]): string {
  const lines = entries.map((e) => {
    assertValidPid(e.pid);
    if (!isValidPsPriority(e.priority)) {
      throw new Error(`Prioridad no permitida: ${e.priority}`);
    }
    return (
      `try { (Get-Process -Id ${e.pid} -ErrorAction Stop).PriorityClass = '${e.priority}'; ` +
      `Write-Output '${e.pid}:OK' } catch { Write-Output '${e.pid}:FAIL' }`
    );
  });
  return lines.join("; ");
}

/** Parsea la salida "pid:OK"/"pid:FAIL" de `buildSetPrioritiesScript`. */
export function parseSetPrioritiesOutput(stdout: string): Map<number, boolean> {
  const result = new Map<number, boolean>();
  const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^(\d+):(OK|FAIL)$/);
    if (match) {
      result.set(Number(match[1]), match[2] === "OK");
    }
  }
  return result;
}
