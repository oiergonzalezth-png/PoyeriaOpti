import type {
  SystemBridge,
  OptimizerBridge,
  AppBridge,
  BackupBridge,
  GamingBridge,
  NetworkBridge,
  BenchmarkBridge,
  SettingsBridge,
  WindowBridge,
  CacheBridge,
  UpdateBridge
} from "@shared/types/system";

declare global {
  interface Window {
    system: SystemBridge;
    optimizer: OptimizerBridge;
    app: AppBridge;
    backup: BackupBridge;
    gaming: GamingBridge;
    network: NetworkBridge;
    benchmark: BenchmarkBridge;
    settings: SettingsBridge;
    windowControls: WindowBridge;
    cache: CacheBridge;
    updater: UpdateBridge;
  }
}

export {};
