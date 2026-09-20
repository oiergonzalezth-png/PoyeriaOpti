import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { isTrustedRendererUrl } from "../security/trustedOrigin";

/**
 * Sustituto de `ipcMain.handle` que rechaza cualquier petición cuyo frame de
 * origen no sea la propia UI de la app. Los argumentos siguen siendo
 * `unknown` a propósito: cada handler debe validarlos antes de usarlos.
 */
export function secureHandle(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    const senderUrl = event.senderFrame?.url;
    if (!isTrustedRendererUrl(senderUrl)) {
      throw new Error("Origen no autorizado para esta operación.");
    }
    return handler(event, ...args);
  });
}
