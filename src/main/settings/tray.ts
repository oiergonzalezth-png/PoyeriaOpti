import path from "path";
import { app, Tray, Menu, nativeImage, type BrowserWindow } from "electron";

let tray: Tray | null = null;

/**
 * Resuelve la ruta al icono de la app en cualquier entorno:
 *  - Dev / tests : raíz del proyecto → build/icon.png
 *  - Producción  : dentro del asar, Electron expone __dirname del main bundle;
 *                  el icono se empaqueta en resources/app.asar/build/icon.png
 *                  o, si está fuera del asar (extraResource), en resources/.
 *
 * Electron's nativeImage.createFromPath acepta rutas dentro del asar
 * directamente, así que no necesitamos extraerlo.
 */
function resolveAppIconPath(): string {
  if (app.isPackaged) {
    // En producción el main bundle está en resources/app.asar/dist-main/index.js
    // → subimos dos niveles para llegar a la raíz del asar y de ahí a build/.
    return path.join(__dirname, "../../build/icon.png");
  }
  // En desarrollo __dirname apunta a dist-main/ o src/main/ según el runner.
  // El icon siempre vive en <root>/build/icon.png.
  return path.join(__dirname, "../../../build/icon.png");
}

/**
 * Crea un nativeImage de 16×16 (y 32×32 para pantallas HiDPI) a partir
 * del icono PNG de la app. Si la carga falla por cualquier motivo cae al
 * cuadrado cian de fallback para que la bandeja nunca quede rota.
 */
function buildTrayIcon(): Electron.NativeImage {
  try {
    const iconPath = resolveAppIconPath();
    const source = nativeImage.createFromPath(iconPath);

    if (source.isEmpty()) {
      return makeFallbackIcon();
    }

    // Redimensionamos a 16×16 para la bandeja estándar.
    // addRepresentation con scaleFactor 2 añade la versión HiDPI (32×32 visual
    // → 32×32 px porque Electron pasa el size ya multiplicado).
    const icon16 = source.resize({ width: 16, height: 16, quality: "best" });
    const icon32 = source.resize({ width: 32, height: 32, quality: "best" });

    // Construimos una imagen con ambas representaciones.
    const trayImage = nativeImage.createEmpty();
    trayImage.addRepresentation({
      scaleFactor: 1.0,
      width: 16,
      height: 16,
      buffer: icon16.toBitmap(),
      dataURL: icon16.toDataURL()
    });
    trayImage.addRepresentation({
      scaleFactor: 2.0,
      width: 32,
      height: 32,
      buffer: icon32.toBitmap(),
      dataURL: icon32.toDataURL()
    });

    return trayImage;
  } catch {
    return makeFallbackIcon();
  }
}

/** Fallback: cuadrado del color de acento de la app si el PNG no carga. */
function makeFallbackIcon(): Electron.NativeImage {
  // Cian de acento (#4fd1c5)
  const TRAY_COLOR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAADUlEQVQ4jWNgGAWDGQAAAkAAAW3HxcQAAAAASUVORK5CYII=";
  return nativeImage.createFromDataURL(TRAY_COLOR);
}

export function createTray(mainWindow: BrowserWindow): Tray {
  if (tray) return tray;

  tray = new Tray(buildTrayIcon());
  tray.setToolTip("PoyeriaOpti");

  const menu = Menu.buildFromTemplate([
    {
      label: "Abrir PoyeriaOpti",
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: "separator" },
    {
      label: "Salir",
      click: () => {
        app.exit(0);
      }
    }
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  return tray;
}

export function destroyTray(): void {
  tray?.destroy();
  tray = null;
}

export function getTray(): Tray | null {
  return tray;
}
