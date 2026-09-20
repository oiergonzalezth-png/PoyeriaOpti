import { app, Notification } from "electron";
import { IpcChannels } from "@shared/constants/ipcChannels";
import type { AppSettings, OperationResult } from "@shared/types/system";
import { getSettingsStore } from "../settings/settingsStoreInstance";
import { setStartWithWindows } from "../settings/startWithWindows";
import { sanitizeSettingsPatch } from "../security/validation";
import { secureHandle } from "./secureHandle";

export function registerSettingsHandlers(): void {
  secureHandle(IpcChannels.settings.getSettings, async () => {
    return getSettingsStore().read();
  });

  secureHandle(IpcChannels.settings.updateSettings, async (_event, rawPartial): Promise<AppSettings> => {
    const store = getSettingsStore();
    const previous = store.read();
    // Solo pasan las claves conocidas y con el tipo correcto.
    const partial = sanitizeSettingsPatch(rawPartial);

    // Si cambia `startWithWindows`, se aplica de verdad en el registro antes
    // de persistir la preferencia — nunca se guarda un ajuste que no se
    // haya podido aplicar realmente.
    if (typeof partial.startWithWindows === "boolean" && partial.startWithWindows !== previous.startWithWindows) {
      const result = await setStartWithWindows(partial.startWithWindows, app.getPath("exe"));
      if (!result.success) {
        // No se aplica el cambio si falló; se devuelve el estado actual sin modificar.
        return previous;
      }
    }

    return store.update(partial);
  });

  secureHandle(IpcChannels.settings.showTestNotification, async (): Promise<OperationResult> => {
    const settings = getSettingsStore().read();
    if (!settings.notificationsEnabled) {
      return { success: false, message: "Las notificaciones están desactivadas en Ajustes.", error: "NOTIFICATIONS_DISABLED" };
    }
    if (!Notification.isSupported()) {
      return { success: false, message: "Este sistema no soporta notificaciones nativas.", error: "NOT_SUPPORTED" };
    }

    new Notification({
      title: "PoyeriaOpti",
      body: "Esta es una notificación de prueba. Las notificaciones funcionan correctamente."
    }).show();

    return { success: true, message: "Notificación de prueba enviada." };
  });
}
