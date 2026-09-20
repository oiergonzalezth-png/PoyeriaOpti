/**
 * Tipos compartidos entre main, preload y renderer.
 * Cualquier dato "desconocido" debe representarse como `null`, nunca inventado.
 */

export interface CpuInfo {
  manufacturer: string | null;
  brand: string | null;
  physicalCores: number | null;
  logicalCores: number | null;
  speedGhz: number | null;
  currentLoadPercent: number | null;
  /** Temperatura del "package" del CPU en °C. `null` si el sensor no está disponible
   * (frecuente en VMs, contenedores y algunos portátiles sin soporte de lectura). */
  temperatureC: number | null;
}

export interface GpuInfo {
  vendor: string | null;
  model: string | null;
  vramMb: number | null;
}

export interface RamInfo {
  totalMb: number;
  usedMb: number;
  availableMb: number;
  usedPercent: number;
}

export interface DiskInfo {
  device: string;
  type: string | null;
  sizeGb: number;
  freeGb: number;
  usedPercent: number;
}

export type PhysicalDiskType = "SSD" | "NVMe" | "HDD" | null;

export interface PhysicalDiskInfo {
  name: string;
  /** Tipo físico normalizado. `null` si el sistema no lo reporta con certeza
   * (nunca se asume HDD/SSD sin dato real). */
  type: PhysicalDiskType;
  sizeGb: number | null;
  interfaceType: string | null;
}

export interface OsInfo {
  platform: string;
  distro: string | null;
  release: string | null;
  build: string | null;
  arch: string;
  /** Service Pack de Windows si aplica (p. ej. "Service Pack 1"). `null` si no aplica/no se detecta. */
  servicePack: string | null;
  /** true/false si se pudo determinar si el firmware es UEFI; `null` si no se pudo determinar. */
  uefi: boolean | null;
}

export interface HardwareSnapshot {
  timestamp: string;
  cpu: CpuInfo;
  gpu: GpuInfo[];
  ram: RamInfo;
  disks: DiskInfo[];
  physicalDisks: PhysicalDiskInfo[];
  os: OsInfo;
  /** true si el snapshot se generó en un sistema no-Windows (p. ej. entorno de desarrollo) */
  nonWindowsEnvironment: boolean;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
  status: string;
  /** true si este proceso está en la whitelist de procesos críticos y no debe poder cerrarse */
  critical: boolean;
}

export interface StartupItemInfo {
  id: string;
  name: string;
  command: string | null;
  location: string;
  hive: "HKCU" | "HKLM";
  /** true si desactivar/activar esta entrada requiere elevación de permisos
   * (siempre el caso para HKLM, nunca para HKCU). */
  requiresAdmin: boolean;
  enabled: boolean;
  /**
   * Estimación de impacto en el arranque. Windows calcula esto con telemetría
   * de arranque acumulada a lo largo del tiempo, que esta app todavía no
   * recopila. Se deja en `null` (mostrado como "N/A") en vez de inventar un
   * valor que parezca una medición real.
   */
  impact: "LOW" | "MEDIUM" | "HIGH" | null;
}

export type RecommendationLevel = "LOW" | "MEDIUM" | "HIGH";

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  suggestedAction: string;
  level: RecommendationLevel;
}

export type TweakRisk = "LOW" | "MEDIUM" | "HIGH";
export type TweakStatus = "NOT_APPLIED" | "APPLIED" | "UNKNOWN";

export interface TweakDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  risk: TweakRisk;
  impact: string;
  status: TweakStatus;
  requiresAdmin: boolean;
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  action: string;
  result: "SUCCESS" | "FAILURE";
  error: string | null;
}

export interface RestorePoint {
  id: string;
  tweakId: string;
  tweakName: string;
  /** Descripción legible del cambio concreto que se aplicó, p. ej.
   * "Se desactivó el inicio automático de OneDrive". */
  description: string;
  timestamp: string;
  previousValue: unknown;
  restored: boolean;
}

export interface OperationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Contrato completo de la API expuesta por el preload al renderer.
 * El renderer NUNCA accede a Node/Electron directamente: todo pasa por aquí.
 */
