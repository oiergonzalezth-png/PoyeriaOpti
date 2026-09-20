import { IpcChannels } from "@shared/constants/ipcChannels";
import { listTweakDefinitions, applyTweakById, restoreTweakById } from "../optimizer/tweakRegistry";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { isBoundedString } from "../security/validation";
import { secureHandle } from "./secureHandle";

const INVALID_ARGUMENT = {
  success: false,
  message: "Identificador de optimización no válido.",
  error: "INVALID_ARGUMENT"
};

/**
 * Motor de tweaks real, construido sobre `tweakRegistry.ts`.
 * Ver ese fichero para el registro de tweaks disponibles y su lógica.
 */
export function registerOptimizerHandlers(): void {
  secureHandle(IpcChannels.optimizer.listTweaks, async () => {
    return listTweakDefinitions();
  });

  secureHandle(IpcChannels.optimizer.applyTweak, async (_event, id) => {
    if (!isBoundedString(id, 100)) return INVALID_ARGUMENT;
    return applyTweakById(id);
  });

  secureHandle(IpcChannels.optimizer.restoreTweak, async (_event, id) => {
    if (!isBoundedString(id, 100)) return INVALID_ARGUMENT;
    return restoreTweakById(id);
  });

  secureHandle(IpcChannels.optimizer.listRestorePoints, async () => {
    return getRestorePointsStore()
      .list()
      .filter((p) => p.tweakId.startsWith("optimizer:"));
  });
}
