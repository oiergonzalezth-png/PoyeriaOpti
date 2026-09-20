import os from "os";
import type { OperationResult, TweakDefinition } from "@shared/types/system";
import type { Tweak } from "./types";
import {
  disableTransparencyTweak,
  disableTaskbarAnimationsTweak,
  disableMenuAnimationsTweak,
  disableGameDvrTweak
} from "./tweaks/visualAndOverheadTweaks";
import { setSysmainManualTweak } from "./tweaks/sysmainService";
import { setPowerPlanHighPerformanceTweak } from "./tweaks/powerPlan";
import {
  disableNetworkThrottlingTweak,
  reduceSystemResponsivenessTweak,
  disableDeliveryOptimizationP2PTweak,
  disableNagleAlgorithmTweak,
  disableQosReservedBandwidthTweak,
  disableWsdTweak,
  disableLsoTweak,
  increaseUdpBufferSizeTweak,
  disableWcnTweak
} from "./tweaks/networkTweaks";
import {
  disableStartMenuAdsTweak,
  disableBingSearchInStartTweak,
  disableBackgroundAppsTweak,
  disableWidgetsTweak,
  raiseGpuPriorityTweak,
  disablePrefetchTweak,
  raiseWin32PriorityTweak,
  disableFullscreenOptimizationsTweak,
  enableHagsTweak,
  disableGameBarTweak,
  disablePageFileTweak
} from "./tweaks/generalTweaks";
import { getRestorePointsStore } from "../services/restorePointsStoreInstance";
import { registerRestoreHandler } from "../services/restoreDispatcher";

/**
 * Registro de tweaks disponibles. Regla #30: empezar con pocos de bajo
 * riesgo — pero sin límite artificial de cuántos puede haber; añadir uno
 * nuevo es solo añadirlo a este array, no hace falta tocar el dispatcher,
 * la UI del Restore Center, ni el IPC.
 */
const TWEAKS: Tweak[] = [
  disableTransparencyTweak,
  disableTaskbarAnimationsTweak,
  disableMenuAnimationsTweak,
  disableGameDvrTweak,
  setSysmainManualTweak,
  setPowerPlanHighPerformanceTweak,
  disableNetworkThrottlingTweak,
  reduceSystemResponsivenessTweak,
  disableDeliveryOptimizationP2PTweak,
  disableNagleAlgorithmTweak,
  // Additional network gaming tweaks
  disableQosReservedBandwidthTweak,
  disableWsdTweak,
  disableLsoTweak,
  increaseUdpBufferSizeTweak,
  disableWcnTweak,
  disableStartMenuAdsTweak,
  disableBingSearchInStartTweak,
  disableBackgroundAppsTweak,
  disableWidgetsTweak,
  // Gaming performance tweaks
  raiseGpuPriorityTweak,
  disablePrefetchTweak,
  raiseWin32PriorityTweak,
  disableFullscreenOptimizationsTweak,
  enableHagsTweak,
  disableGameBarTweak,
  disablePageFileTweak
];

const TWEAKS_BY_ID = new Map(TWEAKS.map((t) => [t.id, t]));

// Se registra UNA vez el dominio "optimizer" completo en el dispatcher del
// Restore Center: cualquier punto con tweakId "optimizer:<id>" se revierte
// buscando el tweak correspondiente y llamando a su `revertFromValue`.
registerRestoreHandler("optimizer", async (point) => {
  const tweakId = point.tweakId.replace(/^optimizer:/, "");
  const tweak = TWEAKS_BY_ID.get(tweakId);
  if (!tweak) {
    return { success: false, message: `No se reconoce el tweak "${tweakId}".`, error: "UNKNOWN_TWEAK" };
  }

  const result = await tweak.revertFromValue(point.previousValue);
  if (result.success) {
    getRestorePointsStore().markRestored(point.id);
  }
  return result;
});

export async function listTweakDefinitions(): Promise<TweakDefinition[]> {
  const definitions: TweakDefinition[] = [];

  for (const tweak of TWEAKS) {
    const applied = await tweak.check();
    definitions.push({
      id: tweak.id,
      name: tweak.name,
      description: tweak.description,
      category: tweak.category,
      risk: tweak.risk,
      impact: tweak.impact,
      status: applied == null ? "UNKNOWN" : applied ? "APPLIED" : "NOT_APPLIED",
      requiresAdmin: tweak.requiresAdmin
    });
  }

  return definitions;
}

export async function applyTweakById(id: string): Promise<OperationResult> {
  const tweak = TWEAKS_BY_ID.get(id);
  if (!tweak) {
    return { success: false, message: `No se reconoce el tweak "${id}".`, error: "UNKNOWN_TWEAK" };
  }
  return tweak.apply();
}

/**
 * Revierte el ÚLTIMO cambio sin restaurar de un tweak concreto. Para
 * restaurar un punto de restauración específico (p. ej. desde el Restore
 * Center general, que puede mostrar varios cambios históricos del mismo
 * tweak), se usa `window.backup.restore(restorePointId)` en su lugar.
 */
export async function restoreTweakById(id: string): Promise<OperationResult> {
  const tweak = TWEAKS_BY_ID.get(id);
  if (!tweak) {
    return { success: false, message: `No se reconoce el tweak "${id}".`, error: "UNKNOWN_TWEAK" };
  }

  if (os.platform() !== "win32") {
    return { success: false, message: "Esta operación solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  const point = getRestorePointsStore().getLatestUnrestored(`optimizer:${id}`);
  if (!point) {
    return { success: false, message: `No hay ningún cambio pendiente de restaurar para "${tweak.name}".`, error: "NO_RESTORE_POINT" };
  }

  const result = await tweak.revertFromValue(point.previousValue);
  if (result.success) {
    getRestorePointsStore().markRestored(point.id);
  }
  return result;
}
