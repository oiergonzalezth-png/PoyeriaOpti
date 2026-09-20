import type { AppSettings, CreateGameProfileInput, SafeProcessPriority } from "@shared/types/system";

/**
 * Validación de entradas que llegan por IPC. El renderer es la parte menos
 * confiable de la app: aunque TypeScript diga que un argumento es un
 * `number` o un `string`, en tiempo de ejecución puede ser cualquier cosa.
 * Todo lo que llega del renderer se valida aquí antes de usarse.
 */

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export function isValidPid(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff;
}

export function isBoundedString(value: unknown, maxLength = 512): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength && !CONTROL_CHARS.test(value);
}

export function isHexString(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0 && value.length <= 4096;
}

export interface ParsedStartupId {
  hive: "HKCU" | "HKLM";
  name: string;
}

/** Interpreta ids con forma `HKCU::Nombre` / `HKLM::Nombre`, rechazando cualquier otra cosa. */
export function parseStartupItemId(id: unknown): ParsedStartupId | null {
  if (!isBoundedString(id, 400)) return null;
  const separator = id.indexOf("::");
  if (separator === -1) return null;
  const hive = id.slice(0, separator);
  const name = id.slice(separator + 2);
  if ((hive !== "HKCU" && hive !== "HKLM") || name.length === 0 || name.length > 260) return null;
  return { hive, name };
}

/**
 * Devuelve SOLO las claves conocidas de `AppSettings` con el tipo correcto.
 * Cualquier clave desconocida o valor de tipo incorrecto se descarta, de modo
 * que un renderer comprometido no pueda escribir datos arbitrarios en
 * settings.json.
 */
export function sanitizeSettingsPatch(input: unknown): Partial<AppSettings> {
  const out: Partial<AppSettings> = {};
  if (typeof input !== "object" || input === null) return out;
  const src = input as Record<string, unknown>;

  if (typeof src.startWithWindows === "boolean") out.startWithWindows = src.startWithWindows;
  if (typeof src.minimizeToTray === "boolean") out.minimizeToTray = src.minimizeToTray;
  if (typeof src.notificationsEnabled === "boolean") out.notificationsEnabled = src.notificationsEnabled;
  if (src.theme === "dark" || src.theme === "light") out.theme = src.theme;
  if (src.language === "es" || src.language === "en") out.language = src.language;

  return out;
}

const FORBIDDEN_PATH_CHARS = /[<>"|?*]/;

function sanitizeStringList(value: unknown, maxItems: number, maxLength: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxItems) return null;
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") return null;
    const trimmed = item.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.length > maxLength || CONTROL_CHARS.test(trimmed)) return null;
    out.push(trimmed);
  }
  return out;
}

/** Valida y normaliza el formulario de perfil de juego. Devuelve `null` si algo no es válido. */
export function sanitizeCreateGameProfileInput(input: unknown): CreateGameProfileInput | null {
  if (typeof input !== "object" || input === null) return null;
  const src = input as Record<string, unknown>;

  if (typeof src.name !== "string" || typeof src.executablePath !== "string") return null;
  const name = src.name.trim();
  const executablePath = src.executablePath.trim();

  if (name.length === 0 || name.length > 80 || CONTROL_CHARS.test(name)) return null;
  if (executablePath.length === 0 || executablePath.length > 260) return null;
  if (CONTROL_CHARS.test(executablePath) || FORBIDDEN_PATH_CHARS.test(executablePath)) return null;
  if (!/\.exe$/i.test(executablePath)) return null;

  if (src.priority !== "HIGH" && src.priority !== "NORMAL") return null;
  const priority: SafeProcessPriority = src.priority;

  const allowedProcesses = sanitizeStringList(src.allowedProcesses, 50, 128);
  const selectedTweakIds = sanitizeStringList(src.selectedTweakIds, 50, 128);
  if (!allowedProcesses || !selectedTweakIds) return null;

  return { name, executablePath, priority, allowedProcesses, selectedTweakIds };
}
