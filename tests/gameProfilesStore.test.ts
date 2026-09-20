import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { GameProfilesStore } from "../src/main/gaming/gameProfilesStore";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "leo-gameprofiles-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("GameProfilesStore", () => {
  it("empieza vacío", () => {
    const store = new GameProfilesStore(tmpDir);
    expect(store.list()).toEqual([]);
  });

  it("crea un perfil con id y fecha generados, y recorta los procesos permitidos", () => {
    const store = new GameProfilesStore(tmpDir);
    const profile = store.create({
      name: "Valorant",
      executablePath: "C:\\Games\\Valorant\\VALORANT.exe",
      priority: "HIGH",
      allowedProcesses: [" discord.exe ", "", "obs64.exe"],
      selectedTweakIds: ["disable-game-dvr"]
    });

    expect(profile.id).toBeTruthy();
    expect(profile.createdAt).toBeTruthy();
    expect(profile.allowedProcesses).toEqual(["discord.exe", "obs64.exe"]);
    expect(store.list()).toHaveLength(1);
  });

  it("recupera un perfil por id", () => {
    const store = new GameProfilesStore(tmpDir);
    const created = store.create({
      name: "CS2",
      executablePath: "cs2.exe",
      priority: "HIGH",
      allowedProcesses: [],
      selectedTweakIds: []
    });
    expect(store.getById(created.id)?.name).toBe("CS2");
    expect(store.getById("no-existe")).toBeNull();
  });

  it("elimina un perfil existente y devuelve false si no existe", () => {
    const store = new GameProfilesStore(tmpDir);
    const created = store.create({
      name: "Minecraft",
      executablePath: "minecraft.exe",
      priority: "NORMAL",
      allowedProcesses: [],
      selectedTweakIds: []
    });

    expect(store.delete("no-existe")).toBe(false);
    expect(store.delete(created.id)).toBe(true);
    expect(store.list()).toHaveLength(0);
  });
});
