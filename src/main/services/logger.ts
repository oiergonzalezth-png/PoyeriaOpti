import { app } from "electron";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { OperationLogEntry } from "@shared/types/system";

/**
 * Logger local en JSON. Nunca debe recibir datos sensibles (contraseñas,
 * rutas de documentos personales, contenido de archivos, etc.) — solo
 * metadatos de la operación en sí (ver regla #18 del proyecto).
 */
function getLogFilePath(): string {
  const dir = app.getPath("userData");
  return path.join(dir, "operation-log.json");
}

function readLogFile(): OperationLogEntry[] {
  try {
    const raw = fs.readFileSync(getLogFilePath(), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLogFile(entries: OperationLogEntry[]): void {
  const dir = path.dirname(getLogFilePath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getLogFilePath(), JSON.stringify(entries, null, 2), "utf-8");
}

export function logOperation(
  action: string,
  result: "SUCCESS" | "FAILURE",
  error: string | null = null
): OperationLogEntry {
  const entry: OperationLogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    result,
    error
  };

  const entries = readLogFile();
  entries.unshift(entry);
  // Limitar el histórico para no crecer indefinidamente.
  writeLogFile(entries.slice(0, 500));

  return entry;
}

export function getOperationLogs(): OperationLogEntry[] {
  return readLogFile();
}
