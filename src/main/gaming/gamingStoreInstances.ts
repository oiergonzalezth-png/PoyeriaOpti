import { app } from "electron";
import { GameProfilesStore } from "./gameProfilesStore";
import { GamingSessionStateStore } from "./gamingSessionStateStore";

let profilesInstance: GameProfilesStore | null = null;
let sessionInstance: GamingSessionStateStore | null = null;

export function getGameProfilesStore(): GameProfilesStore {
  if (!profilesInstance) {
    profilesInstance = new GameProfilesStore(app.getPath("userData"));
  }
  return profilesInstance;
}

export function getGamingSessionStateStore(): GamingSessionStateStore {
  if (!sessionInstance) {
    sessionInstance = new GamingSessionStateStore(app.getPath("userData"));
  }
  return sessionInstance;
}
