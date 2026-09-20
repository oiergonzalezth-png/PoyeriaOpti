import { IpcChannels } from "@shared/constants/ipcChannels";
import type { OperationResult } from "@shared/types/system";
import { getHardwareSnapshot } from "../system/hardwareInfo";
import { getProcessList } from "../system/processes";
import { killProcessSafely } from "../system/killProcess";
import { getStartupItems, setStartupItemEnabled, restoreStartupItemFromPoint } from "../system/startup";
import { getOperationLogs } from "../services/logger";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { isBoundedString, isValidPid } from "../security/validation";
import { secureHandle } from "./secureHandle";

const INVALID_ARGUMENT: OperationResult = {
  success: false,
  message: "Los datos enviados no son válidos.",
  error: "INVALID_ARGUMENT"
};

export function registerSystemHandlers(): void {
  secureHandle(IpcChannels.system.getHardwareSnapshot, async () => {
    return getHardwareSnapshot();
  });

  secureHandle(IpcChannels.system.getProcesses, async () => {
    return getProcessList();
  });

  secureHandle(IpcChannels.system.killProcess, async (_event, pid) => {
    if (!isValidPid(pid)) return INVALID_ARGUMENT;
    return killProcessSafely(pid);
  });

  secureHandle(IpcChannels.system.getStartupItems, async () => {
    return getStartupItems();
  });

  secureHandle(IpcChannels.system.setStartupItemEnabled, async (_event, id, enabled) => {
    if (!isBoundedString(id, 400) || typeof enabled !== "boolean") return INVALID_ARGUMENT;
    return setStartupItemEnabled(id, enabled);
  });

  secureHandle(IpcChannels.system.getStartupRestorePoints, async () => {
    return getRestorePointsStore()
      .list()
      .filter((p) => p.tweakId.startsWith("startup:"));
  });

  secureHandle(IpcChannels.system.restoreStartupItem, async (_event, restorePointId) => {
    if (!isBoundedString(restorePointId, 100)) return INVALID_ARGUMENT;
    return restoreStartupItemFromPoint(restorePointId);
  });

  secureHandle(IpcChannels.system.getLogs, async () => {
    return getOperationLogs();
  });
}
