import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { RestorePoint } from "@shared/types/system";

/**
 * Store genérico de puntos de restauración en un fichero JSON local.
 * No depende de `electron.app` directamente: recibe el directorio donde
 * guardar el fichero, para poder testear esta lógica con Vitest (fuera de
 * Electron) usando un directorio temporal.
 */
export class RestorePointsStore {
  private readonly filePath: string;

  constructor(dataDir: string, fileName = "restore-points.json") {
    this.filePath = path.join(dataDir, fileName);
  }

  private readAll(): RestorePoint[] {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(points: RestorePoint[]): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(points, null, 2), "utf-8");
  }

  list(): RestorePoint[] {
    return this.readAll().sort((a, b) => {
      if (a.timestamp === b.timestamp) return 0;
      return a.timestamp < b.timestamp ? 1 : -1;
    });
  }

  getById(id: string): RestorePoint | null {
    return this.readAll().find((p) => p.id === id) ?? null;
  }

  /** Último punto de restauración sin restaurar todavía para un `tweakId` dado. */
  getLatestUnrestored(tweakId: string): RestorePoint | null {
    const candidates = this.readAll()
      .filter((p) => p.tweakId === tweakId && !p.restored)
      .sort((a, b) => {
        if (a.timestamp === b.timestamp) return 0;
        return a.timestamp < b.timestamp ? 1 : -1;
      });
    return candidates[0] ?? null;
  }

  add(entry: Omit<RestorePoint, "id" | "timestamp" | "restored">): RestorePoint {
    const point: RestorePoint = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      restored: false,
      ...entry
    };
    const points = this.readAll();
    points.unshift(point);
    // Límite razonable para no crecer indefinidamente.
    this.writeAll(points.slice(0, 300));
    return point;
  }

  markRestored(id: string): void {
    const points = this.readAll().map((p) => (p.id === id ? { ...p, restored: true } : p));
    this.writeAll(points);
  }
}
