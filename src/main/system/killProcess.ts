import { getProcessList, isCriticalProcess } from "./processes";
import { logOperation } from "../services/logger";
import type { OperationResult } from "@shared/types/system";

/**
 * Finaliza un proceso por PID, SOLO si no está en la whitelist de procesos
 * críticos (ver reglas #11: "si no estás seguro, no ofrecer la opción").
 */
export async function killProcessSafely(pid: number): Promise<OperationResult> {
  if (pid === process.pid) {
    return { success: false, message: "La aplicación no puede finalizarse a sí misma desde aquí.", error: "SELF_PROCESS" };
  }

  const list = await getProcessList();
  const target = list.find((p) => p.pid === pid);

  if (!target) {
    return { success: false, message: "El proceso ya no existe.", error: "NOT_FOUND" };
  }

  if (isCriticalProcess(target.name)) {
    const message = `"${target.name}" es un proceso crítico del sistema y no puede finalizarse desde la aplicación.`;
    logOperation(`Intento bloqueado de finalizar proceso crítico ${target.name} (PID ${pid})`, "FAILURE", "CRITICAL_PROCESS");
    return { success: false, message, error: "CRITICAL_PROCESS" };
  }

  try {
    process.kill(pid);
    logOperation(`Finalizado proceso ${target.name} (PID ${pid})`, "SUCCESS");
    return { success: true, message: `Proceso "${target.name}" finalizado correctamente.` };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logOperation(`Fallo al finalizar proceso ${target.name} (PID ${pid})`, "FAILURE", errorMsg);
    return { success: false, message: "No se pudo finalizar el proceso.", error: errorMsg };
  }
}
