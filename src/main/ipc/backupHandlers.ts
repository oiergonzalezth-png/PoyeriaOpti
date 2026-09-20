import { IpcChannels } from "@shared/constants/ipcChannels";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { restoreAnyPoint } from "../services/restoreDispatcher";
import { isBoundedString } from "../security/validation";
import { secureHandle } from "./secureHandle";

export function registerBackupHandlers(): void {
  secureHandle(IpcChannels.backup.listAllRestorePoints, async () => {
    return getRestorePointsStore().list();
  });

  secureHandle(IpcChannels.backup.restore, async (_event, restorePointId) => {
    if (!isBoundedString(restorePointId, 100)) {
      return { success: false, message: "Identificador de punto de restauración no válido.", error: "INVALID_ARGUMENT" };
    }
    return restoreAnyPoint(restorePointId);
  });
}
