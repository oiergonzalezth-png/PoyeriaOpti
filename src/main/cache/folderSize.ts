import fs from "fs/promises";
import path from "path";

/**
 * Límite de entradas a visitar por carpeta al medir/borrar. Una caché
 * corrupta o enorme (cientos de miles de ficheros) no debe poder colgar la
 * app: por encima de este límite se deja de contar/borrar y se marca el
 * resultado como parcial en vez de bloquearse indefinidamente.
 */
const MAX_ENTRIES = 60000;

export interface FolderScanResult {
  /** Tamaño total en bytes de lo que se pudo leer. */
  sizeBytes: number;
  /** true si la carpeta existe (aunque esté vacía o inaccesible en parte). */
  exists: boolean;
}

async function walk(dir: string, visit: (fullPath: string, isDir: boolean) => Promise<void>, budget: { left: number }): Promise<void> {
  if (budget.left <= 0) return;
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return; // carpeta inaccesible o inexistente: se trata como vacía
  }

  for (const entry of entries) {
    if (budget.left <= 0) return;
    budget.left--;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !entry.isSymbolicLink()) {
      await visit(full, true);
      await walk(full, visit, budget);
    } else if (entry.isFile()) {
      await visit(full, false);
    }
    // symlinks y otros tipos especiales se ignoran a propósito: nunca seguimos
    // enlaces fuera de la carpeta de caché.
  }
}

/** Mide el tamaño total de una carpeta (recursivo, con límite de entradas). */
export async function getFolderSize(dir: string): Promise<FolderScanResult> {
  try {
    await fs.access(dir);
  } catch {
    return { sizeBytes: 0, exists: false };
  }

  let sizeBytes = 0;
  const budget = { left: MAX_ENTRIES };
  await walk(
    dir,
    async (full, isDir) => {
      if (isDir) return;
      try {
        const stat = await fs.stat(full);
        sizeBytes += stat.size;
      } catch {
        // el fichero pudo borrarse/bloquearse entre el listado y el stat; se ignora
      }
    },
    budget
  );

  return { sizeBytes, exists: true };
}

export interface ClearFolderResult {
  /** Bytes liberados de verdad (ficheros que sí se pudieron borrar). */
  freedBytes: number;
  /** Ficheros que no se pudieron borrar (normalmente porque la app que los usa sigue abierta). */
  failedCount: number;
}

/** Borra el CONTENIDO de una carpeta (nunca la carpeta en sí), ignorando ficheros bloqueados. */
export async function clearFolderContents(dir: string): Promise<ClearFolderResult> {
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return { freedBytes: 0, failedCount: 0 }; // no existe: nada que limpiar
  }

  let freedBytes = 0;
  let failedCount = 0;
  const budget = { left: MAX_ENTRIES };

  for (const entry of entries) {
    if (budget.left <= 0) break;
    const full = path.join(dir, entry.name);
    try {
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        const before = await getFolderSize(full);
        await fs.rm(full, { recursive: true, force: true });
        freedBytes += before.sizeBytes;
      } else if (entry.isFile()) {
        const stat = await fs.stat(full).catch(() => null);
        await fs.rm(full, { force: true });
        freedBytes += stat?.size ?? 0;
      }
    } catch {
      failedCount++; // fichero en uso por la propia app (típico si sigue abierta): se deja
    }
    budget.left--;
  }

  return { freedBytes, failedCount };
}
