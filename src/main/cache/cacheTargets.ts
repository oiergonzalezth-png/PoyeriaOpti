import os from "os";
import path from "path";
import type { CacheScope } from "@shared/types/system";

/**
 * Catálogo de cachés "limpiables" desde el Optimizador.
 *
 * Cada target apunta a una o más carpetas conocidas. Solo se listan
 * subcarpetas de caché reales y documentadas de cada app (nunca la carpeta
 * raíz de configuración/perfil), para no poder borrar sesiones, ajustes o
 * partidas guardadas por accidente. `clear()` borra el CONTENIDO de esas
 * carpetas, nunca la carpeta en sí (así la app la puede recrear sola).
 */
export interface CacheTarget {
  id: string;
  name: string;
  description: string;
  scope: CacheScope;
  requiresAdmin: boolean;
  /** Carpetas candidatas (rutas absolutas ya resueltas para este usuario). */
  folders(): string[];
  /**
   * Para `scope: "apps"`: carpeta cuya existencia indica que la app está
   * instalada. Si es `null` (o no aplica), se considera "detectado" cuando
   * alguna de las carpetas de `folders()` existe.
   */
  detectionFolder?(): string | null;
}

function appData(): string {
  return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
}

function localAppData(): string {
  return process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
}

function programData(): string {
  return process.env.ProgramData || "C:\\ProgramData";
}

function windir(): string {
  return process.env.SystemRoot || process.env.windir || "C:\\Windows";
}

// ─── Red: cachés propias de Windows relacionadas con la conexión ───────────

const networkTargets: CacheTarget[] = [
  {
    id: "windows-inet-cache",
    name: "Windows Internet Cache",
    description:
      "Ficheros temporales de internet que guarda Windows/Edge (INetCache) para no volver a descargar recursos web ya vistos. Puede acumular varios cientos de MB con el uso normal; borrarlo no cierra sesiones ni borra contraseñas guardadas.",
    scope: "network",
    requiresAdmin: false,
    folders: () => [path.join(localAppData(), "Microsoft", "Windows", "INetCache")]
  },
  {
    id: "delivery-optimization-cache",
    name: "Delivery Optimization cache",
    description:
      "Fragmentos de actualizaciones de Windows/Store que el sistema guarda para compartirlos con otros equipos de tu red (peer-to-peer). Requiere permisos de administrador porque vive fuera de tu carpeta de usuario.",
    scope: "network",
    requiresAdmin: true,
    folders: () => [path.join(windir(), "SoftwareDistribution", "DeliveryOptimization", "Cache")]
  }
];

// ─── Sistema: cachés de launchers/apps de terceros detectados ──────────────

function electronCacheFolders(base: string): string[] {
  // Patrón estándar de las apps basadas en Electron/Chromium (Discord, EA
  // Desktop, Riot Client, etc.): estas tres subcarpetas SOLO guardan
  // recursos web cacheados (HTML/JS/imágenes), nunca la sesión de usuario
  // (que vive en "Local Storage"/"Session Storage", que este catálogo NO toca).
  return [path.join(base, "Cache"), path.join(base, "Code Cache"), path.join(base, "GPUCache")];
}

const appTargets: CacheTarget[] = [
  {
    id: "discord",
    name: "Discord",
    description:
      "Caché de recursos web de la app de escritorio de Discord (emojis, imágenes, JS de la interfaz). No afecta a tu sesión: no hace falta volver a iniciar sesión después de limpiarla.",
    scope: "apps",
    requiresAdmin: false,
    detectionFolder: () => path.join(appData(), "discord"),
    folders: () => electronCacheFolders(path.join(appData(), "discord"))
  },
  {
    id: "epic-games",
    name: "Epic Games Launcher",
    description:
      "Caché web del launcher de Epic Games (tienda, noticias, imágenes de la interfaz). No borra tus juegos instalados ni tu sesión iniciada.",
    scope: "apps",
    requiresAdmin: false,
    detectionFolder: () => path.join(localAppData(), "EpicGamesLauncher"),
    folders: () => [
      path.join(localAppData(), "EpicGamesLauncher", "Saved", "webcache"),
      path.join(localAppData(), "EpicGamesLauncher", "Saved", "webcache_4147")
    ]
  },
  {
    id: "riot-client",
    name: "Riot Client (League/Valorant)",
    description:
      "Caché web del Riot Client (la pantalla de inicio/tienda compartida por League of Legends y Valorant). No borra tu progreso ni tu sesión.",
    scope: "apps",
    requiresAdmin: false,
    detectionFolder: () => path.join(localAppData(), "Riot Games", "Riot Client"),
    folders: () => electronCacheFolders(path.join(localAppData(), "Riot Games", "Riot Client", "U", "Cef", "User Data"))
  },
  {
    id: "ea-app",
    name: "EA app / Origin",
    description:
      "Caché web de la app de EA (o de Origin, si todavía la tienes instalada): imágenes de la tienda y de la interfaz. No borra tus juegos ni tu sesión.",
    scope: "apps",
    requiresAdmin: false,
    detectionFolder: () => path.join(localAppData(), "Electronic Arts", "EA Desktop"),
    folders: () => [
      path.join(localAppData(), "Electronic Arts", "EA Desktop", "CacheStorage"),
      path.join(appData(), "Origin", "Cache"),
      path.join(programData(), "Origin", "Cache")
    ]
  }
];

// ─── General: limpieza estándar de Windows (temp/actualizaciones/papelera) ─

const windowsTargets: CacheTarget[] = [
  {
    id: "windows-temp-user",
    name: "Temporary files (%TEMP%)",
    description:
      "Carpeta temporal del usuario actual, donde instaladores y programas dejan ficheros que ya no necesitan tras usarlos. Es justo lo que limpia el \"Liberador de espacio en disco\" de Windows.",
    scope: "windows",
    requiresAdmin: false,
    folders: () => [process.env.TEMP || process.env.TMP || path.join(localAppData(), "Temp")]
  },
  {
    id: "windows-update-cache",
    name: "Windows Update download cache",
    description:
      "Actualizaciones ya instaladas que Windows deja descargadas por si tuviera que reinstalarlas. Requiere administrador porque vive en una carpeta del sistema; Windows la vuelve a rellenar sola cuando hay actualizaciones nuevas.",
    scope: "windows",
    requiresAdmin: true,
    folders: () => [path.join(windir(), "SoftwareDistribution", "Download")]
  },
  {
    id: "windows-prefetch",
    name: "Prefetch",
    description:
      "Datos que Windows usa para acelerar el arranque de programas que abres a menudo. Windows los regenera solo con el uso normal; borrarlos no rompe nada, pero los primeros arranques tras limpiarlo pueden tardar un pelín más.",
    scope: "windows",
    requiresAdmin: true,
    folders: () => [path.join(windir(), "Prefetch")]
  }
];

export const CACHE_TARGETS: CacheTarget[] = [...networkTargets, ...appTargets, ...windowsTargets];

export const CACHE_TARGETS_BY_ID = new Map(CACHE_TARGETS.map((t) => [t.id, t]));

export function isKnownCacheTargetId(id: unknown): id is string {
  return typeof id === "string" && CACHE_TARGETS_BY_ID.has(id);
}
