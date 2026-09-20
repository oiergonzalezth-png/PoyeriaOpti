/**
 * Nombres de canal IPC. Se centralizan aquí para que main y preload
 * nunca puedan desincronizarse por un typo en un string suelto.
 */
export const IpcChannels = {
  system: {
    getHardwareSnapshot: "system:get-hardware-snapshot",
    getProcesses: "system:get-processes",
    killProcess: "system:kill-process",
    getStartupItems: "system:get-startup-items",
    setStartupItemEnabled: "system:set-startup-item-enabled",
    getStartupRestorePoints: "system:get-startup-restore-points",
    restoreStartupItem: "system:restore-startup-item",
    getLogs: "system:get-logs"
  },
  optimizer: {
    listTweaks: "optimizer:list-tweaks",
    applyTweak: "optimizer:apply-tweak",
    restoreTweak: "optimizer:restore-tweak",
    listRestorePoints: "optimizer:list-restore-points"
  },
  backup: {
    listAllRestorePoints: "backup:list-all-restore-points",
    restore: "backup:restore"
  },
  app: {
    getVersion: "app:get-version",
    getPlatform: "app:get-platform"
  },
  gaming: {
    listProfiles: "gaming:list-profiles",
    createProfile: "gaming:create-profile",
    deleteProfile: "gaming:delete-profile",
    getStatus: "gaming:get-status",
    activate: "gaming:activate",
    deactivate: "gaming:deactivate",
    detectGames: "gaming:detect-games"
  },
  network: {
    getAdapters: "network:get-adapters",
    getDnsServers: "network:get-dns-servers",
    runNetworkTest: "network:run-test"
  },
  benchmark: {
    getState: "benchmark:get-state",
    captureBefore: "benchmark:capture-before",
    captureAfter: "benchmark:capture-after",
    reset: "benchmark:reset"
  },
  window: {
    minimize: "window:minimize",
    maximize: "window:maximize",
    close: "window:close",
    isMaximized: "window:is-maximized"
  },
  settings: {
    getSettings: "settings:get-settings",
    updateSettings: "settings:update-settings",
    showTestNotification: "settings:show-test-notification"
  },
  cache: {
    scan: "cache:scan",
    clear: "cache:clear",
    flushDns: "cache:flush-dns"
  },
  update: {
    getState:   "update:get-state",
    check:      "update:check",
    install:    "update:install",
    onState:    "update:on-state"
  }
} as const;
