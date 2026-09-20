import { ipcMain, BrowserWindow } from "electron";
import { IpcChannels } from "@shared/constants/ipcChannels";
import { secureHandle } from "./secureHandle";
import {
  getUpdateState,
  checkForUpdates,
  downloadAndInstallUpdate,
  onUpdateState
} from "../updates/autoUpdater";

export function registerUpdateHandlers(): void {
  secureHandle(IpcChannels.update.getState, async () => {
    return getUpdateState();
  });

  secureHandle(IpcChannels.update.check, async () => {
    return checkForUpdates();
  });

  secureHandle(IpcChannels.update.install, async () => {
    await downloadAndInstallUpdate();
  });

  // Push de cambios de estado a todos los renderers abiertos
  onUpdateState((state) => {
    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed()) {
        win.webContents.send(IpcChannels.update.onState, state);
      }
    }
  });
}
