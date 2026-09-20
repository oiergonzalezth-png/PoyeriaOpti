import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import type { OperationResult } from "@shared/types/system";
import type { Tweak } from "../types";
import { logOperation } from "../../services/logger";
import { getRestorePointsStore } from "../../services/restorePointsStoreInstance";
import { runElevatedCommand } from "../../system/elevatedCommand";
import { resolveSystemBinary } from "../../system/systemBinaries";

const execFileAsync = promisify(execFile);
const SERVICE_NAME = "SysMain";
const TWEAK_ID = "set-sysmain-manual";
const TWEAK_NAME = "Set SysMain (Superfetch) to Manual startup";

/** Lee el tipo de inicio actual del servicio ("AUTO_START", "DEMAND_START", "DISABLED", ...). */
async function readStartType(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("sc"), ["qc", SERVICE_NAME], { windowsHide: true });
    const match = stdout.match(/START_TYPE\s*:\s*\d+\s+(\S+)/);
    return match ? match[1] : null;
  } catch {
    return null; // el servicio no existe en este sistema
  }
}

function scStartFlag(startType: string): string | null {
  switch (startType.toUpperCase()) {
    case "AUTO_START":
      return "auto";
    case "DEMAND_START":
      return "demand";
    case "DISABLED":
      return "disabled";
    default:
      return null; // tipo desconocido: no lo tocamos para no adivinar
  }
}

async function setStartType(flag: string, elevated: boolean): Promise<boolean> {
  const { exitCode } = await runElevatedCommand("sc", ["config", SERVICE_NAME, "start=", flag], elevated);
  return exitCode === 0;
}

export const setSysmainManualTweak: Tweak = {
  id: TWEAK_ID,
  name: TWEAK_NAME,
  description:
    'Cambia el inicio del servicio "SysMain" (antes llamado Superfetch) de Automático a Manual. ' +
    "SysMain precarga en RAM las aplicaciones que sueles usar para abrirlas más rápido; en discos " +
    "duros mecánicos suele merecer la pena, pero en SSD aporta poco y consume CPU/RAM en segundo plano. " +
    "No se elimina el servicio: sigue pudiendo iniciarse manualmente si algo lo necesita.",
  category: "Servicios",
  risk: "MEDIUM",
  impact: "MEDIUM",
  requiresAdmin: true,

  async check(): Promise<boolean | null> {
    if (os.platform() !== "win32") return null;
    const current = await readStartType();
    if (current === null) return null;
    return current.toUpperCase() === "DEMAND_START";
  },

  async apply(): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    const previous = await readStartType();
    if (previous === null) {
      return {
        success: false,
        message: 'El servicio "SysMain" no existe en este sistema.',
        error: "SERVICE_NOT_FOUND"
      };
    }

    getRestorePointsStore().add({
      tweakId: `optimizer:${TWEAK_ID}`,
      tweakName: TWEAK_NAME,
      description: 'Se cambió el inicio de "SysMain" de Automático a Manual.',
      previousValue: previous
    });

    const ok = await setStartType("demand", true);
    if (!ok) {
      logOperation(TWEAK_NAME, "FAILURE", "No se pudo reconfigurar el servicio (¿se denegaron permisos de administrador?).");
      return {
        success: false,
        message: 'No se pudo cambiar "SysMain" a Manual: se requieren permisos de administrador.',
        error: "ELEVATION_FAILED_OR_CANCELLED"
      };
    }

    logOperation(TWEAK_NAME, "SUCCESS");
    return { success: true, message: '"SysMain" configurado en inicio Manual.' };
  },

  async revertFromValue(previousValue: unknown): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    const flag = typeof previousValue === "string" ? scStartFlag(previousValue) : null;
    if (!flag) {
      return { success: false, message: "No se pudo determinar el estado anterior del servicio.", error: "INVALID_RESTORE_POINT" };
    }

    const ok = await setStartType(flag, true);
    if (!ok) {
      logOperation(`Restaurar: ${TWEAK_NAME}`, "FAILURE", "No se pudo revertir la configuración del servicio.");
      return { success: false, message: 'No se pudo restaurar "SysMain".', error: "ELEVATION_FAILED_OR_CANCELLED" };
    }

    logOperation(`Restaurado: ${TWEAK_NAME}`, "SUCCESS");
    return { success: true, message: '"SysMain" restaurado a su configuración anterior.' };
  }
};
