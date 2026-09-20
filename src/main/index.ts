import { app, BrowserWindow } from "electron";
import path from "path";
import { pathToFileURL } from "url";
import { registerSystemHandlers } from "./ipc/systemHandlers";
import { registerOptimizerHandlers } from "./ipc/optimizerHandlers";
import { registerAppHandlers } from "./ipc/appHandlers";
import { registerBackupHandlers } from "./ipc/backupHandlers";
import { registerGamingHandlers } from "./ipc/gamingHandlers";
import { registerNetworkHandlers } from "./ipc/networkHandlers";
import { registerBenchmarkHandlers } from "./ipc/benchmarkHandlers";
import { registerSettingsHandlers } from "./ipc/settingsHandlers";
import { registerCacheHandlers } from "./ipc/cacheHandlers";
import { registerUpdateHandlers } from "./ipc/updateHandlers";
import { getSettingsStore } from "./settings/settingsStoreInstance";
import { createTray, destroyTray } from "./settings/tray";
import { setupAutoUpdater } from "./updates/autoUpdater";
import { setTrustedRendererUrl } from "./security/trustedOrigin";
import { hardenSession, hardenWebContents } from "./security/windowSecurity";
import { createSplashScreen, closeSplashScreen } from "./splash/splashScreen";

const isDev = !app.isPackaged;
const DEV_SERVER_URL = "http://localhost:5173/";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// Cada webContents que cree la app (ahora o en el futuro) queda endurecido.
app.on("web-contents-created", (_event, contents) => {
  hardenWebContents(contents);
});

function createMainWindow(): void {
  const rendererIndex = path.join(__dirname, "../../dist-renderer/index.html");
  setTrustedRendererUrl(isDev ? DEV_SERVER_URL : pathToFileURL(rendererIndex).toString());

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: "#0e1417",
    show: false,
    frame: false,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    webPreferences: {
      // Arquitectura segura: sin nodeIntegration, con contextIsolation,
      // y todo el acceso al sistema pasando por el preload + IPC.
      // El preload se empaqueta en UN solo fichero (ver `build:preload`),
      // porque un preload con sandbox no puede hacer `require` de otros
      // módulos propios.
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      // Las DevTools solo existen en desarrollo.
      devTools: isDev
    }
  });

  mainWindow.once("ready-to-show", () => {
    closeSplashScreen();
    mainWindow?.show();
  });

  // Minimizar/cerrar a la bandeja, solo si el usuario lo activó en Ajustes.
  // Se comprueba el ajuste en el momento del evento (no al crear la ventana)
  // para reflejar cambios hechos en caliente desde Settings.
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    const settings = getSettingsStore().read();
    if (settings.minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
      if (mainWindow) createTray(mainWindow);
    }
  });

  if (isDev) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadFile(rendererIndex);
  }
}

function registerIpc(): void {
  registerSystemHandlers();
  registerOptimizerHandlers();
  registerAppHandlers();
  registerBackupHandlers();
  registerGamingHandlers();
  registerNetworkHandlers();
  registerCacheHandlers();
  registerBenchmarkHandlers();
  registerSettingsHandlers();
  registerUpdateHandlers();
}

// Una sola instancia: dos instancias escribirían a la vez los mismos ficheros
// JSON de ajustes, logs y puntos de restauración.
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    hardenSession();
    registerIpc();
    createSplashScreen();
    createMainWindow();
    setupAutoUpdater();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

app.on("before-quit", () => {
  isQuitting = true;
  destroyTray();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
