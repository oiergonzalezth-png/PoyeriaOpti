import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "@shared/constants/ipcChannels";
import type {
  SystemBridge,
  OptimizerBridge,
  AppBridge,
  BackupBridge,
  GamingBridge,
  NetworkBridge,
  BenchmarkBridge,
  SettingsBridge,
  ProcessInfo,
  OperationResult,
  StartupItemInfo,
  RestorePoint,
  GameProfile,
  CreateGameProfileInput,
  GamingModeStatus,
  DetectedGameInfo,
  NetworkAdapterInfo,
  NetworkTestResult,
  BenchmarkState,
  BenchmarkSnapshot,
  AppSettings,
  CacheBridge,
  CacheTargetInfo,
  UpdateBridge,
  UpdateState
} from "@shared/types/system";

/**
 * El renderer NUNCA recibe `ipcRenderer` ni ninguna API de Node directamente.
 * Solo se exponen estas funciones concretas y tipadas (regla #16).
 */
const systemBridge: SystemBridge = {
  getHardwareSnapshot: () => ipcRenderer.invoke(IpcChannels.system.getHardwareSnapshot),
  getProcesses: (): Promise<ProcessInfo[]> => ipcRenderer.invoke(IpcChannels.system.getProcesses),
  killProcess: (pid: number): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.system.killProcess, pid),
  getStartupItems: (): Promise<StartupItemInfo[]> => ipcRenderer.invoke(IpcChannels.system.getStartupItems),
  setStartupItemEnabled: (id: string, enabled: boolean): Promise<OperationResult> =>
    ipcRenderer.invoke(IpcChannels.system.setStartupItemEnabled, id, enabled),
  getStartupRestorePoints: (): Promise<RestorePoint[]> => ipcRenderer.invoke(IpcChannels.system.getStartupRestorePoints),
  restoreStartupItem: (restorePointId: string): Promise<OperationResult> =>
    ipcRenderer.invoke(IpcChannels.system.restoreStartupItem, restorePointId),
  getLogs: () => ipcRenderer.invoke(IpcChannels.system.getLogs)
};

const optimizerBridge: OptimizerBridge = {
  listTweaks: () => ipcRenderer.invoke(IpcChannels.optimizer.listTweaks),
  applyTweak: (id: string) => ipcRenderer.invoke(IpcChannels.optimizer.applyTweak, id),
  restoreTweak: (id: string) => ipcRenderer.invoke(IpcChannels.optimizer.restoreTweak, id),
  listRestorePoints: () => ipcRenderer.invoke(IpcChannels.optimizer.listRestorePoints)
};

const appBridge: AppBridge = {
  getVersion: () => ipcRenderer.invoke(IpcChannels.app.getVersion),
  getPlatform: () => ipcRenderer.invoke(IpcChannels.app.getPlatform)
};

const backupBridge: BackupBridge = {
  listAllRestorePoints: () => ipcRenderer.invoke(IpcChannels.backup.listAllRestorePoints),
  restore: (restorePointId: string) => ipcRenderer.invoke(IpcChannels.backup.restore, restorePointId)
};

const gamingBridge: GamingBridge = {
  listProfiles: (): Promise<GameProfile[]> => ipcRenderer.invoke(IpcChannels.gaming.listProfiles),
  createProfile: (input: CreateGameProfileInput): Promise<GameProfile> =>
    ipcRenderer.invoke(IpcChannels.gaming.createProfile, input),
  deleteProfile: (id: string): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.gaming.deleteProfile, id),
  getStatus: (): Promise<GamingModeStatus> => ipcRenderer.invoke(IpcChannels.gaming.getStatus),
  activate: (profileId: string | null): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.gaming.activate, profileId),
  deactivate: (): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.gaming.deactivate),
  detectGames: (): Promise<DetectedGameInfo[]> => ipcRenderer.invoke(IpcChannels.gaming.detectGames)
};

const networkBridge: NetworkBridge = {
  getAdapters: (): Promise<NetworkAdapterInfo[]> => ipcRenderer.invoke(IpcChannels.network.getAdapters),
  getDnsServers: (): Promise<string[]> => ipcRenderer.invoke(IpcChannels.network.getDnsServers),
  runNetworkTest: (): Promise<NetworkTestResult> => ipcRenderer.invoke(IpcChannels.network.runNetworkTest)
};

const benchmarkBridge: BenchmarkBridge = {
  getState: (): Promise<BenchmarkState> => ipcRenderer.invoke(IpcChannels.benchmark.getState),
  captureBefore: (): Promise<BenchmarkSnapshot> => ipcRenderer.invoke(IpcChannels.benchmark.captureBefore),
  captureAfter: (): Promise<BenchmarkSnapshot> => ipcRenderer.invoke(IpcChannels.benchmark.captureAfter),
  reset: (): Promise<void> => ipcRenderer.invoke(IpcChannels.benchmark.reset)
};

const settingsBridge: SettingsBridge = {
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke(IpcChannels.settings.getSettings),
  updateSettings: (partial: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke(IpcChannels.settings.updateSettings, partial),
  showTestNotification: (): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.settings.showTestNotification)
};

const cacheBridge: CacheBridge = {
  scan: (): Promise<CacheTargetInfo[]> => ipcRenderer.invoke(IpcChannels.cache.scan),
  clear: (id: string): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.cache.clear, id),
  flushDns: (): Promise<OperationResult> => ipcRenderer.invoke(IpcChannels.cache.flushDns)
};

const windowBridge = {
  minimize: () => ipcRenderer.invoke(IpcChannels.window.minimize),
  maximize: () => ipcRenderer.invoke(IpcChannels.window.maximize),
  close: () => ipcRenderer.invoke(IpcChannels.window.close),
  isMaximized: () => ipcRenderer.invoke(IpcChannels.window.isMaximized)
};

const updateBridge: UpdateBridge = {
  getState: () => ipcRenderer.invoke(IpcChannels.update.getState),
  check:    () => ipcRenderer.invoke(IpcChannels.update.check),
  install:  () => ipcRenderer.invoke(IpcChannels.update.install),
  onState:  (cb: (state: UpdateState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: UpdateState) => cb(state);
    ipcRenderer.on(IpcChannels.update.onState, handler);
    return () => ipcRenderer.off(IpcChannels.update.onState, handler);
  }
};

contextBridge.exposeInMainWorld("system", systemBridge);
contextBridge.exposeInMainWorld("optimizer", optimizerBridge);
contextBridge.exposeInMainWorld("app", appBridge);
contextBridge.exposeInMainWorld("backup", backupBridge);
contextBridge.exposeInMainWorld("gaming", gamingBridge);
contextBridge.exposeInMainWorld("network", networkBridge);
contextBridge.exposeInMainWorld("benchmark", benchmarkBridge);
contextBridge.exposeInMainWorld("settings", settingsBridge);
contextBridge.exposeInMainWorld("cache", cacheBridge);
contextBridge.exposeInMainWorld("windowControls", windowBridge);
contextBridge.exposeInMainWorld("updater", updateBridge);
