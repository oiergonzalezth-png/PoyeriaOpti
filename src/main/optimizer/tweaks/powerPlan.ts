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
const TWEAK_ID = "set-power-plan-high-performance";
const TWEAK_NAME = "Switch to the High Performance power plan";

// GUID estándar de Windows para el plan "Alto rendimiento". Es un GUID fijo
// documentado por Microsoft, no algo que dependa del sistema.
const HIGH_PERFORMANCE_GUID = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c";

async function readActivePlanGuid(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("powercfg"), ["/getactivescheme"], { windowsHide: true });
    const match = stdout.match(/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function setActivePlan(guid: string): Promise<boolean> {
  // Cambiar el plan de energía activo del usuario actual no requiere
  // elevación en Windows (a diferencia de modificar los propios planes).
  const { exitCode } = await runElevatedCommand("powercfg", ["/setactive", guid], false);
  return exitCode === 0;
}

export const setPowerPlanHighPerformanceTweak: Tweak = {
  id: TWEAK_ID,
  name: TWEAK_NAME,
  description:
    'Cambia el plan de energía activo a "Alto rendimiento". En equipos de bajos recursos puede reducir ' +
    "el throttling de CPU en tareas sostenidas, a costa de más consumo energético y calor — no es una " +
    "ganancia gratuita, es un cambio de equilibrio entre rendimiento y consumo/temperatura. " +
    "No se modifica ni elimina ningún plan existente, solo cuál está activo.",
  category: "Energía",
  risk: "MEDIUM",
  impact: "MEDIUM",
  requiresAdmin: false,

  async check(): Promise<boolean | null> {
    if (os.platform() !== "win32") return null;
    const current = await readActivePlanGuid();
    if (current === null) return null;
    return current.toLowerCase() === HIGH_PERFORMANCE_GUID.toLowerCase();
  },

  async apply(): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    const previousGuid = await readActivePlanGuid();
    getRestorePointsStore().add({
      tweakId: `optimizer:${TWEAK_ID}`,
      tweakName: TWEAK_NAME,
      description: "Se cambió el plan de energía activo a Alto rendimiento.",
      previousValue: previousGuid
    });

    const ok = await setActivePlan(HIGH_PERFORMANCE_GUID);
    if (!ok) {
      logOperation(TWEAK_NAME, "FAILURE", 'No se pudo activar el plan "Alto rendimiento".');
      return {
        success: false,
        message: 'No se pudo cambiar al plan "Alto rendimiento" (¿existe ese plan en este equipo?).',
        error: "POWERCFG_COMMAND_FAILED"
      };
    }

    logOperation(TWEAK_NAME, "SUCCESS");
    return { success: true, message: 'Plan de energía cambiado a "Alto rendimiento".' };
  },

  async revertFromValue(previousValue: unknown): Promise<OperationResult> {
    if (os.platform() !== "win32") {
      return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
    }

    if (typeof previousValue !== "string" || previousValue.length === 0) {
      return { success: false, message: "No se pudo determinar el plan de energía anterior.", error: "INVALID_RESTORE_POINT" };
    }

    const ok = await setActivePlan(previousValue);
    if (!ok) {
      logOperation(`Restaurar: ${TWEAK_NAME}`, "FAILURE", "No se pudo restaurar el plan de energía anterior.");
      return { success: false, message: "No se pudo restaurar el plan de energía anterior.", error: "POWERCFG_COMMAND_FAILED" };
    }

    logOperation(`Restaurado: ${TWEAK_NAME}`, "SUCCESS");
    return { success: true, message: "Plan de energía restaurado al anterior." };
  }
};
