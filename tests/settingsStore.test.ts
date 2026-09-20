import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { SettingsStore, DEFAULT_SETTINGS } from "../src/main/settings/settingsStore";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "leo-settings-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("SettingsStore", () => {
  it("devuelve los valores por defecto si no existe el fichero", () => {
    const store = new SettingsStore(tmpDir);
    expect(store.read()).toEqual(DEFAULT_SETTINGS);
  });

  it("update() combina con lo existente y persiste", () => {
    const store = new SettingsStore(tmpDir);
    const result = store.update({ theme: "light", language: "en" });

    expect(result.theme).toBe("light");
    expect(result.language).toBe("en");
    expect(result.notificationsEnabled).toBe(DEFAULT_SETTINGS.notificationsEnabled); // resto sin tocar

    const store2 = new SettingsStore(tmpDir);
    expect(store2.read().theme).toBe("light");
  });

  it("un fichero corrupto no rompe la lectura: cae a los valores por defecto", () => {
    const store = new SettingsStore(tmpDir);
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "settings.json"), "{ esto no es json", "utf-8");
    expect(store.read()).toEqual(DEFAULT_SETTINGS);
  });
});
