import { app } from "electron";
import { BenchmarkStore } from "./benchmarkStore";

let instance: BenchmarkStore | null = null;

export function getBenchmarkStore(): BenchmarkStore {
  if (!instance) {
    instance = new BenchmarkStore(app.getPath("userData"));
  }
  return instance;
}
