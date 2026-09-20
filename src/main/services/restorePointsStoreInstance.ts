import { app } from "electron";
import { RestorePointsStore } from "./restorePointsStore";

let instance: RestorePointsStore | null = null;

export function getRestorePointsStore(): RestorePointsStore {
  if (!instance) {
    instance = new RestorePointsStore(app.getPath("userData"));
  }
  return instance;
}
