import { app } from "electron";
import { autoUpdater } from "electron-updater";
import { logOperation } from "../services/logger";

export interface UpdateInfo {
  latestVersion: string;
  currentVersion: string;
  updateAvailable: boolean;
  releaseName: string;
  releaseNotes: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "update-available"
  | "up-to-date"
  | "downloading"
  | "ready-to-install"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  info: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
}

let currentState: UpdateState = {
  status: "idle",
  info: null,
  progress: null,
  error: null
};

let configured = false;
let lastUpdateInfo: import("electron-updater").UpdateInfo | null = null;

const listeners = new Set<(state: UpdateState) => void>();

function setState(patch: Partial<UpdateState>): void {
  currentState = { ...currentState, ...patch };
  for (const fn of listeners) fn(currentState);
}

// Códigos que electron-updater lanza cuando el repo de GitHub todavía no
// tiene ninguna release publicada (o la release no trae los artefactos
// esperados). No es un fallo real de la app: simplemente no hay nada que
// ofrecer todavía, así que se trata como "al día" en vez de como error.
const NO_RELEASE_ERROR_CODES = new Set([
  "ERR_UPDATER_NO_PUBLISHED_VERSIONS",
  "ERR_UPDATER_LATEST_VERSION_NOT_FOUND",
  "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND"
]);

function isNoReleaseError(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "string" && NO_RELEASE_ERROR_CODES.has(code);
}

