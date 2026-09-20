import fs from "fs";
import path from "path";
import os from "os";
import { getProcessList } from "../system/processes";
import { KNOWN_GAMES, type KnownGame } from "./knownGames";

export interface DetectedGame {
  game: KnownGame;
  /** true si el juego está actualmente en ejecución */
  running: boolean;
  /** Ruta de instalación detectada en disco, null si no se encontró */
  installPath: string | null;
}

/**
 * Directorios raíz donde se buscan instalaciones de juegos en Windows.
 * Se usan las variables de entorno del usuario actual cuando están disponibles.
 */
function getGameRootDirs(): string[] {
  const dirs: string[] = [];

  const drives = ["C:", "D:", "E:", "F:", "G:"];
  for (const drive of drives) {
    dirs.push(
      path.join(drive, "\\Program Files"),
      path.join(drive, "\\Program Files (x86)"),
      path.join(drive, "\\Games"),
      path.join(drive, "\\Juegos"),
      path.join(drive, "\\SteamLibrary\\steamapps\\common"),
      path.join(drive, "\\Steam\\steamapps\\common"),
      path.join(drive, "\\Epic Games"),
      path.join(drive, "\\Riot Games"),
      path.join(drive, "\\Ubisoft\\Ubisoft Game Launcher\\games"),
      path.join(drive, "\\EA Games"),
      path.join(drive, "\\Origin Games"),
      path.join(drive, "\\GOG Galaxy\\Games"),
      path.join(drive, "\\Xbox Games"),
      path.join(drive, "\\XboxGames")
    );
  }

  const home = os.homedir();
  dirs.push(
    path.join(home, "AppData\\Local\\Programs"),
    path.join(home, "AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs"),
    path.join(home, "AppData\\Local\\Steam\\steamapps\\common")
  );

  return dirs;
}

/**
 * Lee los manifiestos de Epic Games Launcher para obtener rutas de instalación
 * sin necesidad de que el launcher esté abierto.
 * Los manifiestos están en: %ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item
 */
function getEpicInstallDirs(): Map<string, string> {
  const result = new Map<string, string>(); // appName → installLocation

  const manifestDirs = [
    process.env.ProgramData
      ? path.join(process.env.ProgramData, "Epic", "EpicGamesLauncher", "Data", "Manifests")
      : "C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests"
  ];

  for (const manifestDir of manifestDirs) {
    try {
      if (!fs.existsSync(manifestDir)) continue;
      const files = fs.readdirSync(manifestDir).filter((f) => f.endsWith(".item"));
      for (const file of files) {
        try {
          const raw = fs.readFileSync(path.join(manifestDir, file), "utf8");
          const data = JSON.parse(raw) as {
            AppName?: string;
            DisplayName?: string;
            InstallLocation?: string;
          };
          if (data.InstallLocation) {
            // Index both by AppName and DisplayName (normalized)
            if (data.AppName)    result.set(data.AppName.toLowerCase(), data.InstallLocation);
            if (data.DisplayName) result.set(data.DisplayName.toLowerCase(), data.InstallLocation);
          }
        } catch {
          // Archivo inaccesible o JSON malformado → continuamos
        }
      }
    } catch {
      // Directorio inaccesible → ignoramos
    }
  }

  return result;
}

/**
 * Lee las librerías de Steam (libraryfolders.vdf) para encontrar todas las
 * carpetas donde Steam tiene juegos instalados, sin requerir Steam abierto.
 */
function getSteamLibraryDirs(): string[] {
  const dirs: string[] = [];

  const steamPaths = [
    process.env.PROGRAMFILES
      ? path.join(process.env.PROGRAMFILES, "Steam")
      : "C:\\Program Files\\Steam",
    "C:\\Program Files (x86)\\Steam",
    path.join(os.homedir(), "AppData\\Local\\Steam")
  ];

  for (const steamPath of steamPaths) {
    try {
      const vdfPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
      if (!fs.existsSync(vdfPath)) continue;
      const raw = fs.readFileSync(vdfPath, "utf8");
      // Regex para extraer rutas de las secciones "path" en el VDF
      const pathRegex = /"path"\s+"([^"]+)"/g;
      let match: RegExpExecArray | null;
      while ((match = pathRegex.exec(raw)) !== null) {
        const libraryPath = match[1].replace(/\\\\/g, "\\");
        dirs.push(path.join(libraryPath, "steamapps", "common"));
      }
    } catch {
      // Ignorar errores de lectura
    }
  }

  return dirs;
}

/**
 * Comprueba si alguna de las rutas parciales del juego existe dentro de un
 * directorio raíz dado. Retorna la ruta completa si la encuentra, o null.
 */
function findInstallPath(game: KnownGame, roots: string[]): string | null {
  for (const root of roots) {
    for (const partial of game.installPaths) {
      const candidate = path.join(root, partial);
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch {
        // fs.existsSync lanza en rutas inaccesibles; continuamos
      }
    }
  }
  return null;
}

/**
 * Busca el juego en los manifiestos de Epic por nombre de directorio
 * o por coincidencia de nombre.
 */
function findEpicInstallPath(game: KnownGame, epicDirs: Map<string, string>): string | null {
  // Buscar por nombre normalizado del juego
  const nameKey = game.name.toLowerCase();
  for (const [key, installPath] of epicDirs) {
    if (key.includes(nameKey) || nameKey.includes(key)) {
      return installPath;
    }
  }
  // Buscar por rutas de instalación conocidas (último segmento)
  for (const partial of game.installPaths) {
    const lastSegment = partial.split("\\").pop()?.toLowerCase() ?? "";
    if (!lastSegment) continue;
    for (const [key, installPath] of epicDirs) {
      if (key.includes(lastSegment) || lastSegment.includes(key)) {
        return installPath;
      }
    }
  }
  return null;
}

/**
 * Detecta qué juegos conocidos están actualmente en ejecución escaneando
 * la lista de procesos del sistema.
 *
 * Solo muestra juegos que tengan su ejecutable principal corriendo ahora mismo.
 * No escanea el disco, por lo que no genera falsos positivos por launchers
 * instalados (Epic Games Launcher, Steam, etc.) cuando el juego no está abierto.
 *
 * Si un juego se detecta por ejecución, se intenta además localizar su ruta
 * de instalación en disco para mostrarla como información adicional, sin que
 * eso afecte a si el juego aparece o no en la lista.
 */
export async function detectInstalledGames(): Promise<DetectedGame[]> {
  // Buscar juegos cuyos procesos estén activos ahora mismo
  const processes   = await getProcessList();
  const runningExes = new Set(processes.map((p) => p.name.toLowerCase()));

  const runningGames = new Map<string, DetectedGame>();

  for (const game of KNOWN_GAMES) {
    const mainExeLower = game.mainExe.toLowerCase();

    // Solo detectar si el ejecutable PRINCIPAL está corriendo.
    // Si únicamente hay un launcher activo (Battle.net, EADesktop, Epic…)
    // pero el juego en sí no está abierto, lo ignoramos.
    if (!runningExes.has(mainExeLower)) continue;

    // El mainExe está corriendo: es una detección real, no un falso positivo de launcher.
    const roots     = getGameRootDirs();
    const steamLibs = getSteamLibraryDirs();
    roots.push(...steamLibs);
    const epicDirs  = getEpicInstallDirs();
    let installPath = findInstallPath(game, roots);
    if (!installPath) installPath = findEpicInstallPath(game, epicDirs);

    runningGames.set(game.id, { game, running: true, installPath });
  }

  return [...runningGames.values()];
}
