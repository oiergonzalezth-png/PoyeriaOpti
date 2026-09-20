import fs from "fs";
import path from "path";
import type { AppSettings } from "@shared/types/system";
import { sanitizeSettingsPatch } from "../security/validation";

export const DEFAULT_SETTINGS: AppSettings = {
  startWithWindows: false,
  minimizeToTray: false,
  notificationsEnabled: true,
  theme: "dark",
  language: "es"
};

export class SettingsStore {
  private readonly filePath: string;

  constructor(dataDir: string, fileName = "settings.json") {
    this.filePath = path.join(dataDir, fileName);
  }

  read(): AppSettings {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...sanitizeSettingsPatch(parsed) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  write(settings: AppSettings): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
  }

  update(partial: Partial<AppSettings>): AppSettings {
    const next = { ...this.read(), ...sanitizeSettingsPatch(partial) };
    this.write(next);
    return next;
  }
}
