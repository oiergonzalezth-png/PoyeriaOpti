import { app } from "electron";
import { SettingsStore } from "./settingsStore";

let instance: SettingsStore | null = null;

export function getSettingsStore(): SettingsStore {
  if (!instance) {
    instance = new SettingsStore(app.getPath("userData"));
  }
  return instance;
}
