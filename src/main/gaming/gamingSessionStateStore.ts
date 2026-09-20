import fs from "fs";
import path from "path";

export interface TouchedProcessEntry {
  pid: number;
  previousPriority: string;
}

export interface GamingSessionState {
  active: boolean;
  profileId: string | null;
  profileName: string | null;
  activatedAt: string | null;
  /** Procesos en segundo plano cuya prioridad se bajó, con su prioridad original para poder revertirla. */
  touchedProcesses: TouchedProcessEntry[];
  /** PID del propio juego cuya prioridad se subió, y su prioridad original. */
  gameProcess: TouchedProcessEntry | null;
  /** Tweaks del Optimizer aplicados al activar este perfil (para revertirlos al desactivar). */
  appliedTweakIds: string[];
}

const EMPTY_STATE: GamingSessionState = {
  active: false,
  profileId: null,
  profileName: null,
  activatedAt: null,
  touchedProcesses: [],
  gameProcess: null,
  appliedTweakIds: []
};

export class GamingSessionStateStore {
  private readonly filePath: string;

  constructor(dataDir: string, fileName = "gaming-session-state.json") {
    this.filePath = path.join(dataDir, fileName);
  }

  read(): GamingSessionState {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...EMPTY_STATE, ...parsed };
    } catch {
      return { ...EMPTY_STATE };
    }
  }

  write(state: GamingSessionState): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf-8");
  }

  reset(): void {
    this.write({ ...EMPTY_STATE });
  }
}
