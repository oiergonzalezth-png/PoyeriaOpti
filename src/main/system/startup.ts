import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import type { StartupItemInfo, OperationResult, RestorePoint } from "@shared/types/system";
import { logOperation } from "../services/logger";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { registerRestoreHandler } from "../services/restoreDispatcher";
import { runRegCommand } from "./elevatedCommand";
import { buildStartupApprovedValue, parseStartupApprovedValue, bufferToRegHex, regHexToBuffer } from "./startupApproved";
import { resolveSystemBinary } from "./systemBinaries";
import { isHexString, parseStartupItemId } from "../security/validation";

const execFileAsync = promisify(execFile);

const RUN_KEYS: { hive: "HKCU" | "HKLM"; path: string }[] = [
  { hive: "HKCU", path: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" },
  { hive: "HKLM", path: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" }
];

function approvedPathFor(hive: "HKCU" | "HKLM"): string {
  const root = hive === "HKCU" ? "HKCU" : "HKLM";
  return `${root}\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run`;
}

/** Identificador estable de punto de restauración para un item de inicio dado. */
function restoreTweakId(itemId: string): string {
  return `startup:${itemId}`;
}

async function readApprovedValueHex(hive: "HKCU" | "HKLM", name: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("reg"), ["query", approvedPathFor(hive), "/v", name], {
      windowsHide: true
    });
    const match = stdout.match(/REG_BINARY\s+([0-9A-Fa-f]+)/);
    return match ? match[1] : null;
  } catch {
    // La clave/valor no existe: no hay estado guardado todavía, lo que en
    // Windows significa "habilitado" por defecto.
    return null;
  }
}

/**
 * Lee las entradas de inicio de Windows a partir de las claves de registro
 * "Run" estándar, y determina su estado real (habilitado/deshabilitado)
 * consultando `StartupApproved\Run`. En cualquier plataforma distinta de
 * Windows devuelve una lista vacía en lugar de datos inventados.
 */
export async function getStartupItems(): Promise<StartupItemInfo[]> {
  if (os.platform() !== "win32") {
    return [];
  }

  const items: StartupItemInfo[] = [];

  for (const key of RUN_KEYS) {
    let stdout: string;
    try {
      const result = await execFileAsync(resolveSystemBinary("reg"), ["query", key.path], { windowsHide: true });
      stdout = result.stdout;
    } catch {
      // La clave puede no existir o no tener entradas; no es un error fatal.
      continue;
    }

    const lines = stdout.split(/\r?\n/).filter((l) => l.trim().length > 0);

    for (const line of lines) {
      const match = line.match(/^\s{2,}(\S.*?)\s+(REG_SZ|REG_EXPAND_SZ)\s+(.*)$/);
      if (!match) continue;
      const [, name, , command] = match;

      const approvedHex = await readApprovedValueHex(key.hive, name);
      const enabled = approvedHex ? parseStartupApprovedValue(regHexToBuffer(approvedHex)) ?? true : true;

      items.push({
        id: `${key.hive}::${name}`,
        name,
        command: command.trim() || null,
        location: key.path,
        hive: key.hive,
        requiresAdmin: key.hive === "HKLM",
        enabled,
        // Ver comentario en el tipo: no se inventa una medición de impacto.
        impact: null
      });
    }
  }

  return items;
}

/**
 * Activa/desactiva una entrada de inicio SIN eliminarla del Run key,
 * escribiendo el marcador de estado en `StartupApproved\Run` — el mismo
 * mecanismo que usa el Administrador de tareas de Windows.
 *
 * Antes de escribir nada, se guarda el valor anterior (o su ausencia) como
 * punto de restauración (regla #8: backup antes de cualquier cambio).
 */
