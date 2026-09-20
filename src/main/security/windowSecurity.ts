import { session, shell, type WebContents } from "electron";
import { isSafeExternalUrl, isTrustedRendererUrl } from "./trustedOrigin";

/**
 * Endurece TODOS los webContents que cree la app (ventana principal y
 * cualquier otro que pudiera aparecer): sin ventanas nuevas, sin navegación
 * fuera de la UI, sin <webview>, y solo enlaces https hacia el navegador.
 */
export function hardenWebContents(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    // Solo https se delega al navegador del sistema (nunca file:, smb:,
    // ms-msdt: u otros esquemas que ejecutarían algo en el equipo).
    if (isSafeExternalUrl(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });

  contents.on("will-navigate", (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
    }
  });

  contents.on("will-redirect", (event, url) => {
    if (!isTrustedRendererUrl(url)) {
      event.preventDefault();
    }
  });

  contents.on("will-attach-webview", (event) => {
    event.preventDefault();
  });
}

/** La app no necesita cámara, micrófono, geolocalización, etc.: se deniega todo permiso. */
export function hardenSession(): void {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  ses.setPermissionCheckHandler(() => false);
}