export interface SystemBridge {
  getHardwareSnapshot(): Promise<HardwareSnapshot>;
  getProcesses(): Promise<ProcessInfo[]>;
  killProcess(pid: number): Promise<OperationResult>;
  getStartupItems(): Promise<StartupItemInfo[]>;
  setStartupItemEnabled(id: string, enabled: boolean): Promise<OperationResult>;
  getStartupRestorePoints(): Promise<RestorePoint[]>;
  restoreStartupItem(restorePointId: string): Promise<OperationResult>;
  getLogs(): Promise<OperationLogEntry[]>;
}

export interface OptimizerBridge {
  listTweaks(): Promise<TweakDefinition[]>;
  applyTweak(id: string): Promise<OperationResult>;
  restoreTweak(id: string): Promise<OperationResult>;
  listRestorePoints(): Promise<RestorePoint[]>;
}

/**
 * Restore Center (Fase 4): vista central de TODOS los puntos de
 * restauración generados por cualquier módulo (Startup ahora, Optimizer en
 * la Fase 5, etc.), independientemente de qué modulo los creó.
 */
export interface BackupBridge {
  listAllRestorePoints(): Promise<RestorePoint[]>;
  restore(restorePointId: string): Promise<OperationResult>;
}

export interface WindowBridge {
  minimize(): Promise<void>;
  maximize(): Promise<boolean>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
}

export interface AppBridge {
  getVersion(): Promise<string>;
  getPlatform(): Promise<NodeJS.Platform>;
}

/** Prioridad de proceso segura que la app permite asignar. Deliberadamente
 * excluye "RealTime" (puede volver el sistema inestable) e "Idle" para el
 * juego (lo dejaría más lento, no más rápido). */
export type SafeProcessPriority = "NORMAL" | "HIGH";

export interface GameProfile {
  id: string;
  name: string;
  executablePath: string;
  priority: SafeProcessPriority;
  /** Nombres de proceso (p. ej. "discord.exe") que Gaming Mode nunca debe tocar para este perfil. */
  allowedProcesses: string[];
  /** Ids de tweaks del Optimizer que se aplican al activar este perfil y se revierten al desactivarlo. */
  selectedTweakIds: string[];
  createdAt: string;
}

export interface CreateGameProfileInput {
  name: string;
  executablePath: string;
  priority: SafeProcessPriority;
  allowedProcesses: string[];
  selectedTweakIds: string[];
}

export interface GamingModeStatus {
  active: boolean;
  profileId: string | null;
  profileName: string | null;
  activatedAt: string | null;
}

/** Información serializable de un juego detectado (sin funciones, apta para IPC) */
export interface DetectedGameInfo {
  id: string;
  name: string;
  mainExe: string;
  description: string;
  brandColor: string;
  logoSvg: string;
  recommendedTweakIds: string[];
  protectedProcesses: string[];
  running: boolean;
  installPath: string | null;
}

export interface GamingBridge {
  listProfiles(): Promise<GameProfile[]>;
  createProfile(input: CreateGameProfileInput): Promise<GameProfile>;
  deleteProfile(id: string): Promise<OperationResult>;
  getStatus(): Promise<GamingModeStatus>;
  activate(profileId: string | null): Promise<OperationResult>;
  deactivate(): Promise<OperationResult>;
  detectGames(): Promise<DetectedGameInfo[]>;
}

export interface NetworkAdapterInfo {
  name: string;
  /** "wired" | "wireless" | "virtual" | null si no se puede determinar con certeza. */
  type: string | null;
  ipv4: string | null;
  mac: string | null;
  speedMbps: number | null;
  isDefault: boolean;
}

export interface NetworkTestResult {
  timestamp: string;
  pingHost: string;
  latencyMs: number | null;
  jitterMs: number | null;
  packetLossPercent: number | null;
  /** Método usado para medir la latencia: icmp, tcp o https */
  pingMethod: "icmp" | "tcp" | "https" | null;
  downloadMbps: number | null;
  uploadMbps: number | null;
  dnsServers: string[];
  adapters: NetworkAdapterInfo[];
  /** Errores de sub-pruebas concretas (p. ej. "no se pudo medir la subida"), nunca ocultados. */
  errors: string[];
}

