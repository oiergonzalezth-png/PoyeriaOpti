import { IpcChannels } from "@shared/constants/ipcChannels";
import { scanCacheTargets, clearCacheTargetById, flushDnsCache } from "../cache/cacheScanner";
import { isKnownCacheTargetId } from "../cache/cacheTargets";
import { secureHandle } from "./secureHandle";

const INVALID_ARGUMENT = {
  success: false,
  message: "Identificador de caché no válido.",
  error: "INVALID_ARGUMENT"
};

/**
 * IPC del dominio "cache" (Optimizador → pestañas Red/Sistema/General).
 * A diferencia de `optimizer`, limpiar una caché no es reversible, así que
 * no pasa por `tweakRegistry` ni por el Restore Center: es una operación
 * de un solo sentido, igual que vaciar la papelera.
 */
export function registerCacheHandlers(): void {
  secureHandle(IpcChannels.cache.scan, async () => {
    return scanCacheTargets();
  });

  secureHandle(IpcChannels.cache.clear, async (_event, id) => {
    if (!isKnownCacheTargetId(id)) return INVALID_ARGUMENT;
    return clearCacheTargetById(id);
  });

  secureHandle(IpcChannels.cache.flushDns, async () => {
    return flushDnsCache();
  });
}
