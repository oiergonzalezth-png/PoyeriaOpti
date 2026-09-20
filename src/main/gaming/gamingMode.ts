import os from "os";
import type { GamingModeStatus, OperationResult } from "@shared/types/system";
import { getProcessList } from "../system/processes";
import { selectProcessesToDeprioritize, findGameProcess, executableBaseName } from "./processSelection";
import { getProcessPriorities, setProcessPriorities } from "./priorityExecutor";
import { toPsPriority, type PsPriority } from "./priorityCommands";
import { getGameProfilesStore, getGamingSessionStateStore } from "./gamingStoreInstances";
import { applyTweakById, restoreTweakById } from "../optimizer/tweakRegistry";
import { logOperation } from "../services/logger";

const BACKGROUND_PRIORITY: PsPriority = "BelowNormal";

export async function getGamingModeStatus(): Promise<GamingModeStatus> {
  const state = getGamingSessionStateStore().read();
  return {
    active: state.active,
    profileId: state.profileId,
    profileName: state.profileName,
    activatedAt: state.activatedAt
  };
}

export async function activateGamingMode(profileId: string | null): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return { success: false, message: "Gaming Mode solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  const sessionStore = getGamingSessionStateStore();
  const currentState = sessionStore.read();
  if (currentState.active) {
    return { success: false, message: "Gaming Mode ya está activo. Desactívalo antes de activarlo con otro perfil.", error: "ALREADY_ACTIVE" };
  }

  const profile = profileId ? getGameProfilesStore().getById(profileId) : null;
  if (profileId && !profile) {
    return { success: false, message: "No se encontró ese perfil de juego.", error: "PROFILE_NOT_FOUND" };
  }

  const processes = await getProcessList();
  const gameProcessName = profile ? executableBaseName(profile.executablePath) : null;
  const gameProc = findGameProcess(processes, gameProcessName);
  const candidates = selectProcessesToDeprioritize(processes, {
    gameProcessName,
    allowedProcesses: profile?.allowedProcesses ?? []
  });

  const pidsToRead = [...candidates.map((c) => c.pid), ...(gameProc ? [gameProc.pid] : [])];
  const currentPriorities = await getProcessPriorities(pidsToRead);

  const setEntries: { pid: number; priority: PsPriority }[] = candidates
    .filter((c) => currentPriorities.has(c.pid))
    .map((c) => ({ pid: c.pid, priority: BACKGROUND_PRIORITY }));

  if (gameProc && currentPriorities.has(gameProc.pid)) {
    setEntries.push({ pid: gameProc.pid, priority: toPsPriority(profile?.priority ?? "HIGH") });
  }

  const setResults = await setProcessPriorities(setEntries);

  const touchedProcesses = candidates
    .filter((c) => setResults.get(c.pid) === true)
    .map((c) => ({ pid: c.pid, previousPriority: currentPriorities.get(c.pid) as string }));

  const gameProcessTouched =
    gameProc && setResults.get(gameProc.pid) === true
      ? { pid: gameProc.pid, previousPriority: currentPriorities.get(gameProc.pid) as string }
      : null;

  // Aplicar los tweaks del Optimizer seleccionados en el perfil (si alguno falla, se registra y se continúa).
  const appliedTweakIds: string[] = [];
  for (const tweakId of profile?.selectedTweakIds ?? []) {
    const result = await applyTweakById(tweakId);
    if (result.success) {
      appliedTweakIds.push(tweakId);
    } else {
      logOperation(`Gaming Mode: no se pudo aplicar el tweak "${tweakId}"`, "FAILURE", result.error ?? null);
    }
  }

  sessionStore.write({
    active: true,
    profileId: profile?.id ?? null,
    profileName: profile?.name ?? null,
    activatedAt: new Date().toISOString(),
    touchedProcesses,
    gameProcess: gameProcessTouched,
    appliedTweakIds
  });

  logOperation(
    `Gaming Mode activado${profile ? ` (perfil "${profile.name}")` : ""}: ${touchedProcesses.length} procesos en segundo plano priorizados a la baja, ${appliedTweakIds.length} tweaks aplicados.`,
    "SUCCESS"
  );

  return {
    success: true,
    message: `Gaming Mode activado. ${touchedProcesses.length} procesos en segundo plano reducidos de prioridad${
      gameProcessTouched ? ", prioridad del juego aumentada" : ""
    }.`
  };
}

export async function deactivateGamingMode(): Promise<OperationResult> {
  if (os.platform() !== "win32") {
    return { success: false, message: "Gaming Mode solo está disponible en Windows.", error: "UNSUPPORTED_PLATFORM" };
  }

  const sessionStore = getGamingSessionStateStore();
  const state = sessionStore.read();
  if (!state.active) {
    return { success: false, message: "Gaming Mode no está activo.", error: "NOT_ACTIVE" };
  }

  const restoreEntries: { pid: number; priority: PsPriority }[] = [];
  for (const entry of state.touchedProcesses) {
    if (isPsPriorityLike(entry.previousPriority)) {
      restoreEntries.push({ pid: entry.pid, priority: entry.previousPriority as PsPriority });
    }
  }
  if (state.gameProcess && isPsPriorityLike(state.gameProcess.previousPriority)) {
    restoreEntries.push({ pid: state.gameProcess.pid, priority: state.gameProcess.previousPriority as PsPriority });
  }

  // Los procesos que ya no existan simplemente no se podrán restaurar (ver
  // limitación documentada: la prioridad de un proceso no sobrevive a que
  // el propio proceso termine). No es un fallo de la operación.
  await setProcessPriorities(restoreEntries);

  for (const tweakId of state.appliedTweakIds) {
    const result = await restoreTweakById(tweakId);
    if (!result.success) {
      logOperation(`Gaming Mode: no se pudo restaurar el tweak "${tweakId}"`, "FAILURE", result.error ?? null);
    }
  }

  sessionStore.reset();
  logOperation("Gaming Mode desactivado, cambios revertidos.", "SUCCESS");

  return { success: true, message: "Gaming Mode desactivado. Se restauraron las prioridades y optimizaciones anteriores." };
}

function isPsPriorityLike(value: string): boolean {
  return value === "High" || value === "Normal" || value === "BelowNormal" || value === "AboveNormal" || value === "Idle" || value === "RealTime";
}