export function onUpdateState(fn: (state: UpdateState) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getUpdateState(): UpdateState {
  return currentState;
}

function toPublicInfo(info: import("electron-updater").UpdateInfo, updateAvailable: boolean): UpdateInfo {
  const latestVersion = info.version;
  const releaseName = info.releaseName || `v${latestVersion}`;
  const releaseNotes = Array.isArray(info.releaseNotes)
    ? info.releaseNotes
        .map((note) => {
          if (typeof note === "string") return note;
          return `${note.note || ""}`.trim();
        })
        .filter(Boolean)
        .join("\n\n")
    : String(info.releaseNotes ?? "");

  return {
    latestVersion,
    currentVersion: app.getVersion(),
    updateAvailable,
    releaseName,
    releaseNotes
  };
}

function configureUpdater(): void {
  if (configured || !app.isPackaged) return;
  configured = true;

  // Manual download/install: the Settings UI controls when an update is
  // downloaded and when it is installed. No custom helper process is used.
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;

  autoUpdater.on("checking-for-update", () => {
    setState({ status: "checking", error: null });
  });

  autoUpdater.on("update-available", (info) => {
    lastUpdateInfo = info;
    const publicInfo = toPublicInfo(info, true);
    setState({
      status: "update-available",
      info: publicInfo,
      error: null,
      progress: null
    });
    logOperation(`Actualización encontrada: v${info.version}`, "SUCCESS");
  });

  autoUpdater.on("update-not-available", (info) => {
    lastUpdateInfo = info;
    const publicInfo = toPublicInfo(info, false);
    setState({
      status: "up-to-date",
      info: publicInfo,
      error: null,
      progress: null
    });
    logOperation(`Comprobación de actualizaciones: ya está al día (v${info.version})`, "SUCCESS");
  });

  autoUpdater.on("download-progress", (progress) => {
    setState({
      status: "downloading",
      progress: {
        downloaded: progress.transferred,
        total: progress.total,
        percent: Math.round(progress.percent)
      },
      error: null
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    lastUpdateInfo = info;
    const publicInfo = toPublicInfo(info, true);
    setState({
      status: "ready-to-install",
      info: publicInfo,
      progress: { downloaded: 1, total: 1, percent: 100 },
      error: null
    });
    logOperation(`Actualización descargada y lista para instalar: v${info.version}`, "SUCCESS");
  });

  autoUpdater.on("update-cancelled", () => {
    setState({ status: "update-available", error: null, progress: null });
  });

  autoUpdater.on("error", (err) => {
    if (isNoReleaseError(err)) {
      const currentVersion = app.getVersion();
      setState({
        status: "up-to-date",
        info: {
          latestVersion: currentVersion,
          currentVersion,
          updateAvailable: false,
          releaseName: "",
          releaseNotes: ""
        },
        error: null,
        progress: null
      });
      logOperation("Comprobación de actualizaciones: todavía no hay ninguna release publicada", "SUCCESS");
      return;
    }

    const message = err instanceof Error ? err.message : String(err);
    logOperation("Actualización", "FAILURE", message);
    setState({ status: "error", error: message });
  });
}

export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!app.isPackaged) {
    const currentVersion = app.getVersion();
    const info: UpdateInfo = {
      latestVersion: currentVersion,
      currentVersion,
      updateAvailable: false,
      releaseName: `v${currentVersion}`,
      releaseNotes: ""
    };
    setState({ status: "up-to-date", info, error: null, progress: null });
    return info;
  }

  configureUpdater();

  try {
    const result = await autoUpdater.checkForUpdates();
    if (!result) {
      throw new Error("El actualizador no está disponible en esta instalación.");
    }

    const updateInfo = result.updateInfo;
    lastUpdateInfo = updateInfo;
    const updateAvailable = updateInfo.version !== app.getVersion();
    const info = toPublicInfo(updateInfo, updateAvailable);

    // Event callbacks normally set the state first; keep this return value in
    // sync even if the provider does not emit a particular event in an edge case.
    setState({
      status: updateAvailable ? "update-available" : "up-to-date",
      info,
      error: null
    });

    return info;
  } catch (err) {
    const currentVersion = app.getVersion();
    const info: UpdateInfo = {
      latestVersion: currentVersion,
      currentVersion,
      updateAvailable: false,
      releaseName: "",
      releaseNotes: ""
    };

    if (isNoReleaseError(err)) {
      // El evento "error" ya ha dejado el estado en "up-to-date"; no lo pisamos.
      return info;
    }

    const message = err instanceof Error ? err.message : String(err);
    logOperation("Comprobación de actualizaciones", "FAILURE", message);
    setState({ status: "error", error: message, progress: null });

    return info;
  }
}

/**
 * Descarga el instalador NSIS de la release mediante electron-updater.
 * No modifica app.asar, no crea update.zip y no lanza companion.exe.
 */
export async function downloadAndInstallUpdate(): Promise<void> {
  if (!app.isPackaged) {
    throw new Error("Las actualizaciones solo están disponibles en una instalación empaquetada.");
  }

  configureUpdater();

  try {
    if (!lastUpdateInfo || !currentState.info?.updateAvailable) {
      const checked = await autoUpdater.checkForUpdates();
      if (!checked) throw new Error("No se pudo consultar la actualización disponible.");
      lastUpdateInfo = checked.updateInfo;
    }

    if (lastUpdateInfo.version === app.getVersion()) {
      setState({ status: "up-to-date", error: null });
      return;
    }

    setState({
      status: "downloading",
      progress: { downloaded: 0, total: 0, percent: 0 },
      error: null
    });

    await autoUpdater.downloadUpdate();

    // `update-downloaded` should normally have fired before downloadUpdate()
    // resolves. Keep the state correct even if the provider resolves without
    // delivering the event synchronously.
    if (currentState.status !== "ready-to-install") {
      const info = toPublicInfo(lastUpdateInfo, true);
      setState({
        status: "ready-to-install",
        info,
        progress: { downloaded: 1, total: 1, percent: 100 },
        error: null
      });
    }

    // electron-updater's NSIS updater launches the standard installer after
    // the app exits. There is no custom companion/batch helper in the app.
    autoUpdater.quitAndInstall(true, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logOperation("Instalación de actualización", "FAILURE", message);
    setState({ status: "error", error: message });
    throw err;
  }
}

/** Llamada única al arrancar: comprueba en segundo plano y vuelve a comprobar cada 2 h. */
export function setupAutoUpdater(): void {
  if (!app.isPackaged) return;
  configureUpdater();

  const check = () => {
    void checkForUpdates();
  };

  setTimeout(check, 10_000);
  setInterval(check, 2 * 60 * 60 * 1000);
}
