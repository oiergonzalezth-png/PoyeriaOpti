import { app, BrowserWindow } from "electron";
import { IpcChannels } from "@shared/constants/ipcChannels";
import { secureHandle } from "./secureHandle";

export function registerAppHandlers(): void {
  secureHandle(IpcChannels.app.getVersion, async () => {
    return app.getVersion();
  });

  secureHandle(IpcChannels.app.getPlatform, async () => {
    return process.platform;
  });

  // Window controls
  secureHandle(IpcChannels.window.minimize, async () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.minimize();
  });

  secureHandle(IpcChannels.window.maximize, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return false;
    if (win.isMaximized()) {
      win.unmaximize();
      return false;
    } else {
      win.maximize();
      return true;
    }
  });

  secureHandle(IpcChannels.window.close, async () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.close();
  });

  secureHandle(IpcChannels.window.isMaximized, async () => {
    const win = BrowserWindow.getFocusedWindow();
    return win?.isMaximized() ?? false;
  });
}
