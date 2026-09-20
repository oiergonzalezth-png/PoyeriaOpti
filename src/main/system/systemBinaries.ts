import path from "path";

/**
 * Herramientas de Windows que la app invoca. Se resuelven SIEMPRE a su ruta
 * absoluta dentro de %SystemRoot%\System32, en vez de dejar que Windows las
 * busque en el PATH o en el directorio actual: así un ejecutable malicioso
 * con el mismo nombre (p. ej. un `reg.exe` en el PATH del usuario) nunca se
 * ejecuta en lugar del original ("search-order hijacking").
 */
export type SystemBinary = "reg" | "powershell" | "powercfg" | "sc" | "ping" | "ipconfig";

export function resolveSystemBinary(
  name: SystemBinary,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): string {
  // Fuera de Windows (desarrollo/tests) se usa el nombre tal cual.
  if (platform !== "win32") return name;

  const root = env.SystemRoot || env.windir || "C:\\Windows";
  const system32 = path.win32.join(root, "System32");

  if (name === "powershell") {
    return path.win32.join(system32, "WindowsPowerShell", "v1.0", "powershell.exe");
  }
  return path.win32.join(system32, `${name}.exe`);
}
