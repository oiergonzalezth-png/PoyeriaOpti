import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import type { OperationResult } from "@shared/types/system";
import { logOperation } from "../services/logger";
import { resolveSystemBinary } from "../system/systemBinaries";

const execFileAsync = promisify(execFile);

const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const VALUE_NAME = "PoyeriaOpti";

export async function isStartWithWindowsEnabled(): Promise<boolean> {
  if (os.platform() !== "win32") return false;
  try {
    await execFileAsync(resolveSystemBinary("reg"), ["query", RUN_KEY, "/v", VALUE_NAME], { windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * `exePath` es la ruta real del ejecutable de la app (`app.getPath('exe')`),
 * pasada desde el llamador para no acoplar este módulo a Electron
 * directamente (más fácil de testear).
 */
export async function setStartWithWindows(enabled: boolean, exePath: string): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return { success: false, message: "Esta opción solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  try {
    if (enabled) {
      const command = `"${exePath}"`;
      await execFileAsync(resolveSystemBinary("reg"), ["add", RUN_KEY, "/v", VALUE_NAME, "/t", "REG_SZ", "/d", command, "/f"], { windowsHide: true });
      logOperation("Activado inicio automático con Windows", "SUCCESS");
      return { success: true, message: "La app se iniciará automáticamente con Windows." };
    } else {
      await execFileAsync(resolveSystemBinary("reg"), ["delete", RUN_KEY, "/v", VALUE_NAME, "/f"], { windowsHide: true });
      logOperation("Desactivado inicio automático con Windows", "SUCCESS");
      return { success: true, message: "La app ya no se iniciará automáticamente con Windows." };
    }
  } catch (err: any) {
    // Si se intenta desactivar y la entrada ya no existía, `reg delete` falla con
    // "no encontrado" — no es un error real desde el punto de vista del usuario.
    if (!enabled) {
      return { success: true, message: "La app ya no se iniciará automáticamente con Windows." };
    }
    const errorMsg = err?.message ?? String(err);
    logOperation("Fallo al cambiar el inicio automático con Windows", "FAILURE", errorMsg);
    return { success: false, message: "No se pudo cambiar el inicio automático con Windows.", error: "REG_COMMAND_FAILED" };
  }
}
