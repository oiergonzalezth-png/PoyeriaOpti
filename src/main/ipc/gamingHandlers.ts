import { IpcChannels } from "@shared/constants/ipcChannels";
import type { OperationResult, DetectedGameInfo } from "@shared/types/system";
import { getGameProfilesStore } from "../gaming/gamingStoreInstances";
import { activateGamingMode, deactivateGamingMode, getGamingModeStatus } from "../gaming/gamingMode";
import { listTweakDefinitions } from "../optimizer/tweakRegistry";
import { isBoundedString, sanitizeCreateGameProfileInput } from "../security/validation";
import { secureHandle } from "./secureHandle";
import { detectInstalledGames } from "../gaming/gameDetection";

const INVALID_ARGUMENT: OperationResult = {
  success: false,
  message: "Los datos enviados no son válidos.",
  error: "INVALID_ARGUMENT"
};

export function registerGamingHandlers(): void {
  secureHandle(IpcChannels.gaming.listProfiles, async () => {
    return getGameProfilesStore().list();
  });

  secureHandle(IpcChannels.gaming.createProfile, async (_event, input) => {
    const clean = sanitizeCreateGameProfileInput(input);
    if (!clean) {
      throw new Error("Los datos del perfil de juego no son válidos.");
    }

    // Solo se aceptan ids de tweaks que existan de verdad en el Optimizer.
    const knownTweakIds = new Set((await listTweakDefinitions()).map((t) => t.id));
    clean.selectedTweakIds = clean.selectedTweakIds.filter((id) => knownTweakIds.has(id));

    return getGameProfilesStore().create(clean);
  });

  secureHandle(IpcChannels.gaming.deleteProfile, async (_event, id): Promise<OperationResult> => {
    if (!isBoundedString(id, 100)) return INVALID_ARGUMENT;
    const deleted = getGameProfilesStore().delete(id);
    return deleted
      ? { success: true, message: "Perfil eliminado." }
      : { success: false, message: "No se encontró ese perfil.", error: "NOT_FOUND" };
  });

  secureHandle(IpcChannels.gaming.getStatus, async () => {
    return getGamingModeStatus();
  });

  secureHandle(IpcChannels.gaming.activate, async (_event, profileId) => {
    if (profileId !== null && !isBoundedString(profileId, 100)) return INVALID_ARGUMENT;
    return activateGamingMode(profileId as string | null);
  });

  secureHandle(IpcChannels.gaming.deactivate, async () => {
    return deactivateGamingMode();
  });

  secureHandle(IpcChannels.gaming.detectGames, async (): Promise<DetectedGameInfo[]> => {
    const detected = await detectInstalledGames();
    return detected.map(({ game, running, installPath }) => ({
      id: game.id,
      name: game.name,
      mainExe: game.mainExe,
      description: game.description,
      brandColor: game.brandColor,
      logoSvg: game.logoSvg,
      recommendedTweakIds: game.recommendedTweakIds,
      protectedProcesses: game.protectedProcesses,
      running,
      installPath
    }));
  });
}
