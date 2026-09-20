import { IpcChannels } from "@shared/constants/ipcChannels";
import { captureBenchmarkSnapshot } from "../benchmark/snapshot";
import { getBenchmarkStore } from "../benchmark/benchmarkStoreInstance";
import { secureHandle } from "./secureHandle";

export function registerBenchmarkHandlers(): void {
  secureHandle(IpcChannels.benchmark.getState, async () => {
    return getBenchmarkStore().read();
  });

  secureHandle(IpcChannels.benchmark.captureBefore, async () => {
    const snapshot = await captureBenchmarkSnapshot();
    getBenchmarkStore().setBefore(snapshot);
    return snapshot;
  });

  secureHandle(IpcChannels.benchmark.captureAfter, async () => {
    const snapshot = await captureBenchmarkSnapshot();
    getBenchmarkStore().setAfter(snapshot);
    return snapshot;
  });

  secureHandle(IpcChannels.benchmark.reset, async () => {
    getBenchmarkStore().reset();
  });
}
