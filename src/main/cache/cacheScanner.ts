import os from "os";
import fs from "fs/promises";
import type { CacheTargetInfo, OperationResult } from "@shared/types/system";
import { CACHE_TARGETS, CACHE_TARGETS_BY_ID, type CacheTarget } from "./cacheTargets";
import { getFolderSize, clearFolderContents } from "./folderSize";
import { logOperation } from "../services/logger";
import { runElevatedCommand } from "../system/elevatedCommand";

async function folderExists(dir: string): Promise<boolean> {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
}

async function isDetected(target: CacheTarget): Promise<boolean> {
  if (target.scope !== "apps") return true; // cachés de Windows: siempre "disponibles"
  const detectionFolder = target.detectionFolder?.() ?? null;
  if (detectionFolder) return folderExists(detectionFolder);
  // Sin carpeta de detección propia: se considera detectada si alguna carpeta de caché ya existe.
  for (const folder of target.folders()) {
    if (await folderExists(folder)) return true;
  }
  return false;
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Escanea todas las cachés del catálogo. En una app no-Windows (dev/tests),
 * las rutas simplemente no existen y el tamaño medido es 0 — no se inventa
 * un tamaño ni se oculta el target, para ser coherentes con el resto de la app.
 */
export async function scanCacheTargets(): Promise<CacheTargetInfo[]> {
  const results: CacheTargetInfo[] = [];

  for (const target of CACHE_TARGETS) {
    const detected = await isDetected(target);

    let sizeBytes = 0;
    if (detected) {
      for (const folder of target.folders()) {
        const scan = await getFolderSize(folder);
        sizeBytes += scan.sizeBytes;
      }
    }

    results.push({
      id: target.id,
      name: target.name,
      description: target.description,
      scope: target.scope,
      detected,
      sizeBytes: detected ? sizeBytes : null,
      requiresAdmin: target.requiresAdmin
    });
  }

  return results;
}

export async function clearCacheTargetById(id: string): Promise<OperationResult> {
  const target = CACHE_TARGETS_BY_ID.get(id);
  if (!target) {
    return { success: false, message: `No se reconoce la caché "${id}".`, error: "UNKNOWN_CACHE_TARGET" };
  }

  if (os.platform() !== "win32") {
    return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  let totalFreed = 0;
  let totalFailed = 0;
  for (const folder of target.folders()) {
    const result = await clearFolderContents(folder);
    totalFreed += result.freedBytes;
    totalFailed += result.failedCount;
  }

  if (totalFreed === 0 && totalFailed === 0) {
    logOperation(`Limpiar caché: ${target.name}`, "SUCCESS");
    return { success: true, message: `"${target.name}" ya estaba vacía. Nada que limpiar.` };
  }

  logOperation(`Limpiar caché: ${target.name}`, "SUCCESS");

  if (totalFailed > 0) {
    return {
      success: true,
      message:
        `Se liberaron ${formatMb(totalFreed)} de "${target.name}". ${totalFailed} fichero(s) seguían en uso y no se pudieron borrar ` +
        `(cierra la app y vuelve a limpiar si quieres liberar también esos).`
    };
  }

  return { success: true, message: `Se liberaron ${formatMb(totalFreed)} de "${target.name}".` };
}

/**
 * Vacía la caché de resolución DNS del sistema (`ipconfig /flushdns`).
 * No requiere administrador en Windows normal, pero sí requiere estar en
 * Windows: en otras plataformas se rechaza en vez de fingir éxito.
 */
export async function flushDnsCache(): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  const { exitCode, stdout } = await runElevatedCommand("ipconfig", ["/flushdns"], false);
  if (exitCode !== 0) {
    logOperation("Vaciar caché DNS", "FAILURE", stdout.slice(0, 200));
    return { success: false, message: "No se pudo vaciar la caché DNS.", error: "IPCONFIG_COMMAND_FAILED" };
  }

  logOperation("Vaciar caché DNS", "SUCCESS");
  return { success: true, message: "Caché DNS vaciada. Los próximos sitios que visites resolverán su dirección de nuevo." };
}
