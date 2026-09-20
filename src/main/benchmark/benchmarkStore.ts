import fs from "fs";
import path from "path";
import type { BenchmarkState, BenchmarkSnapshot } from "@shared/types/system";

const EMPTY_STATE: BenchmarkState = { before: null, after: null };

export class BenchmarkStore {
  private readonly filePath: string;

  constructor(dataDir: string, fileName = "benchmark-state.json") {
    this.filePath = path.join(dataDir, fileName);
  }

  read(): BenchmarkState {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...EMPTY_STATE, ...parsed };
    } catch {
      return { ...EMPTY_STATE };
    }
  }

  private write(state: BenchmarkState): void {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf-8");
  }

  setBefore(snapshot: BenchmarkSnapshot): void {
    // Capturar un nuevo "before" empieza una nueva comparación: se descarta cualquier "after" previo.
    this.write({ before: snapshot, after: null });
  }

  setAfter(snapshot: BenchmarkSnapshot): void {
    const current = this.read();
    this.write({ before: current.before, after: snapshot });
  }

  reset(): void {
    this.write({ ...EMPTY_STATE });
  }
}