export interface NetworkBridge {
  getAdapters(): Promise<NetworkAdapterInfo[]>;
  getDnsServers(): Promise<string[]>;
  runNetworkTest(): Promise<NetworkTestResult>;
}

/**
 * Fase 8: benchmark antes/después. Solo mide lo que se puede medir de
 * verdad (uso de CPU/RAM/disco y número de procesos, reutilizando la
 * detección de hardware de la Fase 2 y el listado de procesos de la Fase
 * 1/3) — nunca cifras de FPS, que la app no puede medir honestamente sin
 * instrumentar el propio juego.
 */
export interface BenchmarkSnapshot {
  timestamp: string;
  cpuUsagePercent: number | null;
  ramUsagePercent: number | null;
  processCount: number | null;
  diskUsagePercent: number | null;
}

export interface BenchmarkState {
  before: BenchmarkSnapshot | null;
  after: BenchmarkSnapshot | null;
}

export interface BenchmarkBridge {
  getState(): Promise<BenchmarkState>;
  captureBefore(): Promise<BenchmarkSnapshot>;
  captureAfter(): Promise<BenchmarkSnapshot>;
  reset(): Promise<void>;
}

/**
 * Fase 9: ajustes de la app + arquitectura de internacionalización.
 * `startWithWindows` y `minimizeToTray` son funcionalidad real (no
 * decorativa): activarlos escribe/borra de verdad la entrada de inicio
 * propia de la app, y crea/usa de verdad el icono de la bandeja.
 */
export type AppTheme = "dark" | "light";
export type AppLanguage = "es" | "en";

export interface AppSettings {
  startWithWindows: boolean;
  minimizeToTray: boolean;
  notificationsEnabled: boolean;
  theme: AppTheme;
  language: AppLanguage;
}

export interface SettingsBridge {
  getSettings(): Promise<AppSettings>;
  updateSettings(partial: Partial<AppSettings>): Promise<AppSettings>;
  showTestNotification(): Promise<OperationResult>;
}

/**
 * Caché "limpiable" (Optimizador → Red/Sistema/General): a diferencia de un
 * `Tweak`, limpiar una caché no es reversible (no hay "valor anterior" que
 * restaurar para un fichero borrado), así que vive en su propio dominio en
 * vez de en `tweakRegistry`.
 */
export type CacheScope = "network" | "apps" | "windows";

export interface CacheTargetInfo {
  id: string;
  /** Nombre visible, p. ej. "Discord" o "Caché de Internet de Windows". */
  name: string;
  description: string;
  scope: CacheScope;
  /**
   * Para `scope: "apps"`, si la app se detectó instalada en este equipo
   * (una carpeta conocida existe). Para `network`/`windows` siempre `true`:
   * son rutas propias de Windows, no dependen de que un tercero esté instalado.
   */
  detected: boolean;
  /** Tamaño actual en bytes. `null` si no se pudo medir (rutas inaccesibles, no-Windows). */
  sizeBytes: number | null;
  requiresAdmin: boolean;
}

export interface CacheBridge {
  scan(): Promise<CacheTargetInfo[]>;
  clear(id: string): Promise<OperationResult>;
  flushDns(): Promise<OperationResult>;
}

// ─── Sistema de actualizaciones ──────────────────────────────────────────────

export interface UpdateInfo {
  latestVersion: string;
  currentVersion: string;
  updateAvailable: boolean;
  releaseName: string;
  releaseNotes: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percent: number;
}

export type UpdateStatus =
  | "idle"
  | "checking"
  | "update-available"
  | "up-to-date"
  | "downloading"
  | "ready-to-install"
  | "error";

export interface UpdateState {
  status: UpdateStatus;
  info: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
}

export interface UpdateBridge {
  getState(): Promise<UpdateState>;
  check(): Promise<UpdateInfo>;
  install(): Promise<void>;
  /** Suscribe al renderer a cambios de estado del updater (push desde main). */
  onState(cb: (state: UpdateState) => void): () => void;
}
