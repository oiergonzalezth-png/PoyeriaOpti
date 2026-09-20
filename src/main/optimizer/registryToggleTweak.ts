import { execFile } from "child_process";
import { promisify } from "util";
import os from "os";
import type { TweakRisk, OperationResult } from "@shared/types/system";
import type { Tweak } from "./types";
import { logOperation } from "../services/logger";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { runRegCommand } from "../system/elevatedCommand";
import { resolveSystemBinary } from "../system/systemBinaries";

const execFileAsync = promisify(execFile);

export type RegValueType = "REG_DWORD" | "REG_SZ";

export interface RegistryToggleConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  risk: TweakRisk;
  impact: string;
  hive: "HKCU" | "HKLM";
  /** Ruta sin el hive delante, p. ej. "Software\\Microsoft\\...\\Advanced". */
  keyPath: string;
  valueName: string;
  valueType: RegValueType;
  /** Valor cuando el tweak está "activo" (aplicado). */
  enabledValue: string;
  /** Valor por defecto de Windows (al que se vuelve si no había valor previo). */
  disabledValue: string;
}

function fullPath(cfg: RegistryToggleConfig): string {
  return `${cfg.hive}\\${cfg.keyPath}`;
}

async function readCurrentValue(cfg: RegistryToggleConfig): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(resolveSystemBinary("reg"), ["query", fullPath(cfg), "/v", cfg.valueName], { windowsHide: true });
    const match = stdout.match(new RegExp(`${cfg.valueType}\\s+(\\S+)`));
    return match ? match[1] : null;
  } catch {
    return null; // el valor no existe todavía: Windows usa su valor por defecto
  }
}

async function writeValue(cfg: RegistryToggleConfig, value: string, elevated: boolean): Promise<boolean> {
  const args = ["add", fullPath(cfg), "/v", cfg.valueName, "/t", cfg.valueType, "/d", value, "/f"];
  const { exitCode } = await runRegCommand(args, elevated);
  return exitCode === 0;
}

export function createRegistryToggleTweak(cfg: RegistryToggleConfig): Tweak {
  const tweakId = `optimizer:${cfg.id}`;

  return {
    id: cfg.id,
    name: cfg.name,
    description: cfg.description,
    category: cfg.category,
    risk: cfg.risk,
    impact: cfg.impact,
    requiresAdmin: cfg.hive === "HKLM",

    async check(): Promise<boolean | null> {
      if (os.platform() !== "win32") return null;
      const current = await readCurrentValue(cfg);
      if (current === null) return false;
      return current.toLowerCase() === cfg.enabledValue.toLowerCase();
    },

    async apply(): Promise<OperationResult> {
      if (os.platform() !== "win32") {
        return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
      }

      const previousValue = await readCurrentValue(cfg);
      getRestorePointsStore().add({
        tweakId,
        tweakName: cfg.name,
        description: `Se aplicó "${cfg.name}".`,
        previousValue
      });

      const ok = await writeValue(cfg, cfg.enabledValue, cfg.hive === "HKLM");
      if (!ok) {
        logOperation(`Aplicar tweak: ${cfg.name}`, "FAILURE", "No se pudo escribir el valor de registro.");
        return { success: false, message: `No se pudo aplicar "${cfg.name}".`, error: "REG_COMMAND_FAILED" };
      }

      logOperation(`Aplicado tweak: ${cfg.name}`, "SUCCESS");
      return { success: true, message: `"${cfg.name}" aplicado correctamente.` };
    },

    async revertFromValue(previousValue: unknown): Promise<OperationResult> {
      if (os.platform() !== "win32") {
        return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
      }

      const value = previousValue == null ? cfg.disabledValue : String(previousValue);
      const ok = await writeValue(cfg, value, cfg.hive === "HKLM");

      if (!ok) {
        logOperation(`Restaurar tweak: ${cfg.name}`, "FAILURE", "No se pudo revertir el valor de registro.");
        return { success: false, message: `No se pudo restaurar "${cfg.name}".`, error: "REG_COMMAND_FAILED" };
      }

      logOperation(`Restaurado tweak: ${cfg.name}`, "SUCCESS");
      return { success: true, message: `"${cfg.name}" restaurado a su valor anterior.` };
    }
  };
}
