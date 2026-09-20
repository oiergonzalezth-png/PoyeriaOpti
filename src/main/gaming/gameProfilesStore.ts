import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { GameProfile, CreateGameProfileInput } from "@shared/types/system";

export class GameProfilesStore {
  private readonly filePath: string;

  constructor(dataDir: string, fileName = "game-profiles.json") {
    this.filePath = path.join(dataDir, fileName);
  }

  private readAll(): GameProfile[] {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(profiles: GameProfile[]): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(profiles, null, 2), "utf-8");
  }

  list(): GameProfile[] {
    return this.readAll();
  }

  getById(id: string): GameProfile | null {
    return this.readAll().find((p) => p.id === id) ?? null;
  }

  create(input: CreateGameProfileInput): GameProfile {
    const profile: GameProfile = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      executablePath: input.executablePath.trim(),
      priority: input.priority,
      allowedProcesses: input.allowedProcesses.map((n) => n.trim()).filter(Boolean),
      selectedTweakIds: [...input.selectedTweakIds],
      createdAt: new Date().toISOString()
    };
    const profiles = this.readAll();
    profiles.push(profile);
    this.writeAll(profiles);
    return profile;
  }

  delete(id: string): boolean {
    const profiles = this.readAll();
    const next = profiles.filter((p) => p.id !== id);
    if (next.length === profiles.length) return false;
    this.writeAll(next);
    return true;
  }
}
