import type { OperationResult, RestorePoint } from "@shared/types/system";
import { getRestorePointsStore } from "./restorePointsStoreInstance";

/**
 * Extrae el "dominio" de un `tweakId` con el formato `dominio:resto`.
 * Devuelve `null` si no sigue ese formato (dato corrupto/inesperado).
 */
export function parseDomain(tweakId: string): string | null {
  const idx = tweakId.indexOf(":");
  if (idx <= 0) return null;
  return tweakId.slice(0, idx);
}

export type RestoreHandler = (point: RestorePoint) => Promise<OperationResult>;

/**
 * Registro de handlers de restauración por dominio. Cada módulo (Startup
 * ahora, Optimizer en la Fase 5, etc.) registra aquí cómo revertir SUS
 * propios puntos de restauración. El Restore Center no necesita saber
 * nada sobre el contenido de cada punto — solo enruta por dominio.
 */
const handlers = new Map<string, RestoreHandler>();

export function registerRestoreHandler(domain: string, handler: RestoreHandler): void {
  handlers.set(domain, handler);
}

/**
 * Restaura un punto por su id, delegando en el handler de su dominio.
 * Aceptamos el store como parámetro para poder testear esta función con
 * un store en un directorio temporal en vez del store real de Electron.
 */
export async function restoreAnyPoint(
  restorePointId: string,
  store = getRestorePointsStore()
): Promise<OperationResult> {
  const point = store.getById(restorePointId);
  if (!point) {
    return { success: false, message: "No se encontró ese punto de restauración.", error: "NOT_FOUND" };
  }

  if (point.restored) {
    return { success: false, message: "Este cambio ya había sido restaurado anteriormente.", error: "ALREADY_RESTORED" };
  }

  const domain = parseDomain(point.tweakId);
  const handler = domain ? handlers.get(domain) : undefined;

  if (!handler) {
    return {
      success: false,
      message: `No hay un módulo capaz de restaurar cambios del tipo "${domain ?? "desconocido"}".`,
      error: "NO_HANDLER_FOR_DOMAIN"
    };
  }

  return handler(point);
}