export async function setStartupItemEnabled(id: string, enabled: boolean): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return {
      success: false,
      message: "Esta operación solo está disponible en Windows.",
      error: "UNSUPPORTED_PLATFORM"
    };
  }

  const parsed = parseStartupItemId(id);
  if (!parsed) {
    return { success: false, message: "Identificador de entrada de inicio no válido.", error: "INVALID_ID" };
  }
  const { hive, name } = parsed;

  // Solo se puede tocar una entrada que exista DE VERDAD en las claves Run:
  // un id inventado por el renderer nunca llega a `reg.exe`.
  const knownItems = await getStartupItems();
  if (!knownItems.some((item) => item.id === id)) {
    return { success: false, message: "Esa entrada de inicio ya no existe.", error: "NOT_FOUND" };
  }

  const approvedPath = approvedPathFor(hive);
  const requiresAdmin = hive === "HKLM";

  // 1) Backup: leer el valor actual (o su ausencia) ANTES de tocar nada.
  const previousHex = await readApprovedValueHex(hive, name);
  getRestorePointsStore().add({
    tweakId: restoreTweakId(id),
    tweakName: name,
    description: `Se ${enabled ? "activó" : "desactivó"} el inicio automático de "${name}" (${hive}).`,
    previousValue: previousHex // string hex, o null si no existía ningún valor previo
  });

  // 2) Aplicar el cambio.
  const newValueHex = bufferToRegHex(buildStartupApprovedValue(enabled));
  const args = ["add", approvedPath, "/v", name, "/t", "REG_BINARY", "/d", newValueHex, "/f"];

  const { exitCode } = await runRegCommand(args, requiresAdmin);

  if (exitCode !== 0) {
    const message = requiresAdmin
      ? `No se pudo ${enabled ? "activar" : "desactivar"} "${name}": se requieren permisos de administrador y no se concedieron (o se canceló el aviso de UAC).`
      : `No se pudo ${enabled ? "activar" : "desactivar"} "${name}".`;
    logOperation(`${enabled ? "Activar" : "Desactivar"} inicio: ${name}`, "FAILURE", message);
    return { success: false, message, error: requiresAdmin ? "ELEVATION_FAILED_OR_CANCELLED" : "REG_COMMAND_FAILED" };
  }

  logOperation(`${enabled ? "Activado" : "Desactivado"} el inicio de "${name}"`, "SUCCESS");
  return {
    success: true,
    message: `"${name}" ${enabled ? "se iniciará" : "ya no se iniciará"} automáticamente con Windows.`
  };
}

/**
 * Núcleo de la restauración: dado un punto de restauración ya obtenido,
 * revierte el cambio de Startup Manager. Si no existía valor previo, borra
 * el valor que creamos (para volver exactamente al estado original); si
 * existía, lo re-escribe.
 */
export async function restoreStartupPoint(point: RestorePoint): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return {
      success: false,
      message: "Esta operación solo está disponible en Windows.",
      error: "UNSUPPORTED_PLATFORM"
    };
  }

  const itemId = point.tweakId.replace(/^startup:/, "");
  const parsed = parseStartupItemId(itemId);
  if (!parsed) {
    return { success: false, message: "Punto de restauración corrupto.", error: "INVALID_RESTORE_POINT" };
  }
  const { hive, name } = parsed;

  // El valor guardado viene de un fichero en disco: se valida antes de pasarlo a reg.exe.
  const rawPrevious = point.previousValue;
  if (rawPrevious != null && !isHexString(rawPrevious)) {
    return { success: false, message: "Punto de restauración corrupto.", error: "INVALID_RESTORE_POINT" };
  }
  const previousHex = (rawPrevious as string | null | undefined) ?? null;

  const approvedPath = approvedPathFor(hive);
  const requiresAdmin = hive === "HKLM";

  const args =
    previousHex == null
      ? ["delete", approvedPath, "/v", name, "/f"]
      : ["add", approvedPath, "/v", name, "/t", "REG_BINARY", "/d", previousHex, "/f"];

  const { exitCode } = await runRegCommand(args, requiresAdmin);

  if (exitCode !== 0) {
    logOperation(`Restaurar inicio: ${name}`, "FAILURE", "No se pudo revertir el cambio.");
    return { success: false, message: `No se pudo restaurar "${name}".`, error: "REG_COMMAND_FAILED" };
  }

  getRestorePointsStore().markRestored(point.id);
  logOperation(`Restaurado el estado de inicio de "${name}"`, "SUCCESS");
  return { success: true, message: `Se restauró el estado anterior de "${name}".` };
}

registerRestoreHandler("startup", restoreStartupPoint);

/**
 * Variante de conveniencia usada directamente por el IPC del Startup
 * Manager: busca el punto por id y delega en `restoreStartupPoint`.
 */
export async function restoreStartupItemFromPoint(restorePointId: string): Promise<OperationResult> {
  const store = getRestorePointsStore();
  const point = store.getById(restorePointId);
  if (!point || !point.tweakId.startsWith("startup:")) {
    return { success: false, message: "No se encontró ese punto de restauración.", error: "NOT_FOUND" };
  }
  return restoreStartupPoint(point);
}
